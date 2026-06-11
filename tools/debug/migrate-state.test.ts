import assert from "node:assert/strict";
import test from "node:test";

import { sessionKey } from "../../engine/core/state-persistence.ts";
import { resetState } from "../../engine/core/state-store.ts";
import { migrateStateTool } from "./migrate-state.ts";

void test("migrateStateTool apply=true persists state to session and details", () => {
  resetState();
  const appended: Array<{ customType: string; data: unknown }> = [];
  const sessionManager = {
    appendCustomEntry: (customType: string, data?: unknown) => {
      appended.push({ customType, data });
      return "entry-test";
    },
  };

  const result = migrateStateTool({ apply: true, reason: "测试持久化" }, sessionManager);

  assert.equal(appended.length, 1);
  assert.equal(appended[0]?.customType, sessionKey());
  assert.ok(
    result.details?.[sessionKey()] !== undefined,
    "apply=true 必须把 fsn-state 写进 tool result details，否则下次 hydrate 会静默回滚迁移",
  );
});

void test("migrateStateTool without apply stays dry-run: no session writes", () => {
  resetState();
  const appended: unknown[] = [];
  const sessionManager = {
    appendCustomEntry: (customType: string, data?: unknown) => {
      appended.push({ customType, data });
      return "entry-test";
    },
  };

  const result = migrateStateTool({ reason: "测试 dry-run" }, sessionManager);

  assert.equal(appended.length, 0);
  assert.equal(result.details?.[sessionKey()], undefined);
});
