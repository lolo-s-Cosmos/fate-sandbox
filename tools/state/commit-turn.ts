import type { TurnCommitInput } from "../../engine/core/turn-commit";

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
  return params as TurnCommitInput; // safe: turn committer delegates each embedded domain event to the owning engine module for validation.
}
