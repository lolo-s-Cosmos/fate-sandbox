import assert from "node:assert/strict";
import test from "node:test";

import { resetState } from "../../engine/core/state";
import { commitTurnTool } from "./commit-turn";

void test("commitTurnTool accepts missing summary and split flat scene beat fields", () => {
  resetState();

  const result = commitTurnTool(
    {
      events: [
        {
          kind: "scene",
          event: {
            kind: "move-location",
            elapsedMinutes: 540,
            reason: "学生在校全天，梅莉在校外坂道榉树后持续观察结界日间影响",
            location: {
              boundary: "normal",
              detail: "穗群原学园正门外·坂道树荫",
              region: "冬木市",
              site: "深山町",
            },
          },
        },
        {
          kind: "scene-beat",
          event: {
            kind: "begin-beat",
            title: "放学后的对峙——弓道部后方",
            allowedActions: ["在校门外树荫处持续观察结界内部态势"],
            forbiddenEscalations: ["直接进入学校结界内部干涉战斗"],
            completionCriteria: ["确认学校结界是否被解除或破坏"],
            nextBeatHints: ["结界主人尚未露面"],
            currentArcId: "B5",
            currentBeatId: "schoolyard-confrontation",
          },
          objectives: ["观察学校结界是否被剑士一方解除"],
          threats: [
            {
              severity: "medium",
              summary: "结界内即将发生从者级别的正面冲突，需要保持安全距离",
            },
          ],
          presentActorIds: ["protagonist"],
          situation: "investigation",
        },
      ],
    },
    createNoopSessionManager(),
  );

  assert.match(result.content[0]?.text ?? "", /回合已提交/);
  assert.match(result.content[0]?.text ?? "", /领域事件：2/);
});

function createNoopSessionManager(): unknown {
  return { appendCustomEntry: () => "entry-test" };
}
