import type { Static } from "typebox";

import type { ActorKind } from "../state/state-enum-schemas.ts";
import type {
  ABILITY_STATE_SCHEMA,
  ACTOR_IMPRESSION_SCHEMA,
  ACTOR_ROLE_SCHEMA,
  AFFLICTION_STATE_SCHEMA,
  COMMAND_SPELL_STATE_SCHEMA,
  CONDITION_STATE_SCHEMA,
  FACTION_ROLE_SCHEMA,
  FATE_PARAMS_SCHEMA,
  HUMAN_ACTOR_STATE_SCHEMA,
  IDENTITY_STATE_SCHEMA,
  INVENTORY_STATE_SCHEMA,
  MAGECRAFT_CAPABILITY_SCHEMA,
  MAGECRAFT_CIRCUIT_STATE_SCHEMA,
  MAGECRAFT_DISCIPLINE_SCHEMA,
  MASTER_ROLE_SCHEMA,
  OTHER_ACTOR_STATE_SCHEMA,
  OUTFIT_STATE_SCHEMA,
  OUTSIDER_ACTOR_STATE_SCHEMA,
  PARAM_MODIFIER_SCHEMA,
  PERMANENT_EFFECT_SCHEMA,
  PRESENTATION_STATE_SCHEMA,
  PUBLIC_ACTOR_STATE_SCHEMA,
  RELATIONSHIP_SIGNAL_SCHEMA,
  RELATIONSHIP_SIGNAL_VISIBILITIES,
  RELATIONSHIP_STATE_SCHEMA,
  RESOURCE_TRACK_SCHEMA,
  SERVANT_CONDITION_STATE_SCHEMA,
  SERVANT_CONTRACT_STATE_SCHEMA,
  SERVANT_CORE_STATE_SCHEMA,
  SERVANT_IDENTITY_STATE_SCHEMA,
  SERVANT_PARAMETER_STATE_SCHEMA,
  SERVANT_SKILL_SCHEMA,
  SERVANT_SKILL_STATE_SCHEMA,
  SOCIAL_ROLE_SCHEMA,
  SPIRIT_ACTOR_STATE_SCHEMA,
  TRACKED_ITEM_STATE_SCHEMA,
  TRUE_NAME_STATE_SCHEMA,
  WOUND_STATE_SCHEMA,
} from "./actor-schema.ts";

/**
 * Actor 领域状态类型：自 actor-schema.ts 的 TypeBox schema 派生，
 * schema 是唯一事实源——改状态形状只改 schema，类型自动跟进。
 * 例外：FateRank 族是模板字面量类型，pattern 校验表达不了它，必须手写在此，
 * schema 侧用 Type.Unsafe<FateRank> 反向引用（本文件与 actor-schema.ts 因此
 * 构成 type-only 双向引用，运行时全部擦除）。
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

export type PublicActorState = Static<typeof PUBLIC_ACTOR_STATE_SCHEMA>;
export type HumanActorState = Static<typeof HUMAN_ACTOR_STATE_SCHEMA>;
export type OutsiderActorState = Static<typeof OUTSIDER_ACTOR_STATE_SCHEMA>;
export type SpiritActorState = Static<typeof SPIRIT_ACTOR_STATE_SCHEMA>;
export type OtherActorState = Static<typeof OTHER_ACTOR_STATE_SCHEMA>;
/** 四个 kind 变体的公共骨架（schema 侧对应 ACTOR_BASE_PROPERTIES 展开）。 */
export type ActorBase = Omit<HumanActorState, "kind"> & { kind: ActorKind };

export type ActorRole = Static<typeof ACTOR_ROLE_SCHEMA>;
export type MasterRole = Static<typeof MASTER_ROLE_SCHEMA>;
export type SocialRole = Static<typeof SOCIAL_ROLE_SCHEMA>;
export type FactionRole = Static<typeof FACTION_ROLE_SCHEMA>;
export type CommandSpellState = Static<typeof COMMAND_SPELL_STATE_SCHEMA>;

export type IdentityState = Static<typeof IDENTITY_STATE_SCHEMA>;
export type LockedFact = IdentityState["lockedFacts"][number];
export type PresentationState = Static<typeof PRESENTATION_STATE_SCHEMA>;
export type OutfitState = Static<typeof OUTFIT_STATE_SCHEMA>;
export type RelationshipState = Static<typeof RELATIONSHIP_STATE_SCHEMA>;

export type MagecraftCapability = Static<typeof MAGECRAFT_CAPABILITY_SCHEMA>;
export type MagecraftCircuitState = Static<typeof MAGECRAFT_CIRCUIT_STATE_SCHEMA>;
export type MagecraftDiscipline = Static<typeof MAGECRAFT_DISCIPLINE_SCHEMA>;

export type ConditionState = Static<typeof CONDITION_STATE_SCHEMA>;
export type WoundState = Static<typeof WOUND_STATE_SCHEMA>;
export type AfflictionState = Static<typeof AFFLICTION_STATE_SCHEMA>;
export type PermanentEffect = Static<typeof PERMANENT_EFFECT_SCHEMA>;
/** 与 PermanentEffect 同构；从者灵基上的永久缺损语义独立成名。 */
export type PermanentDefect = Static<typeof PERMANENT_EFFECT_SCHEMA>;
export type InventoryState = Static<typeof INVENTORY_STATE_SCHEMA>;
export type AbilityState = Static<typeof ABILITY_STATE_SCHEMA>;
export type TrackedItemState = Static<typeof TRACKED_ITEM_STATE_SCHEMA>;

export type ServantCoreState = Static<typeof SERVANT_CORE_STATE_SCHEMA>;
export type ServantIdentityState = Static<typeof SERVANT_IDENTITY_STATE_SCHEMA>;
export type TrueNameState = Static<typeof TRUE_NAME_STATE_SCHEMA>;
export type ServantConditionState = Static<typeof SERVANT_CONDITION_STATE_SCHEMA>;
export type ResourceTrack = Static<typeof RESOURCE_TRACK_SCHEMA>;
export type ServantContractState = Static<typeof SERVANT_CONTRACT_STATE_SCHEMA>;
export type ServantParameterState = Static<typeof SERVANT_PARAMETER_STATE_SCHEMA>;
export type FateParams = Static<typeof FATE_PARAMS_SCHEMA>;
export type ParamModifier = Static<typeof PARAM_MODIFIER_SCHEMA>;
export type ServantSkillState = Static<typeof SERVANT_SKILL_STATE_SCHEMA>;
export type ServantSkill = Static<typeof SERVANT_SKILL_SCHEMA>;

export type ActorImpression = Static<typeof ACTOR_IMPRESSION_SCHEMA>;
export type RelationshipSignalVisibility = (typeof RELATIONSHIP_SIGNAL_VISIBILITIES)[number];
export type RelationshipSignal = Static<typeof RELATIONSHIP_SIGNAL_SCHEMA>;
