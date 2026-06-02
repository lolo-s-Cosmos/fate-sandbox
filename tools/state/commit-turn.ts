import type { TurnCommitEvent, TurnCommitInput } from "../../engine/core/turn-commit";

import { commitTurn } from "../../engine/core/turn-commit";
import { persistCurrentState } from "../../engine/core/state-persistence";
import { writeStateToDetails } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";

export function commitTurnTool(params: unknown, sessionManager: unknown): ToolResult {
  const result = commitTurn(assertTurnCommitInput(params));
  persistCurrentState(sessionManager);
  const details: Record<string, unknown> = { result };
  writeStateToDetails(details);
  return textResult(result.message, details);
}

function assertTurnCommitInput(params: unknown): TurnCommitInput {
  const input = assertRecord(params, "commit_turn 参数");
  const events = assertArray(input["events"], "events").map(normalizeTurnCommitEvent);
  return {
    summary: normalizeSummary(input["summary"], events),
    events,
  };
}

function normalizeTurnCommitEvent(value: unknown): TurnCommitEvent {
  const event = assertRecord(value, "events[]");
  const kind = event["kind"];
  if (kind === "scene-beat") {
    return normalizeSceneBeatTurnEvent(event);
  }
  return event as unknown as TurnCommitEvent; // safe: non scene-beat events are validated by their owning engine modules.
}

function normalizeSceneBeatTurnEvent(event: Record<string, unknown>): TurnCommitEvent {
  const payload = assertRecord(event["event"], "scene-beat.event");
  const beatKind = payload["kind"];
  if (beatKind !== "begin-beat" && beatKind !== "move-location") {
    return event as unknown as TurnCommitEvent; // safe: transition-beat payload is validated by scene beat engine.
  }
  if (isRecord(payload["input"]) || isRecord(payload["storyWindow"])) {
    return event as unknown as TurnCommitEvent; // safe: canonical or already-flat scene-beat payload.
  }

  const storyWindow = toStoryWindow(payload);
  return {
    kind: "scene-beat",
    event: {
      kind: beatKind,
      input: {
        storyWindow,
        objectives: valueOrDefaultArray(event["objectives"], payload["objectives"]),
        threats: valueOrOptionalArray(event["threats"], payload["threats"]),
        presentActorIds: valueOrOptionalArray(event["presentActorIds"], payload["presentActorIds"]),
        allyActorIds: valueOrOptionalArray(event["allyActorIds"], payload["allyActorIds"]),
        situation: firstDefined(event["situation"], payload["situation"]),
        location: firstDefined(event["location"], payload["location"]),
        elapsedMinutes: firstDefined(event["elapsedMinutes"], payload["elapsedMinutes"]),
        reason: firstDefined(payload["reason"], event["reason"]),
      },
    },
  } as unknown as TurnCommitEvent; // safe: constructed from model's split scene-beat fields, then validated by scene engine.
}

function normalizeSummary(value: unknown, events: readonly TurnCommitEvent[]): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  for (const event of events) {
    const reason = findReason(event);
    if (reason !== null) {
      return reason;
    }
  }
  return "本轮状态变化。";
}

function findReason(event: TurnCommitEvent): string | null {
  const raw = event as unknown;
  if (!isRecord(raw)) {
    return null;
  }
  const directReason = normalizeOptionalString(raw["reason"]);
  if (directReason !== null) {
    return directReason;
  }
  const payload = raw["event"];
  if (!isRecord(payload)) {
    return null;
  }
  const payloadReason = normalizeOptionalString(payload["reason"]);
  if (payloadReason !== null) {
    return payloadReason;
  }
  const input = payload["input"];
  if (!isRecord(input)) {
    return null;
  }
  return normalizeOptionalString(input["reason"]);
}

function toStoryWindow(value: Record<string, unknown>): Record<string, unknown> {
  return {
    currentArcId: value["currentArcId"],
    currentBeatId: value["currentBeatId"],
    title: value["title"],
    allowedActions: value["allowedActions"],
    forbiddenEscalations: value["forbiddenEscalations"],
    completionCriteria: value["completionCriteria"],
    nextBeatHints: value["nextBeatHints"],
  };
}

function valueOrDefaultArray(primary: unknown, fallback: unknown): unknown[] {
  const value = firstDefined(primary, fallback);
  return Array.isArray(value) ? value : [];
}

function valueOrOptionalArray(primary: unknown, fallback: unknown): unknown[] | undefined {
  const value = firstDefined(primary, fallback);
  return Array.isArray(value) ? value : undefined;
}

function firstDefined(primary: unknown, fallback: unknown): unknown {
  return primary === undefined ? fallback : primary;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是数组。`);
  }
  return value;
}

function assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} 必须是对象。`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
