import assert from "node:assert/strict";
import test from "node:test";

import { createInitialState } from "../engine/core/state-store.ts";
import {
  buildTimelineStateContextBlock,
  injectTimelineContextIntoSubagentInput,
} from "../extensions/subagents/timeline/task-injection.ts";

const BLOCK = "<timeline_state_context>\n{}\n</timeline_state_context>";

void test("给 timeline 子代理 prompt 追加上下文块", () => {
  const input: Record<string, unknown> = { subagent_type: "parallel-line", prompt: "推进教会线" };
  assert.equal(injectTimelineContextIntoSubagentInput(input, BLOCK), 1);
  assert.equal(input["prompt"], `推进教会线\n\n${BLOCK}`);
});

void test("支持 package 限定名与缺省 prompt", () => {
  const input: Record<string, unknown> = { subagent_type: "fsn.timeline-showrunner" };
  assert.equal(injectTimelineContextIntoSubagentInput(input, BLOCK), 1);
  assert.equal(input["prompt"], BLOCK);
});

void test("非 timeline 子代理不被改写", () => {
  const input: Record<string, unknown> = { subagent_type: "Explore", prompt: "审一下" };
  assert.equal(injectTimelineContextIntoSubagentInput(input, BLOCK), 0);
  assert.equal(input["prompt"], "审一下");
});

void test("已包含上下文块的 prompt 幂等跳过", () => {
  const prompt = `输入\n\n${BLOCK}`;
  const input: Record<string, unknown> = { subagent_type: "parallel-line", prompt };
  assert.equal(injectTimelineContextIntoSubagentInput(input, BLOCK), 0);
  assert.equal(input["prompt"], prompt);
});

void test("缺 prompt 字段时直接以上下文块作为 prompt", () => {
  const input: Record<string, unknown> = { subagent_type: "parallel-line" };
  assert.equal(injectTimelineContextIntoSubagentInput(input, BLOCK), 1);
  assert.equal(input["prompt"], BLOCK);
});

void test("上下文块由当前 state 投影生成且不含 secrets 原文", () => {
  const block = buildTimelineStateContextBlock(createInitialState());
  assert.match(block, /^<timeline_state_context>\n/);
  assert.match(block, /<\/timeline_state_context>$/);
  assert.match(block, /"currentAtUtc": "2004-01-30T07:00:00\.000Z"/);
  assert.match(block, /由主 GM 进程在调用瞬间注入/);
  assert.doesNotMatch(block, /actorSecrets|secretEventLog|campaignSecrets/);
});
