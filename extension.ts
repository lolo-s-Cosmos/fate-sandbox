/**
 * Fate/Stay Night 沙盒 — pi extension
 *
 * DeepSeek V4 特化：系统提示极简 + 上下文/铁则注入 user 消息流 + 全链路中文
 */

import type { ContextEvent, ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { syncStateFromSessionManager } from "./engine/core/session-hydration.ts";
import { exportState } from "./engine/core/state-store.ts";
import { isRecord } from "./engine/core/typebox-validation.ts";
import { PROSE_CUSTOM_TYPE } from "./engine/direction/render-turn.ts";
import { buildSystemPrompt, injectGmPromptMessages } from "./engine/gm-prompt/injection.ts";
import {
  buildTimelineStateContextBlock,
  injectTimelineContextIntoSubagentInput,
} from "./extensions/subagents/timeline/task-injection.ts";
import { registerAllTools } from "./tools/registry.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function extension(pi: ExtensionAPI): void {
  pi.on("resources_discover", async () => {
    return { skillPaths: [join(__dirname, "skills")] };
  });

  pi.on("before_agent_start", async (event) => {
    return { systemPrompt: buildSystemPrompt(event.systemPrompt) };
  });

  pi.on("context", async (event, ctx) => {
    syncStateFromSessionManager(ctx.sessionManager);
    // 结算器（Pass A）投影：渲染产物不进结算上下文——它的记忆是
    // state + 历届 direction packet（在工具调用参数里），不是散文。
    const settlementMessages = event.messages.filter(
      (message) => !(isRecord(message) && message["customType"] === PROSE_CUSTOM_TYPE),
    );
    return {
      messages: injectGmPromptMessages<ContextEvent["messages"][number]>(settlementMessages),
    };
  });

  pi.on("session_start", async (_event, ctx) => {
    syncStateFromSessionManager(ctx.sessionManager);
  });

  pi.on("session_tree", async (_event, ctx) => {
    syncStateFromSessionManager(ctx.sessionManager);
  });

  pi.on("tool_call", async (event, ctx) => {
    syncStateFromSessionManager(ctx.sessionManager);
    if (event.toolName === "subagent") {
      // timeline 子代理是独立 pi 进程，看不到主进程的 canonical state；
      // 这里在调用发出前把子代理安全投影改写进 task（event.input 官方可变），
      // 取代旧的 state/state.json 侧通道。注入失败不阻断调用，
      // 子代面按缺上下文的契约降级处理。
      try {
        injectTimelineContextIntoSubagentInput(
          event.input,
          buildTimelineStateContextBlock(exportState()),
        );
      } catch {
        // 不让注入异常打断 subagent 调用本身。
      }
    }
  });

  registerAllTools(pi);
}
