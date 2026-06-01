import assert from "node:assert/strict";
import test from "node:test";

import { getState, resetState } from "./state";
import { commitTurn } from "./turn-commit";

void test("commitTurn applies multiple domain events in order", () => {
  resetState();

  const result = commitTurn({
    summary: "卫宫士郎步行回家并记录当前目标。",
    events: [
      {
        kind: "scene",
        event: {
          kind: "move-location",
          location: {
            region: "冬木市",
            site: "深山镇",
            detail: "卫宫邸",
            boundary: "normal",
          },
          elapsedMinutes: 30,
          reason: "步行回家",
        },
      },
      {
        kind: "scene",
        event: {
          kind: "add-objective",
          summary: "整理今晚的异常遭遇",
          reason: "回合收口",
        },
      },
    ],
  });

  const state = getState();
  assert.equal(state.public.scene.location.detail, "卫宫邸");
  assert.equal(state.public.scene.objectives[0]?.summary, "整理今晚的异常遭遇");
  assert.equal(result.results.length, 2);
  assert.match(result.message, /回合已提交/);
});

void test("commitTurn rejects empty commits", () => {
  resetState();

  assert.throws(
    () => commitTurn({ summary: "没有状态变化。", events: [] }),
    /至少需要一个领域事件/,
  );
});

void test("commitTurn warns when a story window has no active objectives", () => {
  resetState();

  const result = commitTurn({
    summary: "开启只有边界的剧情窗口。",
    events: [
      {
        kind: "scene",
        event: {
          kind: "set-story-window",
          storyWindow: {
            currentArcId: "B2",
            currentBeatId: "wrapup",
            title: "收尾",
            allowedActions: ["撤退"],
            forbiddenEscalations: ["不得开战"],
            completionCriteria: ["安全离开"],
            nextBeatHints: [],
          },
          reason: "锁定 beat",
        },
      },
    ],
  });

  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0] ?? "", /没有未解决的 Scene Objective/);
});
