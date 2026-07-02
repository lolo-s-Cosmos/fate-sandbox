import type { BoundaryKind } from "./state-enum-schemas.ts";

/**
 * State 树的公共基础类型（叶子模块，仅类型）：ID 别名、跨域标量与 LocationState。
 * 各领域 *-state.ts 与 state.ts 组合根共用；对外仍经 state.ts re-export 原名。
 */

export type ActorId = string;
export type ItemId = string;
export type SceneObjectiveId = string;
export type SceneThreatId = string;
export type StoryArcId = string;
export type StoryBeatId = string;
export type MemoryFactId = string;
export type MajorEventMemoryId = string;
export type DailyEventMemoryId = string;
export type DailySummaryMemoryId = string;
export type Percent = number;

export interface LocationState {
  region: string;
  site: string;
  detail: string;
  boundary: BoundaryKind;
}
