import { textResult, type ToolResult } from "../runtime/tool-result";

const ALLOWED_TOOLSETS = ["always", "debug"];

export function switchToolsetTool(params: { toolset: string }): ToolResult {
  if (!ALLOWED_TOOLSETS.includes(params.toolset)) {
    return textResult(`无效工具组: ${params.toolset}。可选: ${ALLOWED_TOOLSETS.join(", ")}`);
  }
  return textResult(`工具组已切换至: ${params.toolset}`);
}
