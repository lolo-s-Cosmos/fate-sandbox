import { lookupWorldData, type LookupRequest } from "../../engine/world-data/lookup";
import { textResult, type ToolResult } from "../runtime/tool-result";

export function lookupTool(params: LookupRequest): ToolResult {
  const result = lookupWorldData(params);
  return textResult(result.text);
}
