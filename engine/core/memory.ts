import {
  assertIsoDateString,
  assertNonEmptyString,
  createId,
  updateState,
  type DailySummaryMemoryId,
  type MajorEventMemoryId,
  type MemoryFact,
  type MemoryFactId,
} from "./state";

export type MemoryCertainty = "observed" | "confirmed" | "inferred" | "rumor" | "hypothesis";

export type MemoryEvent =
  | {
      kind: "pin-fact";
      scope: MemoryFact["scope"];
      subject: string;
      text: string;
      sourceEventId: string | null;
      certainty?: MemoryCertainty;
      evidence?: string;
    }
  | {
      kind: "record-major-event";
      title: string;
      summary: string;
      consequences: string[];
      certainty?: MemoryCertainty;
      evidence?: string;
    }
  | {
      kind: "record-daily-summary";
      startDate: string;
      endDate: string;
      summary: string;
    };

export interface MemoryEventResult {
  factId?: MemoryFactId;
  eventId?: MajorEventMemoryId;
  dailySummaryId?: DailySummaryMemoryId;
}

export function recordMemory(event: MemoryEvent): MemoryEventResult {
  switch (event.kind) {
    case "pin-fact":
      return recordPinnedFact(event);
    case "record-major-event":
      return recordMajorEvent(event);
    case "record-daily-summary":
      return recordDailySummary(event);
    default:
      throw new Error("unreachable memory event kind");
  }
}

function recordPinnedFact(event: Extract<MemoryEvent, { kind: "pin-fact" }>): MemoryEventResult {
  assertPublicMemoryBoundary(event.text, event.certainty, event.evidence);
  const id = createId("fact");
  updateState((draft) => {
    draft.public.memory.pinnedFacts.push({
      id,
      scope: event.scope,
      subject: assertNonEmptyString(event.subject, "subject"),
      text: assertNonEmptyString(event.text, "text"),
      since: draft.public.clock.currentAt,
      sourceEventId:
        event.sourceEventId === null
          ? null
          : assertNonEmptyString(event.sourceEventId, "sourceEventId"),
    });
  });
  return { factId: id };
}

function recordMajorEvent(
  event: Extract<MemoryEvent, { kind: "record-major-event" }>,
): MemoryEventResult {
  assertPublicMemoryBoundary(
    [event.title, event.summary, ...event.consequences].join("\n"),
    event.certainty,
    event.evidence,
  );
  const id = createId("event");
  updateState((draft) => {
    draft.public.memory.eventLog.push({
      id,
      time: draft.public.clock.currentAt,
      title: assertNonEmptyString(event.title, "title"),
      summary: assertNonEmptyString(event.summary, "summary"),
      consequences: event.consequences.map((consequence) =>
        assertNonEmptyString(consequence, "consequences[]"),
      ),
    });
  });
  return { eventId: id };
}

function assertPublicMemoryBoundary(
  text: string,
  certainty: MemoryCertainty | undefined,
  evidence: string | undefined,
): void {
  const normalized = text.toLowerCase();
  const sensitiveTerms = ["caster", "assassin", "真名", "佐佐木小次郎", "美狄亚", "柳洞寺"];
  if (!sensitiveTerms.some((term) => normalized.includes(term.toLowerCase()))) {
    return;
  }

  const memoryCertainty = certainty ?? "confirmed";
  if (memoryCertainty === "hypothesis" || memoryCertainty === "rumor") {
    assertHypothesisWording(text);
    return;
  }

  if (evidence === undefined || evidence.trim().length === 0) {
    throw new Error(
      "公开记忆不能把敏感/隐藏情报写成 confirmed fact；若只是玩家猜测，请使用 certainty=hypothesis，并写成“怀疑/猜测/可能”。若已确认，必须提供 evidence。",
    );
  }
}

function assertHypothesisWording(text: string): void {
  if (/[确认確定]/u.test(text) && !/没有证据确认|未确认|不能确认/u.test(text)) {
    throw new Error("hypothesis/rumor 记忆不能写成确认事实；请改写为怀疑/猜测/可能。");
  }
  if (!/[怀疑猜测可能推测未证实]/u.test(text)) {
    throw new Error("hypothesis/rumor 记忆必须明确标注为怀疑、猜测、可能或未证实。");
  }
}

function recordDailySummary(
  event: Extract<MemoryEvent, { kind: "record-daily-summary" }>,
): MemoryEventResult {
  const id = createId("daily");
  updateState((draft) => {
    draft.public.memory.dailySummaries.push({
      id,
      startDate: assertIsoDateString(event.startDate, "startDate"),
      endDate: assertIsoDateString(event.endDate, "endDate"),
      summary: assertNonEmptyString(event.summary, "summary"),
    });
  });
  return { dailySummaryId: id };
}
