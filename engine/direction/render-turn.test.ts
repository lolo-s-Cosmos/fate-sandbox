import assert from "node:assert/strict";
import test from "node:test";

import { parseDirectionPacket } from "./packet-schema.ts";
import {
  buildLintRetryPrompt,
  buildRendererPrompt,
  findPendingDirectionPacket,
  lintRenderedProse,
  PROSE_CUSTOM_TYPE,
  redactSecrets,
  SUBMIT_DIRECTION_PACKET_TOOL,
} from "./render-turn.ts";

const PACKET_ARGS = {
  needsRender: true,
  playerAction: "下达突进指令",
  resolvedChanges: ["Saber 突进受阻"],
  npcStances: [],
  sensoryAnchors: ["灼热气浪"],
  endWindow: "玩家必须创造破绽",
  eventWeight: "normal",
  canonFacts: [],
};

function userMessage(text: string): Record<string, unknown> {
  return { role: "user", content: [{ type: "text", text }], timestamp: 0 };
}

function proseMessage(text: string): Record<string, unknown> {
  return { role: "custom", customType: PROSE_CUSTOM_TYPE, content: text, display: true };
}

function packetCallMessage(args: Record<string, unknown>): Record<string, unknown> {
  return {
    role: "assistant",
    content: [
      { type: "text", text: "结算完成" },
      { type: "toolCall", id: "tc-1", name: SUBMIT_DIRECTION_PACKET_TOOL, arguments: args },
    ],
    timestamp: 0,
  };
}

void test("findPendingDirectionPacket returns the latest unrendered packet with its call id", () => {
  const pending = findPendingDirectionPacket([
    userMessage("贴上去！"),
    packetCallMessage(PACKET_ARGS),
  ]);
  assert.ok(pending);
  assert.equal(pending.packet.needsRender, true);
  assert.equal(pending.toolCallId, "tc-1");
});

void test("findPendingDirectionPacket ignores already-rendered turns", () => {
  const pending = findPendingDirectionPacket([
    userMessage("贴上去！"),
    packetCallMessage(PACKET_ARGS),
    proseMessage("已渲染的正文。"),
  ]);
  assert.equal(pending, undefined);
});

void test("findPendingDirectionPacket returns undefined without a packet call", () => {
  assert.equal(
    findPendingDirectionPacket([
      userMessage("继续。"),
      { role: "assistant", content: [{ type: "text", text: "……" }], timestamp: 0 },
    ]),
    undefined,
  );
});

void test("buildRendererPrompt assembles prose history, current input and packet", () => {
  const prompt = buildRendererPrompt(
    [
      userMessage("第一轮输入"),
      proseMessage("第一轮正文。"),
      userMessage("贴上去！"),
      packetCallMessage(PACKET_ARGS),
    ],
    parseDirectionPacket(PACKET_ARGS, "packet"),
  );

  assert.match(prompt, /# 散文史/);
  assert.match(prompt, /第一轮正文。/);
  assert.match(prompt, /# 玩家本轮输入/);
  assert.match(prompt, /贴上去！/);
  assert.doesNotMatch(prompt, /第一轮输入/);
  assert.match(prompt, /# Direction Packet/);
  assert.match(prompt, /Saber 突进受阻/);
  assert.match(prompt, /只输出正文/);
});

void test("buildRendererPrompt caps prose history", () => {
  const messages: Record<string, unknown>[] = [];
  for (let turn = 1; turn <= 12; turn++) {
    messages.push(userMessage(`输入 ${turn}`), proseMessage(`正文 ${turn}`));
  }
  messages.push(userMessage("最新输入"));
  const prompt = buildRendererPrompt(messages, parseDirectionPacket(PACKET_ARGS, "packet"));

  assert.doesNotMatch(prompt, /正文 4\b/);
  assert.match(prompt, /正文 5/);
  assert.match(prompt, /正文 12/);
  assert.match(prompt, /最新输入/);
});

void test("lintRenderedProse flags secret leaks as block findings", () => {
  const report = lintRenderedProse("她的真名是两仪式。", ["两仪式"]);
  assert.equal(report.leaks.length, 1);
  assert.ok(report.findings.length >= 1);
});

void test("redactSecrets masks unrevealed secret strings", () => {
  const redacted = redactSecrets("两仪式出刀，两仪式收刀。", ["两仪式"]);
  assert.doesNotMatch(redacted, /两仪式/);
  assert.match(redacted, /▮/);
});

void test("buildLintRetryPrompt embeds first prose and violations", () => {
  const retry = buildLintRetryPrompt("BASE", "首稿正文", [
    { ruleId: "fake-climax", severity: "warn", match: "第一次真正", excerpt: "x" },
  ]);
  assert.match(retry, /BASE/);
  assert.match(retry, /首稿正文/);
  assert.match(retry, /fake-climax/);
});
