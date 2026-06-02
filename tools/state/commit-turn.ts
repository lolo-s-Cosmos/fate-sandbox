import { commitTurn } from "../../engine/core/turn-commit";
import { persistCurrentState } from "../../engine/core/state-persistence";
import { writeStateToDetails } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";
import { normalizeTurnCommitInput } from "./commit-turn-normalizer";

export function commitTurnTool(params: unknown, sessionManager: unknown): ToolResult {
  const result = commitTurn(normalizeTurnCommitInput(params));
  persistCurrentState(sessionManager);
  const details: Record<string, unknown> = { result };
  writeStateToDetails(details);
  return textResult(result.message, details);
}
