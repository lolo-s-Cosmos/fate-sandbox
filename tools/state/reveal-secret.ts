import type { RevealSecretEvent } from "../../engine/core/secrets";

import { revealSecret } from "../../engine/core/secrets";
import { persistCurrentState } from "../../engine/core/state-persistence";
import { writeStateToDetails } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";

export function revealSecretTool(params: unknown, sessionManager: unknown): ToolResult {
  const result = revealSecret(assertRevealSecretEvent(params));
  persistCurrentState(sessionManager);
  const details: Record<string, unknown> = { outcome: result.outcome };
  writeStateToDetails(details);
  return textResult(result.playerSafeMessage, details);
}

function assertRevealSecretEvent(params: unknown): RevealSecretEvent {
  return params as RevealSecretEvent; // safe: revealSecret validates event fields and never returns secret ids or hidden values.
}
