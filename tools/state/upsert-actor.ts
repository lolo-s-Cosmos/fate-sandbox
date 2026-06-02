import type {
  ActorRegistryInput,
  PublicNpcInput,
  PublicNpcSkeletonInput,
  ServantInput,
} from "../../engine/core/actor";
import type {
  ActorKind,
  ActorRole,
  FateParams,FateRank,
  NoblePhantasm,
  OutfitState,
  RelationshipState,
  ServantClass,
  ServantSkill,
} from "../../engine/core/state";

import { upsertActor } from "../../engine/core/actor";
import { assertFateRank } from "../../engine/core/fate-rank";
import { writeStateToDetails } from "../../engine/core/state";
import { persistCurrentState } from "../../engine/core/state-persistence";
import { textResult, type ToolResult } from "../runtime/tool-result";

const ACTOR_KINDS = ["human", "outsider", "spirit", "other"] as const;
const RELATIONSHIP_STANCES = ["self", "ally", "friendly", "neutral", "wary", "hostile", "unknown"] as const;
const SERVANT_CLASSES = ["Saber", "Archer", "Lancer", "Rider", "Caster", "Assassin", "Berserker"] as const;
const REVEAL_STATUSES = ["hidden", "suspected", "revealed"] as const;
const CONTRACT_STATUSES = ["stable", "weak", "cut", "masterless"] as const;
const MANA_SUPPLIES = ["sufficient", "strained", "starved"] as const;

export function upsertActorTool(params: unknown, sessionManager: unknown): ToolResult {
  const result = upsertActor(assertActorRegistryInput(params));
  persistCurrentState(sessionManager);
  const details: Record<string, unknown> = { result };
  writeStateToDetails(details);
  return textResult(result.message, details);
}

function assertActorRegistryInput(params: unknown): ActorRegistryInput {
  if (!isRecord(params)) {
    throw new Error("upsert_actor 参数必须是对象。");
  }
  const kind = assertString(params["kind"], "kind");
  switch (kind) {
    case "setup-protagonist":
      return {
        kind,
        actor: assertRecord(params["actor"], "actor"),
        reason: assertString(params["reason"], "reason"),
      } as unknown as ActorRegistryInput; // safe: protagonist setup preserves legacy full-state schema validation in engine/state.
    case "upsert-public-npc":
      return {
        kind,
        npc: assertPublicNpcInput(params["npc"]),
        reason: assertString(params["reason"], "reason"),
      };
    case "ensure-public-npc":
      return {
        kind,
        npc: assertPublicNpcSkeletonInput(params["npc"]),
        reason: assertString(params["reason"], "reason"),
      };
    case "upsert-servant":
      return {
        kind,
        servant: assertServantInput(params["servant"]),
        reason: assertString(params["reason"], "reason"),
      };
    default:
      throw new Error(
        `非法 upsert_actor.kind: ${kind}。允许值: setup-protagonist, ensure-public-npc, upsert-public-npc, upsert-servant。`,
      );
  }
}

function assertPublicNpcInput(value: unknown): PublicNpcInput {
  const npc = assertRecord(value, "npc");
  return {
    id: assertString(npc["id"], "npc.id"),
    kind: assertActorKind(npc["kind"], "npc.kind"),
    displayName: assertString(npc["displayName"], "npc.displayName"),
    publicIdentity: assertString(npc["publicIdentity"], "npc.publicIdentity"),
    apparentAge: assertString(npc["apparentAge"], "npc.apparentAge"),
    outfit: assertOutfit(npc["outfit"], "npc.outfit"),
    demeanor: assertString(npc["demeanor"], "npc.demeanor"),
    publicRoles: assertActorRoles(npc["publicRoles"], "npc.publicRoles"),
    relationshipToProtagonist: assertRelationship(npc["relationshipToProtagonist"], "npc.relationshipToProtagonist"),
    ordinaryItems: assertStringArray(npc["ordinaryItems"], "npc.ordinaryItems"),
  };
}

function assertPublicNpcSkeletonInput(value: unknown): PublicNpcSkeletonInput {
  const npc = assertRecord(value, "npc");
  return {
    actorId: assertString(npc["actorId"], "npc.actorId"),
    npcKind: assertOptionalActorKind(npc["npcKind"], "npc.npcKind"),
    displayName: assertString(npc["displayName"], "npc.displayName"),
    publicIdentity: assertString(npc["publicIdentity"], "npc.publicIdentity"),
    apparentAge: assertOptionalString(npc["apparentAge"], "npc.apparentAge"),
    outfit: assertOptionalOutfit(npc["outfit"], "npc.outfit"),
    demeanor: assertOptionalString(npc["demeanor"], "npc.demeanor"),
    publicRoles: assertOptionalActorRoles(npc["publicRoles"], "npc.publicRoles"),
    relationshipToProtagonist: assertOptionalRelationship(
      npc["relationshipToProtagonist"],
      "npc.relationshipToProtagonist",
    ),
    ordinaryItems: assertOptionalStringArray(npc["ordinaryItems"], "npc.ordinaryItems"),
  };
}

