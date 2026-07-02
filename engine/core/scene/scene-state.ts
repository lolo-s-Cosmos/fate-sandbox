import type {
  ActorId,
  LocationState,
  SceneObjectiveId,
  SceneThreatId,
  StoryArcId,
  StoryBeatId,
} from "../state/core-types.ts";
import type { SceneThreatSeverity, SituationKind } from "../state/state-enum-schemas.ts";

/**
 * Scene 领域状态类型（自 state.ts 分拆而来，仅类型）。
 * 对应 schema 在 scene-schema.ts；漂移由 state-schema.ts 的双向赋值检查拦截。
 * 对外仍经 state.ts re-export 原名。
 */

export type SceneObjectiveStatus = "active" | "blocked" | "resolved";

export interface SceneState {
  location: LocationState;
  situation: SituationKind;
  storyWindow: StoryWindowState | null;
  presentActorIds: ActorId[];
  objectives: SceneObjective[];
  threats: SceneThreat[];
  lastResolvedAt: string;
}

export interface StoryWindowState {
  currentArcId: StoryArcId;
  currentBeatId: StoryBeatId;
  title: string;
  allowedActions: string[];
  forbiddenEscalations: string[];
  completionCriteria: string[];
  nextBeatHints: string[];
}

export interface SceneObjective {
  id: SceneObjectiveId;
  summary: string;
  status: SceneObjectiveStatus;
}

export interface SceneThreat {
  id: SceneThreatId;
  summary: string;
  severity: SceneThreatSeverity;
}
