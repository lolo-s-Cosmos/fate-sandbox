import type {
  ActorImpression,
  PublicActorState,
  RelationshipSignal,
  TrackedItemState,
} from "../actor/actor-state.ts";
import type {
  BackstageObligation,
  BackstagePendingHarvest,
  BackstagePressureState,
  BackstageReviewEntry,
  FactionClock,
  ScheduledEvent,
} from "../backstage/backstage-state.ts";
import type { OffscreenEvent } from "../backstage/parallel-line.ts";
import type { EconomyState } from "../economy/economy-state.ts";
import type { HookState } from "../knowledge/hook-schema.ts";
import type { CampaignMemory } from "../knowledge/memory-state.ts";
import type {
  SecretActorState,
  SecretCampaignFact,
  SecretEventMemory,
} from "../knowledge/secrets-state.ts";
import type { SceneState } from "../scene/scene-state.ts";
import type { ActorId, ItemId, LocationState } from "./core-types.ts";
import type { OpeningMode, RuleSetId, TimelineId, TimeZoneId } from "./state-enum-schemas.ts";

/**
 * State 树的组合根 + 类型转发桶：领域状态类型住在各自领域的 *-state.ts
 * （actor / scene / economy / knowledge / backstage），本文件只保留状态机骨架
 * 自己的类型（GameState / meta / campaign / clock / turnLog / obligations /
 * 导出投影），并 re-export 全部原名——消费方一律从这里 import，领域文件
 * 搬迁不外溢。对应 schema 组合根在 state-schema.ts。
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

export interface GameState {
  meta: StateMeta;
  public: PublicGameState;
  secrets: SecretGameState;
}

export interface StateMeta {
  schemaVersion: 19;
  createdAt: string;
  updatedAt: string;
  /** Seeded RNG seed（backlog #9）：确定性随机源，初始化时生成 */
  rngSeed: number;
  /** Seeded RNG counter：每次消耗 +1，rewind 后重放行为一致 */
  rngCounter: number;
}

export interface PublicGameState {
  campaign: CampaignState;
  clock: ClockState;
  scene: SceneState;
  actors: Record<ActorId, PublicActorState>;
  trackedItems: Record<ItemId, TrackedItemState>;
  protagonistActorId: ActorId;
  allyActorIds: ActorId[];
  economy: EconomyState;
  memory: CampaignMemory;
  turnLog: TurnLogEntry[];
  /** 裁决已出、尚未落地的强制状态变更；canonical commit 前必须清空 */
  obligations: TurnObligation[];
  /** Mystery hook 账本：hook budget 从 prompt 自觉变成领域对象（backlog #2） */
  hooks: HookState[];
  /** 玩家已知的关系信号证据链；只记录行为证据，不写隐藏内心判词 */
  relationshipSignals: RelationshipSignal[];
  /** NPC 印象卡：voice/posture/texture 蒸馏快照，presence 驱动注入；按 actorId 聚合 */
  actorImpressions: Record<ActorId, ActorImpression>;
}

export type TurnObligationKind =
  | "scene-objective"
  | "scene-threat"
  | "actor-condition"
  | "servant-form"
  | "memory"
  | "reveal-secret";

export interface TurnObligation {
  id: string;
  /** 产生此义务的裁决源，如 "combat-exchange" */
  source: string;
  kind: TurnObligationKind;
  summary: string;
  /** 登记时的游戏内时钟 */
  createdAt: string;
}

export interface SecretGameState {
  /**
   * GM 对每个 actor 的隐藏内部模型，按 actorId 聚合。
   * 三个 facet（secrets / agenda / knowledgeLens）同生死、同过 removeActorEverywhere 级联。
   * 未来新增的 per-actor 秘密状态应作为 SecretActorState 的新字段，而非新的顶层侧表。
   */
  actorStates: Record<ActorId, SecretActorState>;
  campaignSecrets: SecretCampaignFact[];
  secretEventLog: SecretEventMemory[];
  offscreenEventLog: OffscreenEvent[];
  /** BITD 式阵营进度钟：世界不为玩家暂停的机械载体 */
  factionClocks: FactionClock[];
  /** 到期义务：越过 dueAt 后 canonical commit 会在返回值里催账 */
  scheduledEvents: ScheduledEvent[];
  /** 玩家未确认的关系信号与误判，只给 GM/private resolve/subagent 使用 */
  relationshipSignals: RelationshipSignal[];
  /**
   * 后台世界推进义务账本（backlog #5 runtime 闭环）：触发器命中时生成，
   * 下一 canonical turn 前必须清账（延迟硬阻断）。与 public obligations 独立。
   */
  backstageObligations: BackstageObligation[];
  /** 后台义务的审查记录：candidate 落地 / no-change / blocked 都在此留痕，不污染 public */
  backstageReviewLog: BackstageReviewEntry[];
  /** 后台压力计数：跨回合的连续无代价计数器 */
  backstagePressure: BackstagePressureState;
  /**
   * 待 harvest 的后台 director run（run_parallel_line 起飞即记，harvest 即清）。
   * 引擎据此在 canonical commit 催账，并让 resolve_backstage_line 在有未 harvest run 时
   * 拒绝清账——防止已产出的候选被一句 no-change 静默丢弃。
   */
  backstagePendingHarvests: BackstagePendingHarvest[];
}

export interface CampaignState {
  title: string;
  timeline: TimelineId;
  openingMode: OpeningMode;
  premise: string;
  activeRuleSetIds: RuleSetId[];
}

export interface ClockState {
  startedAt: string;
  currentAt: string;
  timezone: TimeZoneId;
  lastLongRestAt: string | null;
}

export type TurnTimePolicy =
  | { kind: "elapsed"; elapsedMinutes: number; reason: string }
  | { kind: "travel"; location: LocationState; elapsedMinutes: number; reason: string };

export interface TurnLogEntry {
  id: string;
  summary: string;
  startedAt: string;
  endedAt: string;
  time: TurnTimePolicy;
  eventCount: number;
  resultCount: number;
}

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
