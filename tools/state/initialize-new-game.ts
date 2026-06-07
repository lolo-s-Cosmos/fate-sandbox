import type {
  HumanNewGameInput,
  HumanProtagonistOpeningInput,
  NewGameCampaignInput,
  NewGameInitializationInput,
  NewGamePresenceInput,
  ServantNewGameInput,
  ServantProtagonistOpeningInput,
} from "../../engine/core/new-game-initialization";
import type { FateParams, OutfitState, ServantClass } from "../../engine/core/state";

import { initializeNewGame } from "../../engine/core/new-game-initialization";
import { assertFateRank } from "../../engine/core/fate-rank";
import type { ToolResult } from "../runtime/tool-result";

import { resultDetails, runDomainEventTool } from "./domain-tool-runner";
import {
  assertOneOf,
  assertRecord,
  assertString,
  assertStringArray,
  normalizeOptionalString,
  normalizeOptionalStringArray,
} from "./tool-input";

const SERVANT_CLASSES = [
  "Saber",
  "Archer",
  "Lancer",
  "Rider",
  "Caster",
  "Assassin",
  "Berserker",
  "Avenger",
  "Ruler",
  "AlterEgo",
  "Foreigner",
  "Shielder",
  "MoonCancer",
  "Pretender",
  "Custom",
] as const satisfies readonly ServantClass[];

export function initializeNewGameTool(params: unknown, sessionManager: unknown): ToolResult {
  return runDomainEventTool({
    sessionManager,
    execute: () => initializeNewGame(assertNewGameInitializationInput(params)),
    details: resultDetails,
    message: (result) => result.message,
  });
}

function assertNewGameInitializationInput(params: unknown): NewGameInitializationInput {
  const input = assertRecord(params, "initialize_new_game 参数");
  const kind = assertOneOf(input["kind"], "kind", ["human-protagonist", "servant-protagonist"] as const);
  if (kind === "human-protagonist") {
    return assertHumanNewGameInput(input);
  }
  return assertServantNewGameInput(input);
}

function assertHumanNewGameInput(input: Record<string, unknown>): HumanNewGameInput {
  return {
    kind: "human-protagonist",
    campaign: assertCampaign(input["campaign"]),
    protagonist: assertHumanProtagonist(input["protagonist"]),
    presence: normalizeOptionalPresence(input["presence"]),
    reason: assertString(input["reason"], "reason"),
  };
}

function assertServantNewGameInput(input: Record<string, unknown>): ServantNewGameInput {
  const hiddenTrueName = input["hiddenTrueName"];
  return {
    kind: "servant-protagonist",
    campaign: assertCampaign(input["campaign"]),
    protagonist: assertServantProtagonist(input["protagonist"]),
    presence: normalizeOptionalPresence(input["presence"]),
    hiddenTrueName:
      hiddenTrueName === undefined
        ? undefined
        : {
            value: assertString(assertRecord(hiddenTrueName, "hiddenTrueName")["value"], "hiddenTrueName.value"),
            revealConditions: assertStringArray(
              assertRecord(hiddenTrueName, "hiddenTrueName")["revealConditions"],
              "hiddenTrueName.revealConditions",
            ),
          },
    reason: assertString(input["reason"], "reason"),
  };
}

function assertCampaign(value: unknown): NewGameCampaignInput {
  const input = assertRecord(value, "campaign");
  return {
    presetId: assertString(input["presetId"], "campaign.presetId"),
    title: normalizeOptionalString(input["title"], "campaign.title"),
    premise: normalizeOptionalString(input["premise"], "campaign.premise"),
    startedAt: normalizeOptionalString(input["startedAt"], "campaign.startedAt"),
    currentAt: normalizeOptionalString(input["currentAt"], "campaign.currentAt"),
    reason: normalizeOptionalString(input["reason"], "campaign.reason"),
  };
}

function assertHumanProtagonist(value: unknown): HumanProtagonistOpeningInput {
  const input = assertRecord(value, "protagonist");
  return {
    displayName: assertString(input["displayName"], "protagonist.displayName"),
    publicIdentity: assertString(input["publicIdentity"], "protagonist.publicIdentity"),
    background: assertString(input["background"], "protagonist.background"),
    apparentAge: assertString(input["apparentAge"], "protagonist.apparentAge"),
    outfit: assertOutfit(input["outfit"], "protagonist.outfit"),
    demeanor: assertString(input["demeanor"], "protagonist.demeanor"),
    abilities: normalizeOptionalStringArray(input["abilities"], "protagonist.abilities"),
    ordinaryItems: normalizeOptionalStringArray(input["ordinaryItems"], "protagonist.ordinaryItems"),
  };
}

function assertServantProtagonist(value: unknown): ServantProtagonistOpeningInput {
  const input = assertRecord(value, "protagonist");
  return {
    displayName: assertString(input["displayName"], "protagonist.displayName"),
    publicIdentity: assertString(input["publicIdentity"], "protagonist.publicIdentity"),
    apparentAge: assertString(input["apparentAge"], "protagonist.apparentAge"),
    outfit: assertOutfit(input["outfit"], "protagonist.outfit"),
    demeanor: assertString(input["demeanor"], "protagonist.demeanor"),
    className: assertOneOf(input["className"], "protagonist.className", SERVANT_CLASSES),
    trueNameDisplay: assertString(input["trueNameDisplay"], "protagonist.trueNameDisplay"),
    trueNameStatus: assertOneOf(input["trueNameStatus"], "protagonist.trueNameStatus", [
      "hidden",
      "suspected",
    ] as const),
    parameters: normalizeOptionalFateParams(input["parameters"]),
    ordinaryItems: normalizeOptionalStringArray(input["ordinaryItems"], "protagonist.ordinaryItems"),
  };
}

function assertOutfit(value: unknown, fieldName: string): OutfitState {
  const input = assertRecord(value, fieldName);
  return {
    label: assertString(input["label"], `${fieldName}.label`),
    details: assertString(input["details"], `${fieldName}.details`),
  };
}

function normalizeOptionalPresence(value: unknown): NewGamePresenceInput | undefined {
  if (value === undefined) {
    return undefined;
  }
  const input = assertRecord(value, "presence");
  return {
    presentActorIds: assertStringArray(input["presentActorIds"], "presence.presentActorIds"),
    allyActorIds: normalizeOptionalStringArray(input["allyActorIds"], "presence.allyActorIds"),
  };
}

function normalizeOptionalFateParams(value: unknown): FateParams | undefined {
  if (value === undefined) {
    return undefined;
  }
  const input = assertRecord(value, "protagonist.parameters");
  return {
    strength: assertFateRank(input["strength"], "protagonist.parameters.strength"),
    endurance: assertFateRank(input["endurance"], "protagonist.parameters.endurance"),
    agility: assertFateRank(input["agility"], "protagonist.parameters.agility"),
    mana: assertFateRank(input["mana"], "protagonist.parameters.mana"),
    luck: assertFateRank(input["luck"], "protagonist.parameters.luck"),
    noblePhantasm: assertFateRank(input["noblePhantasm"], "protagonist.parameters.noblePhantasm"),
  };
}
