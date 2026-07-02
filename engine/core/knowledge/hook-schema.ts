import { Type } from "typebox";

import {
  ISO_INSTANT_SCHEMA,
  NON_EMPTY_STRING_SCHEMA,
  NON_NEGATIVE_INTEGER_SCHEMA,
} from "../state/schema-primitives.ts";
import { stringEnumSchema } from "../state/state-enum-schemas.ts";

/**
 * Hook（悬念账本）状态树 schema（自 state-schema.ts 分拆而来）。
 * 与 state.ts 手写接口一一对应；漂移由 state-schema.ts 的双向赋值检查拦截。
 */

export const HOOK_STATUSES = ["active", "parked", "paid", "escalated", "retired"] as const;

export type HookStatus = (typeof HOOK_STATUSES)[number];

export interface HookState {
  id: string;
  label: string;
  status: HookStatus;
  /** 上次在正文中出现的游戏内时刻 */
  lastSurfacedAt: string;
  surfaceCount: number;
  /** 上次复现带来的新状态；复现/升级/兑现时必填 */
  lastNovelty: string;
}

export const HOOK_STATE_SCHEMA = Type.Object({
  id: NON_EMPTY_STRING_SCHEMA,
  label: NON_EMPTY_STRING_SCHEMA,
  status: stringEnumSchema(HOOK_STATUSES),
  lastSurfacedAt: ISO_INSTANT_SCHEMA,
  surfaceCount: NON_NEGATIVE_INTEGER_SCHEMA,
  lastNovelty: Type.String(),
});
