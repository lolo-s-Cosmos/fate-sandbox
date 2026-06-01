import assert from "node:assert/strict";
import test from "node:test";

import { upsertActorTool } from "./upsert-actor";
import { getState, resetState } from "../../engine/core/state";

void test("upsertActorTool accepts omitted master fields for masterless servants", () => {
  resetState();

  const result = upsertActorTool(
    {
      kind: "upsert-servant",
      servant: baseMasterlessServant(),
      reason: "测试无主从者工具输入",
    },
    createNoopSessionManager(),
  );

  assert.match(result.content[0]?.text ?? "", /从者已写入：masterless-caster/);
  const contract = getState().public.actors["masterless-caster"]?.servantForm?.contract;
  assert.equal(contract?.status, "masterless");
  assert.equal(contract?.masterActorId, null);
  assert.equal(contract?.masterName, null);
});

void test("upsertActorTool normalizes placeholder master fields for masterless servants", () => {
  resetState();

  upsertActorTool(
    {
      kind: "upsert-servant",
      servant: {
        ...baseMasterlessServant(),
        masterActorId: "none",
        masterName: "无",
      },
      reason: "测试无主从者占位输入",
    },
    createNoopSessionManager(),
  );

  const contract = getState().public.actors["masterless-caster"]?.servantForm?.contract;
  assert.equal(contract?.masterActorId, null);
  assert.equal(contract?.masterName, null);
});

function baseMasterlessServant(): Record<string, unknown> {
  return {
    id: "masterless-caster",
    displayName: "Caster",
    publicIdentity: "身份不明的无主从者",
    apparentAge: "二十岁后半",
    outfit: { label: "长袍", details: "深蓝色连帽长袍。" },
    demeanor: "沉静寡言",
    className: "Caster",
    trueNameDisplay: "Caster",
    trueNameStatus: "hidden",
    parameters: {
      strength: "E",
      endurance: "D",
      agility: "C",
      mana: "A",
      luck: "B",
      noblePhantasm: "A",
    },
    classSkills: [{ name: "阵地作成", rank: "A", summary: "可建造魔术阵地。" }],
    personalSkills: [{ name: "高速神言", rank: "A", summary: "无需咏唱发动大魔术。" }],
    noblePhantasms: [],
    spiritualCore: 100,
    mana: 100,
    spiritualCondition: "完好",
    contractStatus: "masterless",
    manaSupply: "starved",
    currentOrder: "自主行动——寻找魔力源维持现界",
  };
}

function createNoopSessionManager(): unknown {
  return { appendCustomEntry: () => "entry-test" };
}
