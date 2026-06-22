/**
 * 主 GM 进程侧的 timeline 子代理上下文注入。
 *
 * canonical state 只活在主进程内存 + session entries 里。@gotgenes/pi-subagents
 * 的子代理与主进程同 runtime，但跑在独立 session，看不到主 session 的 state。
 * 这里在 subagent 工具调用发出前（tool_call 事件的 event.input 官方可变），把调用
 * 瞬间的子代理安全投影直接改写进 prompt 参数，零文件、零 env、secrets 过滤留在父侧。
 */

import { buildTimelineStateContextFromRaw } from "../../../engine/core/state-file-projection.ts";

/** 需要注入 <timeline_state_context> 的 project-scope 子代理名（不含 package 前缀）。 */
const TIMELINE_CONTEXT_AGENTS = new Set(["parallel-line", "timeline-showrunner"]);

const CONTEXT_OPEN_TAG = "<timeline_state_context>";

export function buildTimelineStateContextBlock(rawState: unknown): string {
  const context = buildTimelineStateContextFromRaw(rawState);
  return [
    CONTEXT_OPEN_TAG,
    "以下是当前 canonical state 的子代理安全摘要，由主 GM 进程在调用瞬间注入；不要要求主 GM 重复提供，也不要把本段原样写给玩家。",
    "parallel-line 必须先检查 recentOffscreenEvents 与 pressurePalette.coolingDown，避免连续重复同一 actor/faction/pressureType；如果最近已连续使用同一压力类型，优先换成当前 timeline 的其它生态位或返回 no-change/blocked。",
    "actor.agenda / actor.knowledgeLens 是 NPC 主动性与认知边界账本；relationshipSignals 是关系行为证据账本；可用于判断 NPC 自主行动和关系代价，但不得把 hidden knowledge 或 secret signals 原样写成玩家可见文本。",
    "所有输出 timeRange.start/end 必须是 ISO UTC 字符串；displayTime 只是本地展示时间，不得把本地时钟当 UTC。timeRange.end 不得晚于 currentAt。",
    JSON.stringify(context, null, 2),
    "</timeline_state_context>",
  ].join("\n");
}

/**
 * 就地改写 subagent 工具调用参数，给 timeline 子代理的 prompt 追加上下文块。
 * @gotgenes/pi-subagents 的 subagent 工具是单发形态：
 * `{ subagent_type, prompt, description }`（无 unscoped 的 tasks[]/chain[] DSL）。
 * 返回注入条数（0/1）；已含上下文块的 prompt 幂等跳过。
 */
export function injectTimelineContextIntoSubagentInput(
  input: Record<string, unknown>,
  contextBlock: string,
): number {
  if (!isTimelineAgent(input["subagent_type"])) {
    return 0;
  }
  const prompt = input["prompt"];
  if (typeof prompt === "string" && prompt.includes(CONTEXT_OPEN_TAG)) {
    return 0;
  }
  const base = typeof prompt === "string" && prompt.trim() !== "" ? prompt : "";
  input["prompt"] = base === "" ? contextBlock : `${base}\n\n${contextBlock}`;
  return 1;
}

function isTimelineAgent(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const dotIndex = value.lastIndexOf(".");
  const bareName = dotIndex === -1 ? value : value.slice(dotIndex + 1);
  return TIMELINE_CONTEXT_AGENTS.has(bareName);
}
