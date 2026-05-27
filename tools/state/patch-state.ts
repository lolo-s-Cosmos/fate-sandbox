import { getState, patchState, writeStateToDetails, cloneState, type PatchOp } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";

export interface PatchStateParams {
  ops: ReadonlyArray<PatchOp>;
}

export function patchStateTool(params: PatchStateParams): ToolResult {
  const before = cloneState();
  patchState(params.ops);
  const after = getState();

  const opsDesc = params.ops.map((op) => `${op.op} ${op.path}`).join(", ");
  const text = [
    `状态已更新 (${opsDesc})`,
    `💰 金钱: ${before.金钱.toLocaleString()} → ${after.金钱.toLocaleString()} 円`,
    `📍 位置: ${before.当前位置} → ${after.当前位置}`,
    `💪 身体: ${before.身体状态}% → ${after.身体状态}%`,
  ].join("\n");

  const details: Record<string, unknown> = {};
  writeStateToDetails(details);
  return textResult(text, details);
}
