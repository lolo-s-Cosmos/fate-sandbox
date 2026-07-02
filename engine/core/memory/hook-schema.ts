import type { Static } from "typebox";

import { Type } from "typebox";

import {
  ISO_INSTANT_SCHEMA,
  NON_EMPTY_STRING_SCHEMA,
  NON_NEGATIVE_INTEGER_SCHEMA,
} from "../state/schema-primitives.ts";
import { stringEnumSchema } from "../state/state-enum-schemas.ts";

/**
 * Hook（悬念账本）状态树 schema（自 state-schema.ts 分拆而来）。
 * 状态类型直接从 schema 派生，schema 是唯一事实源。
 */

export const HOOK_STATUSES = ["active", "parked", "paid", "escalated", "retired"] as const;

export type HookStatus = (typeof HOOK_STATUSES)[number];

export const HOOK_STATE_SCHEMA = Type.Object({
  id: NON_EMPTY_STRING_SCHEMA,
  label: NON_EMPTY_STRING_SCHEMA,
  status: stringEnumSchema(HOOK_STATUSES),
  /** 上次在正文中出现的游戏内时刻 */
  lastSurfacedAt: ISO_INSTANT_SCHEMA,
  surfaceCount: NON_NEGATIVE_INTEGER_SCHEMA,
  /** 上次复现带来的新状态；复现/升级/兑现时必填 */
  lastNovelty: Type.String(),
});

export type HookState = Static<typeof HOOK_STATE_SCHEMA>;
