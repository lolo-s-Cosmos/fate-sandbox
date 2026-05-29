import { writeStateToDetails } from "../../engine/core/state";
import { resolveConsequenceTool } from "./resolve-consequence";

import { textResult, type ToolResult } from "../runtime/tool-result";

export interface RawDailyInput {
  activity: unknown;
  durationMinutes: unknown;
  isPublic?: unknown;
}

const DEFAULT_PUBLIC_VISIBILITY = true;

export function resolveDailyTool(params: RawDailyInput, sessionManager: unknown): ToolResult {
  const activity = assertActivity(params.activity);
  const isPublic = assertOptionalBoolean(params.isPublic, "isPublic", DEFAULT_PUBLIC_VISIBILITY);
  const result = resolveConsequenceTool(
    {
      actionType: "日常",
      riskLevel: "低",
      durationMinutes: params.durationMinutes,
      isPublic,
      involvesMystery: false,
    },
    sessionManager,
  );
  const original = result.content[0];
  const text = original?.type === "text" ? original.text : "";
  const details = { ...result.details, dailyActivity: activity };
  writeStateToDetails(details);
  return textResult(rewriteHeading(text, activity), details);
}

function assertActivity(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`非法日常行动: ${formatUnknown(value)}。日常行动必须是字符串。`);
  }
  const activity = value.trim();
  if (activity.length === 0) {
    throw new Error("非法日常行动: activity 不能为空。");
  }
  if (activity.length > 80) {
    throw new Error("非法日常行动: activity 不能超过 80 个字符。");
  }
  return activity;
}

function assertOptionalBoolean(value: unknown, fieldName: string, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== "boolean") {
    throw new Error(`非法${fieldName}: ${formatUnknown(value)}。${fieldName}必须是 boolean。`);
  }
  return value;
}

function rewriteHeading(text: string, activity: string): string {
  const lines = text.split("\n");
  lines[0] = `# 日常 · ${activity}`;
  return lines.join("\n");
}

function formatUnknown(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
  if (value === undefined) return "undefined";
  return Object.prototype.toString.call(value);
}
