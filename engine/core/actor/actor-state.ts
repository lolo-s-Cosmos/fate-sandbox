import type { ActorId, ItemId, LocationState, Percent } from "../state/core-types.ts";
import type {
  ActorKind,
  ActorStance,
  CircuitStatus,
  ContractStatus,
  ManaSupply,
  RevealStatus,
  ServantClass,
  TrackedItemCondition,
  TrackedItemKind,
  TrackedItemVisibility,
  WoundSeverity,
} from "../state/state-enum-schemas.ts";
import type { NoblePhantasm } from "./actor-schema.ts";

/**
 * Actor 领域状态类型（自 state.ts 分拆而来，仅类型）。
 * 对应 schema 在 actor-schema.ts；漂移由 state-schema.ts 的双向赋值检查拦截。
 * 对外仍经 state.ts re-export 原名。
 */

export type FateRankBase = "E" | "D" | "C" | "B" | "A" | "EX";
export type FateRank =
  | FateRankBase
  | `${FateRankBase}+`
  | `${FateRankBase}++`
  | `${FateRankBase}+++`
  | `${FateRankBase}-`;
/** 可变输出宝具（如无限剑制 E~A++）的范围评级。 */
export type FateRankRange = `${FateRank}~${FateRank}`;
/** 未知参数：对手尚未被观测/拍板时的占位；战斗比较时走中性路径。 */
export type FateRankOrUnknown = FateRank | "unknown";

export type PublicActorState =
  | HumanActorState
  | OutsiderActorState
  | SpiritActorState
  | OtherActorState;

export interface ActorBase {
  id: ActorId;
  kind: ActorKind;
  roles: ActorRole[];
  magecraft: MagecraftCapability | null;
  servantForm: ServantCoreState | null;
  identity: IdentityState;
  presentation: PresentationState;
  condition: ConditionState;
  inventory: InventoryState;
  abilities: AbilityState[];
  relationshipToProtagonist: RelationshipState;
}

export interface HumanActorState extends ActorBase {
  kind: "human";
}

export interface OutsiderActorState extends ActorBase {
  kind: "outsider";
  sourceProfile: string;
  fateTranslation: string;
  restrictions: string[];
}

export interface SpiritActorState extends ActorBase {
  kind: "spirit";
  origin: string;
}

export interface OtherActorState extends ActorBase {
  kind: "other";
  nature: string;
}

export type ActorRole = MasterRole | SocialRole | FactionRole;

export interface MasterRole {
  kind: "master";
  commandSpells: CommandSpellState;
  contractedServantIds: ActorId[];
}

export interface SocialRole {
  kind: "social";
  label: string;
}

export interface FactionRole {
  kind: "faction";
  factionId: string;
  label: string;
}

export interface CommandSpellState {
  total: number;
  remaining: number;
}

export interface IdentityState {
  publicIdentity: string;
  background: string;
  lockedFacts: LockedFact[];
}

export interface LockedFact {
  id: string;
  text: string;
}

export interface PresentationState {
  internalName: string;
  /** Renderer-facing surface name; keep exact Chinese/canonical prose spelling here. */
  renderName: string;
  apparentAge: string;
  outfit: OutfitState;
  demeanor: string;
}

export interface OutfitState {
  label: string;
  details: string;
}

export interface MagecraftCapability {
  circuits: MagecraftCircuitState;
  disciplines: MagecraftDiscipline[];
  affiliation: string | null;
}

export interface MagecraftCircuitState {
  count: string;
  quality: FateRank | "none";
  od: Percent;
  status: CircuitStatus;
  traits: string[];
}

export interface MagecraftDiscipline {
  name: string;
  rank: FateRank | "none";
  notes: string;
}

export interface RelationshipState {
  stance: ActorStance;
  summary: string;
}

export interface ConditionState {
  wounds: WoundState[];
  afflictions: AfflictionState[];
  permanentEffects: PermanentEffect[];
}

export interface WoundState {
  id: string;
  severity: WoundSeverity;
  text: string;
  recoverable: boolean;
  treatment: string | null;
}

export interface AfflictionState {
  id: string;
  source: string;
  text: string;
  expectedDuration: string | null;
}

export interface PermanentEffect {
  id: string;
  source: string;
  text: string;
  mechanicalEffect: string;
}

export interface PermanentDefect {
  id: string;
  source: string;
  text: string;
  mechanicalEffect: string;
}

export interface InventoryState {
  ordinaryItems: string[];
}

export interface AbilityState {
  id: string;
  label: string;
  summary: string;
}

export interface TrackedItemState {
  id: ItemId;
  label: string;
  kind: TrackedItemKind;
  ownerActorId: ActorId | null;
  holderActorId: ActorId | null;
  location: LocationState | null;
  condition: TrackedItemCondition;
  visibility: TrackedItemVisibility;
  notes: string[];
}

export interface ServantCoreState {
  identity: ServantIdentityState;
  condition: ServantConditionState;
  contract: ServantContractState;
  parameters: ServantParameterState;
  skills: ServantSkillState;
  noblePhantasms: NoblePhantasm[];
  currentOrder: string;
}

export interface ServantIdentityState {
  className: ServantClass;
  trueName: TrueNameState;
  locked: true;
}

export interface TrueNameState {
  status: RevealStatus;
  display: string;
}

export interface ServantConditionState {
  spiritualCore: ResourceTrack;
  mana: ResourceTrack;
  spiritualCondition: string;
  permanentDefects: PermanentDefect[];
}

export interface ResourceTrack {
  value: Percent;
}

export interface ServantContractState {
  masterActorId: ActorId | null;
  masterName: string | null;
  status: ContractStatus;
  manaSupply: ManaSupply;
}

export interface ServantParameterState {
  base: FateParams;
  modifiers: ParamModifier[];
  baseLocked: true;
}

export interface FateParams {
  strength: FateRankOrUnknown;
  endurance: FateRankOrUnknown;
  agility: FateRankOrUnknown;
  mana: FateRankOrUnknown;
  luck: FateRankOrUnknown;
  noblePhantasm: FateRankOrUnknown;
}

export interface ParamModifier {
  id: string;
  source: string;
  affectedParams: Array<keyof FateParams>;
  summary: string;
  expiresAt: string | null;
}

export interface ServantSkillState {
  classSkills: ServantSkill[];
  personalSkills: ServantSkill[];
}

export interface ServantSkill {
  name: string;
  rank: FateRank | "none";
  summary: string;
}

/**
 * NPC 印象卡（backlog #6a）。
 * 公开层，几行即可。beat complete 或 compaction 时由 GM 蒸馏更新；
 * pre-response 注入时只注入当前 scene.presentActorIds 里的卡片。
 */
export interface ActorImpression {
  actorId: ActorId;
  /** 外在气场：给人的第一印象、体格/气质/压迫感（1 行） */
  presence: string;
  /** 行动风格：说话习惯、决策偏好、典型行为模式（1 行） */
  actionStyle: string;
  /** 当前对主角的姿态（1 行） */
  relationshipPosture: string;
  /** 可选：语气材料（口头禅、断句习惯、情绪标记） */
  voiceMaterial: string;
  /** 最后更新时刻（游戏内时钟） */
  updatedAt: string;
}

export type RelationshipSignalVisibility = "player-known" | "secret";

export interface RelationshipSignal {
  id: string;
  actorId: ActorId;
  targetActorId: ActorId;
  signal: string;
  interpretation: string;
  boundary: string;
  sourceEventId: string | null;
  visibility: RelationshipSignalVisibility;
}
