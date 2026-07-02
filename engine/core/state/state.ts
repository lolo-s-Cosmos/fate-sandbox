import type { Static } from "typebox";

import type {
  CAMPAIGN_STATE_SCHEMA,
  CLOCK_STATE_SCHEMA,
  PUBLIC_GAME_STATE_SCHEMA,
  SECRET_GAME_STATE_SCHEMA,
  STATE_META_SCHEMA,
  STATE_SCHEMA,
  TURN_LOG_ENTRY_SCHEMA,
  TURN_OBLIGATION_KINDS,
  TURN_OBLIGATION_SCHEMA,
  TURN_TIME_POLICY_STATE_SCHEMA,
} from "./state-schema.ts";

/**
 * State 树的类型转发桶：领域状态类型住在各自领域的 *-state.ts
 * （actor / scene / economy / knowledge / backstage），骨架类型（GameState /
 * meta / campaign / clock / turnLog / obligations）从 state-schema.ts 的组合根
 * Static 派生——schema 是唯一事实源，不存在第二份手写形状。本文件
 * re-export 全部原名：消费方一律从这里 import，领域文件搬迁不外溢。
 * 仅导出投影（TimeExportState / StateExport）保持手写。
 */

export type { NoblePhantasm } from "../actor/actor-schema.ts";
export type {
  AbilityState,
  ActorBase,
  ActorImpression,
  ActorRole,
  AfflictionState,
  CommandSpellState,
  ConditionState,
  FactionRole,
  FateParams,
  FateRank,
  FateRankBase,
  FateRankOrUnknown,
  FateRankRange,
  HumanActorState,
  IdentityState,
  InventoryState,
  LockedFact,
  MagecraftCapability,
  MagecraftCircuitState,
  MagecraftDiscipline,
  MasterRole,
  OtherActorState,
  OutfitState,
  OutsiderActorState,
  ParamModifier,
  PermanentDefect,
  PermanentEffect,
  PresentationState,
  PublicActorState,
  RelationshipSignal,
  RelationshipSignalVisibility,
  RelationshipState,
  ResourceTrack,
  ServantConditionState,
  ServantContractState,
  ServantCoreState,
  ServantIdentityState,
  ServantParameterState,
  ServantSkill,
  ServantSkillState,
  SocialRole,
  SpiritActorState,
  TrackedItemState,
  TrueNameState,
  WoundState,
} from "../actor/actor-state.ts";
export type {
  BackstageObligation,
  BackstagePendingHarvest,
  BackstagePressureState,
  BackstageResolutionOutcome,
  BackstageReviewEntry,
  BackstageTrigger,
  FactionClock,
  ScheduledEvent,
} from "../backstage/backstage-state.ts";
export type {
  OffscreenEvent,
  OffscreenEventSource,
  OffscreenEventVisibility,
  ParallelLineInput,
  ParallelLineOutput,
  ParallelLineOutcome,
  ParallelLinePressureSlotHint,
  ParallelLineRecentEvent,
  ParallelLineTimeWindow,
  ParallelLineToneDriftRisk,
} from "../backstage/parallel-line.ts";
export type { DebtState, EconomyState, MoneyPurse } from "../economy/economy-state.ts";
export type { HookState, HookStatus } from "../knowledge/hook-schema.ts";
export type {
  CampaignMemory,
  DailyEventMemory,
  DailySummaryMemory,
  MajorEventMemory,
  MemoryFact,
} from "../knowledge/memory-state.ts";
export type {
  ActorAgendaState,
  ActorKnowledgeLens,
  ActorSecretSlots,
  SecretActorState,
  SecretCampaignFact,
  SecretEventMemory,
  SecretSlot,
} from "../knowledge/secrets-state.ts";
export type {
  SceneObjective,
  SceneObjectiveStatus,
  SceneState,
  SceneThreat,
  StoryWindowState,
} from "../scene/scene-state.ts";
export type {
  ActorId,
  DailyEventMemoryId,
  DailySummaryMemoryId,
  ItemId,
  LocationState,
  MajorEventMemoryId,
  MemoryFactId,
  Percent,
  SceneObjectiveId,
  SceneThreatId,
  StoryArcId,
  StoryBeatId,
} from "./core-types.ts";
export type {
  ActorKind,
  ActorStance,
  BoundaryKind,
  CircuitStatus,
  ContractStatus,
  CurrencyCode,
  ManaSupply,
  MemoryFactScope,
  OpeningMode,
  PurseAccess,
  RevealStatus,
  RuleSetId,
  SceneThreatSeverity,
  ServantClass,
  SituationKind,
  TimelineId,
  TimeZoneId,
  TrackedItemCondition,
  TrackedItemKind,
  TrackedItemVisibility,
  WoundSeverity,
} from "./state-enum-schemas.ts";

export type GameState = Static<typeof STATE_SCHEMA>;
export type StateMeta = Static<typeof STATE_META_SCHEMA>;
export type PublicGameState = Static<typeof PUBLIC_GAME_STATE_SCHEMA>;
export type SecretGameState = Static<typeof SECRET_GAME_STATE_SCHEMA>;
export type CampaignState = Static<typeof CAMPAIGN_STATE_SCHEMA>;
export type ClockState = Static<typeof CLOCK_STATE_SCHEMA>;
export type TurnTimePolicy = Static<typeof TURN_TIME_POLICY_STATE_SCHEMA>;
export type TurnLogEntry = Static<typeof TURN_LOG_ENTRY_SCHEMA>;
export type TurnObligationKind = (typeof TURN_OBLIGATION_KINDS)[number];
export type TurnObligation = Static<typeof TURN_OBLIGATION_SCHEMA>;

export interface TimeExportState extends ClockState {
  displayTime: string;
  date: string;
  weekday: string;
  time: string;
}

export interface StateExport extends Omit<GameState, "public"> {
  public: Omit<PublicGameState, "clock"> & { clock: TimeExportState };
}

export type State = GameState;

export const CURRENT_STATE_SCHEMA_VERSION = 19;
