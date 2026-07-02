/**
 * Backstage 领域状态类型（自 state.ts 分拆而来，仅类型）。
 * 对应 schema 在 backstage-state-schema.ts；漂移由 state-schema.ts 的双向赋值检查拦截。
 * 对外仍经 state.ts re-export 原名。（OffscreenEvent 本就住在 parallel-line.ts。）
 */

/** 生成后台义务的触发源（v1 可检测核心集） */
export type BackstageTrigger = "time-advance" | "beat-complete" | "no-cost-streak";

export interface BackstageObligation {
  id: string;
  trigger: BackstageTrigger;
  summary: string;
  createdAt: string;
}

/** 后台义务的清账结果：landed=落地候选；no-change/blocked=经审查的显式无推进 */
export type BackstageResolutionOutcome = "landed" | "no-change" | "blocked";

export interface BackstageReviewEntry {
  id: string;
  obligationId: string;
  outcome: BackstageResolutionOutcome;
  reasonCode: string;
  note: string;
  reviewedAt: string;
}

export interface BackstagePressureState {
  consecutiveNoCostTurns: number;
}

/** 已起飞但尚未 harvest 的后台 director run 标记。 */
export interface BackstagePendingHarvest {
  runId: string;
  lineId: string;
  spawnedAt: string;
}

export interface FactionClock {
  id: string;
  /** 阵营/势力标识，自由字符串（尚无阵营 registry） */
  factionId: string;
  label: string;
  filled: number;
  size: number;
  /** hidden = 玩家完全不知；leaked = 玩家已感知到征兆 */
  visibility: "hidden" | "leaked";
}

export interface ScheduledEvent {
  id: string;
  /** 游戏内时钟 ISO；currentAt 越过即到期 */
  dueAt: string;
  summary: string;
}
