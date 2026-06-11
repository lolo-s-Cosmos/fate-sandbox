import type { LintFinding } from "../audit/lint-rules.ts";
import type { DirectionPacket } from "./packet-schema.ts";

import { findSecretLeaks, lintFinalProse } from "../audit/lint-rules.ts";
import { isRecord } from "../core/typebox-validation.ts";
import { parseDirectionPacket } from "./packet-schema.ts";

/** 渲染产物落 session 的 customType；结算投影按它过滤，渲染史按它装配。 */
export const PROSE_CUSTOM_TYPE = "fsn-prose";
export const SUBMIT_DIRECTION_PACKET_TOOL = "submit_direction_packet";

/** 渲染器散文史上限（轮数），防止 Pass B 上下文无界增长。 */
const MAX_PROSE_HISTORY_TURNS = 8;

/**
 * 从 agent loop 的消息流中找出「已提交、尚未渲染」的 direction packet。
 * 从尾部回扫：先遇到 prose 消息说明本轮已渲染过（或无新 packet），返回 undefined。
 */
export function findPendingDirectionPacket(
  messages: ReadonlyArray<unknown>,
): DirectionPacket | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (isProseMessage(message)) {
      return undefined;
    }
    const args = findSubmitPacketArguments(message);
    if (args !== undefined) {
      return parseDirectionPacket(args, "direction packet");
    }
  }
  return undefined;
}

/**
 * 装配渲染器（Pass B）的单条 user prompt：散文史 + 玩家本轮输入 +
 * direction packet。与 spike 验证过的输入形态一致（docs/spike-two-pass/）。
 */
export function buildRendererPrompt(
  messages: ReadonlyArray<unknown>,
  packet: DirectionPacket,
): string {
  const proseHistory: string[] = [];
  let currentInputs: string[] = [];
  for (const message of messages) {
    if (isProseMessage(message)) {
      proseHistory.push(customMessageText(message));
      currentInputs = [];
      continue;
    }
    const userText = playerInputText(message);
    if (userText !== undefined) {
      currentInputs.push(userText);
    }
  }

  const sections: string[] = [];
  const recentProse = proseHistory.slice(-MAX_PROSE_HISTORY_TURNS);
  if (recentProse.length > 0) {
    sections.push(
      "# 散文史（之前轮次的最终正文）",
      "",
      recentProse
        .map((prose, index) => `【前 ${recentProse.length - index} 轮】\n\n${prose}`)
        .join("\n\n"),
      "",
    );
  }
  if (currentInputs.length > 0) {
    sections.push("# 玩家本轮输入", "", currentInputs.join("\n\n"), "");
  }
  sections.push(
    "# Direction Packet",
    "",
    "```json",
    JSON.stringify(packet, null, 2),
    "```",
    "",
    "请按 system prompt 的契约渲染本轮正文。只输出正文。",
  );
  return sections.join("\n");
}

export interface ProseLintReport {
  findings: LintFinding[];
  /** block 级（未揭示秘密泄漏）命中 */
  leaks: LintFinding[];
}

export function lintRenderedProse(
  prose: string,
  unrevealedSecrets: readonly string[],
): ProseLintReport {
  const leaks = findSecretLeaks(prose, unrevealedSecrets);
  return { findings: [...lintFinalProse(prose), ...leaks], leaks };
}

/** 终防线：重试后仍泄漏时遮蔽秘密字符串，保证正文可发而秘密不可读。 */
export function redactSecrets(prose: string, secrets: readonly string[]): string {
  let redacted = prose;
  for (const secret of secrets) {
    if (secret.length === 0) {
      continue;
    }
    redacted = redacted.replaceAll(secret, "▮".repeat(Math.min(secret.length, 4)));
  }
  return redacted;
}

/** 重试 prompt：把首次产出与违规清单回喂渲染器重写全文。 */
export function buildLintRetryPrompt(
  basePrompt: string,
  firstProse: string,
  findings: readonly LintFinding[],
): string {
  return [
    basePrompt,
    "",
    "---",
    "",
    "你刚才的产出如下：",
    "",
    firstProse,
    "",
    "它违反了以下输出契约条目，请重写全文修正（保持事件与对白语义不变）：",
    ...findings.map((finding) => `- [${finding.ruleId}] ${finding.match}`),
    "",
    "只输出修正后的正文。",
  ].join("\n");
}

function isProseMessage(message: unknown): message is Record<string, unknown> {
  return (
    isRecord(message) && message["role"] === "custom" && message["customType"] === PROSE_CUSTOM_TYPE
  );
}

function customMessageText(message: Record<string, unknown>): string {
  const content = message["content"];
  if (typeof content === "string") {
    return content;
  }
  return joinTextParts(content);
}

/** 玩家输入：user 消息的文本部分；非 user（assistant/toolResult/bash 等）返回 undefined。 */
function playerInputText(message: unknown): string | undefined {
  if (!isRecord(message) || message["role"] !== "user") {
    return undefined;
  }
  const content = message["content"];
  const text = typeof content === "string" ? content : joinTextParts(content);
  return text.length > 0 ? text : undefined;
}

function joinTextParts(content: unknown): string {
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter(
      (part): part is { type: "text"; text: string } =>
        isRecord(part) && part["type"] === "text" && typeof part["text"] === "string",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function findSubmitPacketArguments(message: unknown): Record<string, unknown> | undefined {
  if (!isRecord(message) || message["role"] !== "assistant") {
    return undefined;
  }
  const content = message["content"];
  if (!Array.isArray(content)) {
    return undefined;
  }
  for (let index = content.length - 1; index >= 0; index--) {
    const part: unknown = content[index];
    if (
      isRecord(part) &&
      part["type"] === "toolCall" &&
      part["name"] === SUBMIT_DIRECTION_PACKET_TOOL &&
      isRecord(part["arguments"])
    ) {
      return part["arguments"];
    }
  }
  return undefined;
}
