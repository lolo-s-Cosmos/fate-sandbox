import type { Static } from "typebox";

import { Type } from "typebox";

import { MEMORY_CLAIM_SCHEMA } from "../knowledge/memory-schema.ts";
import {
  SCENE_THREAT_SEVERITY_SCHEMA,
  SITUATION_KIND_SCHEMA,
} from "../state/state-enum-schemas.ts";

/**
 * Scene Beat 子结构 schema：单一事实来源。
 * begin-beat / complete-beat scene 事件（scene-schema.ts）复用这些子 schema；
 * 对应输入类型由此派生（scene.ts re-export SceneBeatThreatInput 原名）。
 */
export const SCENE_BEAT_ACTION_POLICY_SCHEMA = Type.Object({
  allowedActions: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  forbiddenEscalations: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  completionCriteria: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  nextBeatHints: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
});

export const SCENE_BEAT_PRESENCE_INPUT_SCHEMA = Type.Object({
  presentActorIds: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  allyActorIds: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
});

export const SCENE_BEAT_THREAT_INPUT_SCHEMA = Type.Object({
  summary: Type.String({ minLength: 1 }),
  severity: SCENE_THREAT_SEVERITY_SCHEMA,
});
export type SceneBeatThreatInput = Static<typeof SCENE_BEAT_THREAT_INPUT_SCHEMA>;

export const SCENE_BEAT_MEMORY_INPUT_SCHEMA = Type.Object({
  title: Type.String({ minLength: 1 }),
  summary: Type.String({ minLength: 1 }),
  consequences: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  claims: Type.Array(MEMORY_CLAIM_SCHEMA),
});

export const SCENE_BEAT_NEXT_BEAT_INPUT_SCHEMA = Type.Object({
  title: Type.String({ minLength: 1 }),
  objectives: Type.Array(Type.String({ minLength: 1 })),
  beatId: Type.Optional(Type.String({ minLength: 1 })),
  actionPolicy: Type.Optional(SCENE_BEAT_ACTION_POLICY_SCHEMA),
  threats: Type.Optional(Type.Array(SCENE_BEAT_THREAT_INPUT_SCHEMA)),
  presence: Type.Optional(SCENE_BEAT_PRESENCE_INPUT_SCHEMA),
  situation: Type.Optional(SITUATION_KIND_SCHEMA),
});
