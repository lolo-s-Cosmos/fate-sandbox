import { CURRENT_STATE_SCHEMA_VERSION } from "../../engine/core/state";
import { textResult, type ToolResult } from "../runtime/tool-result";

export function getStateSchemaTool(): ToolResult {
  const schema = {
    版本: CURRENT_STATE_SCHEMA_VERSION,
    字段: {
      金钱: "number — 日元余额",
      当前位置: "string — 如 冬木市·深山镇·卫宫邸",
      身体状态: "number — 0-100, 100=健康, 0=死亡",
    },
    受保护路径: ["/金钱", "/当前位置", "/身体状态"],
    仅允许: "patch_state 只能修改以上三个路径",
  };
  return textResult(JSON.stringify(schema, null, 2));
}
