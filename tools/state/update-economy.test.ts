import assert from "node:assert/strict";
import test from "node:test";

import { getState, resetState } from "../../engine/core/state";
import { updateEconomyTool } from "./update-economy";

void test("updateEconomy reports available purse ids for an unknown purse", () => {
  resetState();

  assert.throws(
    () =>
      updateEconomyTool(
        {
          kind: "spend-money",
          purseId: "shirou-wallet",
          amount: 100,
          reason: "ergonomics regression test",
        },
        undefined,
      ),
    /当前可用: purse-protagonist-cash/,
  );
});

void test("updateEconomyTool renames a purse", () => {
  resetState();

  updateEconomyTool(
    {
      kind: "rename-purse",
      purseId: "purse-protagonist-cash",
      label: "绫香的钱包",
      reason: "修正玩家可见资金账户名称",
    },
    undefined,
  );

  assert.equal(getState().public.economy.accessibleFunds[0]?.label, "绫香的钱包");
});
