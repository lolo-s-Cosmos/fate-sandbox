import type { PrivateResolveEvent } from "../../engine/core/secrets";

import { privateResolve } from "../../engine/core/secrets";
import { persistCurrentState } from "../../engine/core/state-persistence";
import { writeStateToDetails } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";

export function privateResolveTool(params: unknown, sessionManager: unknown): ToolResult {
  const result = privateResolve(assertPrivateResolveEvent(params));
  persistCurrentState(sessionManager);
  const details: Record<string, unknown> = { outcome: result.outcome };
  writeStateToDetails(details);
  return textResult(formatResult(result), details);
}

function formatResult(result: ReturnType<typeof privateResolve>): string {
  return [`私密结算结果：${result.outcome}`, "叙事约束：", ...result.narrativeConstraints.map((entry) => `- ${entry}`)].join("\n");
}

function assertPrivateResolveEvent(params: unknown): PrivateResolveEvent {
  return params as PrivateResolveEvent; // safe: privateResolve validates actor existence and returns only player-safe constraints.
}