function assertServantInput(value: unknown): ServantInput {
  const servant = assertRecord(value, "servant");
  return {
    id: assertString(servant["id"], "servant.id"),
    displayName: assertString(servant["displayName"], "servant.displayName"),
    publicIdentity: assertString(servant["publicIdentity"], "servant.publicIdentity"),
    apparentAge: assertString(servant["apparentAge"], "servant.apparentAge"),
    outfit: assertOutfit(servant["outfit"], "servant.outfit"),
    demeanor: assertString(servant["demeanor"], "servant.demeanor"),
    className: assertServantClass(servant["className"], "servant.className"),
    trueNameDisplay: assertString(servant["trueNameDisplay"], "servant.trueNameDisplay"),
    trueNameStatus: assertRevealStatus(servant["trueNameStatus"], "servant.trueNameStatus"),
    parameters: assertFateParams(servant["parameters"], "servant.parameters"),
    classSkills: assertServantSkills(servant["classSkills"], "servant.classSkills"),
    personalSkills: assertServantSkills(servant["personalSkills"], "servant.personalSkills"),
    noblePhantasms: assertNoblePhantasms(servant["noblePhantasms"], "servant.noblePhantasms"),
    spiritualCore: assertInteger(servant["spiritualCore"], "servant.spiritualCore"),
    mana: assertInteger(servant["mana"], "servant.mana"),
    spiritualCondition: assertString(servant["spiritualCondition"], "servant.spiritualCondition"),
    masterActorId: assertNullableString(servant["masterActorId"], "servant.masterActorId"),
    masterName: assertNullableString(servant["masterName"], "servant.masterName"),
    contractStatus: assertOneOf(servant["contractStatus"], "servant.contractStatus", CONTRACT_STATUSES),
    manaSupply: assertOneOf(servant["manaSupply"], "servant.manaSupply", MANA_SUPPLIES),
    currentOrder: assertString(servant["currentOrder"], "servant.currentOrder"),
    publicRoles: assertOptionalActorRoles(servant["publicRoles"], "servant.publicRoles"),
    relationshipToProtagonist: assertOptionalRelationship(
      servant["relationshipToProtagonist"],
      "servant.relationshipToProtagonist",
    ),
    ordinaryItems: assertOptionalStringArray(servant["ordinaryItems"], "servant.ordinaryItems"),
  };
}

function assertRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} 必须是对象。`);
  }
  return value;
}

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} 必须是非空字符串。`);
  }
  return value.trim();
}

function assertOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertString(value, fieldName);
}

function assertNullableString(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return assertString(value, fieldName);
}

function assertInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${fieldName} 必须是整数。`);
  }
  return value;
}

function assertStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是字符串数组。`);
  }
  return value.map((item, index) => assertString(item, `${fieldName}.${index}`));
}

function assertOptionalStringArray(value: unknown, fieldName: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertStringArray(value, fieldName);
}

function assertOneOf<T extends string>(value: unknown, fieldName: string, allowed: readonly T[]): T {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} 必须是字符串。允许值: ${allowed.join(", ")}。`);
  }
  for (const candidate of allowed) {
    if (value === candidate) {
      return candidate;
    }
  }
  throw new Error(`非法 ${fieldName}: ${value}。允许值: ${allowed.join(", ")}。`);
}

function assertActorKind(value: unknown, fieldName: string): ActorKind {
  return assertOneOf(value, fieldName, ACTOR_KINDS);
}

function assertOptionalActorKind(value: unknown, fieldName: string): ActorKind | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertActorKind(value, fieldName);
}

function assertServantClass(value: unknown, fieldName: string): ServantClass {
  return assertOneOf(value, fieldName, SERVANT_CLASSES);
}

function assertRevealStatus(value: unknown, fieldName: string): "hidden" | "suspected" | "revealed" {
  return assertOneOf(value, fieldName, REVEAL_STATUSES);
}

function assertOutfit(value: unknown, fieldName: string): OutfitState {
  const outfit = assertRecord(value, fieldName);
  return {
    label: assertString(outfit["label"], `${fieldName}.label`),
    details: assertString(outfit["details"], `${fieldName}.details`),
  };
}

function assertOptionalOutfit(value: unknown, fieldName: string): OutfitState | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertOutfit(value, fieldName);
}

function assertRelationship(value: unknown, fieldName: string): RelationshipState {
  const relationship = assertRecord(value, fieldName);
  return {
    stance: assertOneOf(relationship["stance"], `${fieldName}.stance`, RELATIONSHIP_STANCES),
    summary: assertString(relationship["summary"], `${fieldName}.summary`),
  };
}

function assertOptionalRelationship(value: unknown, fieldName: string): RelationshipState | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertRelationship(value, fieldName);
}

function assertActorRoles(value: unknown, fieldName: string): ActorRole[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是角色数组。`);
  }
  return value.map((item, index) => assertActorRole(item, `${fieldName}.${index}`));
}

