import { cloneState } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";

export function getStatusTool(): ToolResult {
  const state = cloneState();
  const text = [
    `💰 持有金钱: ${state.金钱.toLocaleString()} 円`,
    `📍 当前位置: ${state.当前位置}`,
    `💪 身体状态: ${state.身体状态}%`,
  ].join("\n");
  return textResult(text);
}
