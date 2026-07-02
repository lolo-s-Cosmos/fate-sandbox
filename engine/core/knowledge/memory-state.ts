import type {
  DailyEventMemoryId,
  DailySummaryMemoryId,
  MajorEventMemoryId,
  MemoryFactId,
} from "../state/core-types.ts";
import type { MemoryFactScope } from "../state/state-enum-schemas.ts";
import type { DailyEventKind, MemoryClaim } from "./memory-schema.ts";

/**
 * Memory 领域状态类型（自 state.ts 分拆而来，仅类型）。
 * 对应 schema 在 memory-schema.ts；漂移由 state-schema.ts 的双向赋值检查拦截。
 * 对外仍经 state.ts re-export 原名。
 */

export interface CampaignMemory {
  pinnedFacts: MemoryFact[];
  eventLog: MajorEventMemory[];
  dailyEvents: DailyEventMemory[];
  dailySummaries: DailySummaryMemory[];
}

export interface MemoryFact {
  id: MemoryFactId;
  scope: MemoryFactScope;
  subject: string;
  text: string;
  since: string;
  sourceEventId: string | null;
}

export interface MajorEventMemory {
  id: MajorEventMemoryId;
  time: string;
  title: string;
  summary: string;
  consequences: string[];
  claims?: MemoryClaim[];
}

export interface DailyEventMemory {
  id: DailyEventMemoryId;
  time: string;
  eventKind: DailyEventKind;
  title: string;
  summary: string;
}

export interface DailySummaryMemory {
  id: DailySummaryMemoryId;
  startDate: string;
  endDate: string;
  summary: string;
}
