import type { Static } from "typebox";

import type {
  DEBT_STATE_SCHEMA,
  ECONOMY_STATE_SCHEMA,
  MONEY_PURSE_SCHEMA,
} from "./economy-schema.ts";

/**
 * Economy 领域状态类型：自 economy-schema.ts 的 TypeBox schema 派生，
 * schema 是唯一事实源——改状态形状只改 schema，类型自动跟进。
 * 对外仍经 state.ts re-export 原名。
 */

export type EconomyState = Static<typeof ECONOMY_STATE_SCHEMA>;
export type MoneyPurse = Static<typeof MONEY_PURSE_SCHEMA>;
export type DebtState = Static<typeof DEBT_STATE_SCHEMA>;
