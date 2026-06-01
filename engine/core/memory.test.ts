import assert from "node:assert/strict";
import test from "node:test";

import { recordMemory } from "./memory";
import { getState, resetState } from "./state";

void test("recordMemory stores pinned facts in public campaign memory", () => {
  resetState();

  const result = recordMemory({
    kind: "pin-fact",
    scope: "protagonist",
    subject: "protagonist",
    text: "玩家确认自己是御主。",
    sourceEventId: null,
  });

  const fact = getState().public.memory.pinnedFacts.find((entry) => entry.id === result.factId);
  assert.equal(fact?.text, "玩家确认自己是御主。");
});

void test("recordMemory stores major events with consequences", () => {
  resetState();

  const result = recordMemory({
    kind: "record-major-event",
    title: "契约成立",
    summary: "玩家与 Saber 缔结契约。",
    consequences: ["玩家成为御主。"],
  });

  const event = getState().public.memory.eventLog.find((entry) => entry.id === result.eventId);
  assert.equal(event?.title, "契约成立");
  assert.deepEqual(event?.consequences, ["玩家成为御主。"]);
});

void test("recordMemory rejects sensitive confirmed memory without evidence", () => {
  resetState();

  assert.throws(
    () =>
      recordMemory({
        kind: "record-major-event",
        title: "柳洞寺确认情报",
        summary: "凛确认 Caster 正在柳洞寺。",
        consequences: ["Caster 位置已确认。"],
      }),
    /公开记忆不能把敏感\/隐藏情报写成 confirmed fact/,
  );
});

void test("recordMemory accepts explicitly worded sensitive hypotheses", () => {
  resetState();

  const result = recordMemory({
    kind: "record-major-event",
    title: "关于柳洞寺的未证实猜测",
    summary: "士郎猜测 Caster 可能与柳洞寺有关，但没有证据确认。",
    consequences: ["该猜测未证实，不能作为行动事实。"],
    certainty: "hypothesis",
  });

  const event = getState().public.memory.eventLog.find((entry) => entry.id === result.eventId);
  assert.match(event?.summary ?? "", /猜测/);
});

void test("recordMemory rejects hypothesis worded as confirmed fact", () => {
  resetState();

  assert.throws(
    () =>
      recordMemory({
        kind: "pin-fact",
        scope: "world",
        subject: "柳洞寺",
        text: "凛确认 Caster 正在柳洞寺。",
        sourceEventId: null,
        certainty: "hypothesis",
      }),
    /不能写成确认事实/,
  );
});
