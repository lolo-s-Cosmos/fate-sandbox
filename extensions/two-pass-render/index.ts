import type {
  ExtensionAPI,
  ExtensionContext,
  MessageRenderer,
} from "@earendil-works/pi-coding-agent";

import type {
  DirectionPacket,
  RenderDirectionPacket,
} from "../../engine/direction/packet-schema.ts";

import { complete } from "@earendil-works/pi-ai";
import { getMarkdownTheme } from "@earendil-works/pi-coding-agent";
import { Markdown } from "@earendil-works/pi-tui";

import { collectUnrevealedSecretStrings } from "../../engine/audit/lint-rules.ts";
import { syncStateFromSessionManager } from "../../engine/core/session-hydration.ts";
import { getState } from "../../engine/core/state-store.ts";
import {
  buildLintRetryPrompt,
  buildRendererPrompt,
  findPendingDirectionPacket,
  lintRenderedProse,
  PROSE_CUSTOM_TYPE,
  redactSecrets,
} from "../../engine/direction/render-turn.ts";
import { buildRendererSystemPrompt } from "../../engine/gm-prompt/injection.ts";

const RENDERER_MAX_TOKENS = 8192;

/**
 * 双 pass 第二段（Pass B）：结算循环以 submit_direction_packet 收尾后，
 * 在 agent_end 用洁净室 complete() 把 packet 渲染成玩家可见正文，
 * 以 fsn-prose custom message 落 session。结算投影的过滤在 extension.ts。
 */
export default function twoPassRenderExtension(pi: ExtensionAPI): void {
  pi.registerMessageRenderer(PROSE_CUSTOM_TYPE, renderProseMessage);

  pi.on("agent_end", async (event, ctx) => {
    const packet = readPendingPacket(event.messages, ctx);
    if (packet === undefined) {
      return;
    }
    if (!packet.needsRender) {
      sendProse(pi, packet.directReply, { kind: "direct-reply" });
      return;
    }
    syncStateFromSessionManager(ctx.sessionManager);
    const unrevealedSecrets = collectUnrevealedSecretStrings(getState().secrets);
    const prose = await renderProse(ctx, event.messages, packet, unrevealedSecrets);
    if (prose === undefined) {
      sendProse(pi, buildFallbackProse(packet), { kind: "render-fallback" });
      return;
    }
    sendProse(pi, prose.text, { kind: "rendered", lintRuleIds: prose.lintRuleIds });
  });
}

interface RenderedProse {
  text: string;
  lintRuleIds: string[];
}

async function renderProse(
  ctx: ExtensionContext,
  loopMessages: ReadonlyArray<unknown>,
  packet: RenderDirectionPacket,
  unrevealedSecrets: readonly string[],
): Promise<RenderedProse | undefined> {
  const model = ctx.model;
  if (model === undefined) {
    notify(ctx, "two-pass render: no active model, falling back to packet digest", "warning");
    return undefined;
  }
  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
  if (!auth.ok || auth.apiKey === undefined) {
    notify(
      ctx,
      "two-pass render: model auth unavailable, falling back to packet digest",
      "warning",
    );
    return undefined;
  }

  const systemPrompt = buildRendererSystemPrompt();
  const prompt = buildRendererPrompt(loopMessages, packet);

  try {
    const first = await completeProse(model, auth, systemPrompt, prompt);
    const firstReport = lintRenderedProse(first, unrevealedSecrets);
    if (firstReport.findings.length === 0) {
      return { text: first, lintRuleIds: [] };
    }

    // 一次重试：把首次产出与违规清单回喂渲染器重写全文。
    const second = await completeProse(
      model,
      auth,
      systemPrompt,
      buildLintRetryPrompt(prompt, first, firstReport.findings),
    );
    const secondReport = lintRenderedProse(second, unrevealedSecrets);
    const lintRuleIds = secondReport.findings.map((finding) => finding.ruleId);
    if (secondReport.leaks.length > 0) {
      notify(ctx, "two-pass render: secret leak persisted after retry, redacted", "error");
      return { text: redactSecrets(second, unrevealedSecrets), lintRuleIds };
    }
    if (lintRuleIds.length > 0) {
      notify(ctx, `two-pass render: style findings remain (${lintRuleIds.join(", ")})`, "warning");
    }
    return { text: second, lintRuleIds };
  } catch (error) {
    notify(ctx, `two-pass render failed (${formatError(error)}), falling back`, "warning");
    return undefined;
  }
}

async function completeProse(
  model: NonNullable<ExtensionContext["model"]>,
  auth: { apiKey?: string; headers?: Record<string, string> },
  systemPrompt: string,
  prompt: string,
): Promise<string> {
  const response = await complete(
    model,
    {
      systemPrompt,
      messages: [
        { role: "user", content: [{ type: "text", text: prompt }], timestamp: Date.now() },
      ],
    },
    { apiKey: auth.apiKey, headers: auth.headers, maxTokens: RENDERER_MAX_TOKENS },
  );
  const text = response.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (text === "") {
    throw new Error("renderer returned empty prose");
  }
  return text;
}

function readPendingPacket(
  messages: ReadonlyArray<unknown>,
  ctx: ExtensionContext,
): DirectionPacket | undefined {
  try {
    return findPendingDirectionPacket(messages);
  } catch (error) {
    // packet 已过工具层验证，这里失败属于异常路径：通知并放弃渲染。
    notify(ctx, `two-pass render: invalid packet (${formatError(error)})`, "error");
    return undefined;
  }
}

/** 渲染不可用时的兜底：binding 事实以平文列出，保证玩家至少看到结算结果。 */
function buildFallbackProse(packet: RenderDirectionPacket): string {
  return [
    "（渲染器暂不可用，以下为本轮结算摘要）",
    "",
    ...packet.resolvedChanges.map((entry) => `- ${entry}`),
    "",
    `> ${packet.endWindow}`,
  ].join("\n");
}

function sendProse(pi: ExtensionAPI, text: string, details: Record<string, unknown>): void {
  pi.sendMessage(
    { customType: PROSE_CUSTOM_TYPE, content: text, display: true, details },
    { triggerTurn: false },
  );
}

const renderProseMessage: MessageRenderer = (message) => {
  const text = typeof message.content === "string" ? message.content : joinText(message.content);
  return new Markdown(text, 1, 0, getMarkdownTheme());
};

function joinText(content: ReadonlyArray<{ type: string }>): string {
  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        part.type === "text" && "text" in part && typeof part.text === "string",
    )
    .map((part) => part.text)
    .join("\n");
}

function notify(ctx: ExtensionContext, message: string, level: "info" | "warning" | "error"): void {
  if (ctx.hasUI) {
    ctx.ui.notify(message, level);
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
