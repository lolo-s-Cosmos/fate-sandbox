import type { Static } from "typebox";

import type {
  CAMPAIGN_MEMORY_SCHEMA,
  DAILY_EVENT_MEMORY_SCHEMA,
  DAILY_SUMMARY_MEMORY_SCHEMA,
  MAJOR_EVENT_MEMORY_SCHEMA,
  MEMORY_FACT_SCHEMA,
} from "./memory-schema.ts";

/**
 * Memory 领域状态类型：自 memory-schema.ts 的 TypeBox schema 派生，
 * schema 是唯一事实源——改状态形状只改 schema，类型自动跟进。
 * 对外仍经 state.ts re-export 原名。
 */

export type CampaignMemory = Static<typeof CAMPAIGN_MEMORY_SCHEMA>;
export type MemoryFact = Static<typeof MEMORY_FACT_SCHEMA>;
export type MajorEventMemory = Static<typeof MAJOR_EVENT_MEMORY_SCHEMA>;
export type DailyEventMemory = Static<typeof DAILY_EVENT_MEMORY_SCHEMA>;
export type DailySummaryMemory = Static<typeof DAILY_SUMMARY_MEMORY_SCHEMA>;