function assertOptionalActorRoles(value: unknown, fieldName: string): ActorRole[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return assertActorRoles(value, fieldName);
}

function assertActorRole(value: unknown, fieldName: string): ActorRole {
  const role = assertRecord(value, fieldName);
  const kind = assertString(role["kind"], `${fieldName}.kind`);
  switch (kind) {
    case "social":
      return { kind, label: assertString(role["label"], `${fieldName}.label`) };
    case "faction":
      return {
        kind,
        factionId: assertString(role["factionId"], `${fieldName}.factionId`),
        label: assertString(role["label"], `${fieldName}.label`),
      };
    case "master":
      return {
        kind,
        commandSpells: assertCommandSpells(role["commandSpells"], `${fieldName}.commandSpells`),
        contractedServantIds: assertStringArray(
          role["contractedServantIds"],
          `${fieldName}.contractedServantIds`,
        ),
      };
    default:
      throw new Error(`非法 ${fieldName}.kind: ${kind}。允许值: social, faction, master。`);
  }
}

function assertCommandSpells(value: unknown, fieldName: string): { total: number; remaining: number } {
  const commandSpells = assertRecord(value, fieldName);
  return {
    total: assertInteger(commandSpells["total"], `${fieldName}.total`),
    remaining: assertInteger(commandSpells["remaining"], `${fieldName}.remaining`),
  };
}

function assertFateParams(value: unknown, fieldName: string): FateParams {
  const params = assertRecord(value, fieldName);
  return {
    strength: assertFateRank(params["strength"], `${fieldName}.strength`),
    endurance: assertFateRank(params["endurance"], `${fieldName}.endurance`),
    agility: assertFateRank(params["agility"], `${fieldName}.agility`),
    mana: assertFateRank(params["mana"], `${fieldName}.mana`),
    luck: assertFateRank(params["luck"], `${fieldName}.luck`),
    noblePhantasm: assertFateRank(params["noblePhantasm"], `${fieldName}.noblePhantasm`),
  };
}

function assertFateRankOrNone(value: unknown, fieldName: string): FateRank | "none" {
  if (value === "none") {
    return "none";
  }
  return assertFateRank(value, fieldName);
}

function assertServantSkills(value: unknown, fieldName: string): ServantSkill[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是技能数组。`);
  }
  return value.map((item, index) => assertServantSkill(item, `${fieldName}.${index}`));
}

function assertServantSkill(value: unknown, fieldName: string): ServantSkill {
  const skill = assertRecord(value, fieldName);
  return {
    name: assertString(skill["name"], `${fieldName}.name`),
    rank: assertFateRankOrNone(skill["rank"], `${fieldName}.rank`),
    summary: assertString(skill["summary"], `${fieldName}.summary`),
  };
}

function assertNoblePhantasms(value: unknown, fieldName: string): NoblePhantasm[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是宝具数组。`);
  }
  return value.map((item, index) => assertNoblePhantasm(item, `${fieldName}.${index}`));
}

function assertNoblePhantasm(value: unknown, fieldName: string): NoblePhantasm {
  const noblePhantasm = assertRecord(value, fieldName);
  return {
    name: assertString(noblePhantasm["name"], `${fieldName}.name`),
    rank: assertFateRankOrNone(noblePhantasm["rank"], `${fieldName}.rank`),
    kind: assertString(noblePhantasm["kind"], `${fieldName}.kind`),
    status: assertRevealStatus(noblePhantasm["status"], `${fieldName}.status`),
    summary: assertString(noblePhantasm["summary"], `${fieldName}.summary`),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
