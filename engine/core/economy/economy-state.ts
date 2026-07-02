import type { ActorId } from "../state/core-types.ts";
import type { CurrencyCode, PurseAccess } from "../state/state-enum-schemas.ts";

/**
 * Economy 领域状态类型（自 state.ts 分拆而来，仅类型）。
 * 对应 schema 在 economy-schema.ts；漂移由 state-schema.ts 的双向赋值检查拦截。
 * 对外仍经 state.ts re-export 原名。
 */

export interface EconomyState {
  currency: CurrencyCode;
  accessibleFunds: MoneyPurse[];
  debts: DebtState[];
}

export interface MoneyPurse {
  id: string;
  ownerActorId: ActorId;
  label: string;
  amount: number;
  access: PurseAccess;
}

export interface DebtState {
  id: string;
  debtorActorId: ActorId;
  creditor: string;
  amount: number;
  reason: string;
}
