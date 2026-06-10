import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { FsnToolDefinition } from "./runtime/tool-definition";

import { exportStateToolDefinition } from "./debug/export-state";
import { getStateSchemaToolDefinition } from "./debug/get-state-schema";
import { migrateStateToolDefinition } from "./debug/migrate-state";
import { overrideLockedFactToolDefinition } from "./debug/override-locked-fact";
import { resetStateToolDefinition } from "./debug/reset-state";
import { lookupToolDefinition } from "./lookup/lookup";
import { commitTurnToolDefinition } from "./state/commit-turn";
import { configureCampaignToolDefinition } from "./state/configure-campaign";
import { getStatusToolDefinition } from "./state/get-status";
import { initializeNewGameToolDefinition } from "./state/initialize-new-game";
import { patchStateToolDefinition } from "./state/patch-state";
import { privateResolveToolDefinition } from "./state/private-resolve";
import { progressSceneBeatToolDefinition } from "./state/progress-scene-beat";
import { recordMemoryToolDefinition } from "./state/record-memory";
import { recordOffscreenEventToolDefinition } from "./state/record-offscreen-event";
import { resolveCombatExchangeToolDefinition } from "./state/resolve-combat-exchange";
import { retireActorToolDefinition } from "./state/retire-actor";
import { revealSecretToolDefinition } from "./state/reveal-secret";
import { setScenePresenceToolDefinition } from "./state/set-scene-presence";
import { updateActorConditionToolDefinition } from "./state/update-actor-condition";
import { updateEconomyToolDefinition } from "./state/update-economy";
import { updateServantFormToolDefinition } from "./state/update-servant-form";
import { upsertActorToolDefinition } from "./state/upsert-actor";

/** 全部 Domain Event Tool 契约清单；契约本体与实现同文件维护。 */
const TOOL_DEFINITIONS: readonly FsnToolDefinition[] = [
  initializeNewGameToolDefinition,
  configureCampaignToolDefinition,
  commitTurnToolDefinition,
  progressSceneBeatToolDefinition,
  getStatusToolDefinition,
  recordMemoryToolDefinition,
  recordOffscreenEventToolDefinition,
  retireActorToolDefinition,
  updateActorConditionToolDefinition,
  setScenePresenceToolDefinition,
  upsertActorToolDefinition,
  updateEconomyToolDefinition,
  updateServantFormToolDefinition,
  revealSecretToolDefinition,
  resolveCombatExchangeToolDefinition,
  privateResolveToolDefinition,
  lookupToolDefinition,
  patchStateToolDefinition,
  overrideLockedFactToolDefinition,
  migrateStateToolDefinition,
  resetStateToolDefinition,
  getStateSchemaToolDefinition,
  exportStateToolDefinition,
];

export function registerAllTools(pi: ExtensionAPI): void {
  for (const definition of TOOL_DEFINITIONS) {
    pi.registerTool({ label: "FSN 沙盒", ...definition });
  }
}
