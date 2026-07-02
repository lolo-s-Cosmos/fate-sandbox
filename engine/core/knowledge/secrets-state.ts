import type { NoblePhantasm } from "../actor/actor-schema.ts";
import type { ActorId } from "../state/core-types.ts";

/**
 * Secrets 领域状态类型（自 state.ts 分拆而来，仅类型）。
 * 对应 schema 在 secrets-schema.ts；漂移由 state-schema.ts 的双向赋值检查拦截。
 * 对外仍经 state.ts re-export 原名。
 */

/**
 * 单个 actor 的隐藏聚合：他秘密是什么（secrets）、想要什么（agenda）、知道什么（knowledgeLens）。
 * 三个 facet 都是可选的；bundle.actorId 始终等于其在 actorStates 里的 key。
 * 访问一律走 secret-actor-state.ts 的访问器，不允许裸 nested 写入（由它统一维护空 bundle 修剪）。
 */
export interface SecretActorState {
  actorId: ActorId;
  secrets?: ActorSecretSlots;
  agenda?: ActorAgendaState;
  knowledgeLens?: ActorKnowledgeLens;
}

export interface ActorAgendaState {
  actorId: ActorId;
  goal: string;
  fear: string;
  currentOrder: string | null;
  lastIndependentActionAt: string | null;
}

export interface ActorKnowledgeLens {
  actorId: ActorId;
  knows: string[];
  suspects: string[];
  falseBeliefs: string[];
  forbiddenKnowledge: string[];
}

export interface ActorSecretSlots {
  actorId: ActorId;
  trueName?: SecretSlot<string>;
  hiddenNoblePhantasms: Array<SecretSlot<NoblePhantasm>>;
  privateMotives: Array<SecretSlot<string>>;
  unrevealedAffiliations: Array<SecretSlot<string>>;
}

export interface SecretSlot<T> {
  id: string;
  value: T;
  revealState: "hidden" | "foreshadowed" | "revealed";
  revealConditions: string[];
}

export interface SecretCampaignFact {
  id: string;
  text: string;
  relatedActorIds: ActorId[];
  revealState: "hidden" | "foreshadowed" | "revealed";
}

export interface SecretEventMemory {
  id: string;
  time: string;
  summary: string;
  relatedActorIds: ActorId[];
}
