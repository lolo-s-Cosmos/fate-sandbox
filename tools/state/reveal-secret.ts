import type { FsnToolDefinition } from "../runtime/tool-definition.ts";
import { Type } from "typebox";
import type {
  ConfigureActorSecretsResult,
  ConfigureServantSecretsResult,
  RevealSecretResult,
  RevealSecretToolInput,
} from "../../engine/core/secrets.ts";
import type { ToolResult } from "../runtime/tool-result.ts";

import {
  configureActorSecrets,
  configureServantSecrets,
  revealSecret,
} from "../../engine/core/secrets.ts";
import type { State } from "../../engine/core/state.ts";
import { parseRevealSecretToolInput } from "../../engine/core/secrets-schema.ts";

import { runDomainEventTool } from "./domain-tool-runner.ts";

type RevealSecretToolResult =
  | { kind: "configure"; result: ConfigureActorSecretsResult | ConfigureServantSecretsResult }
  | { kind: "reveal"; result: RevealSecretResult };

export function revealSecretTool(params: unknown, sessionManager: unknown): ToolResult {
  return runDomainEventTool({
    sessionManager,
    execute: (draft) => executeSecretTool(draft, parseRevealSecretToolInput(params, "reveal_secret 参数")),
    details: secretDetails,
    message: secretMessage,
  });
}

function executeSecretTool(draft: State, input: RevealSecretToolInput): RevealSecretToolResult {
  if (input.kind === "configure-servant-secrets") {
    return { kind: "configure", result: configureServantSecrets(draft, input) };
  }
  if (input.kind === "configure-actor-secrets") {
    return { kind: "configure", result: configureActorSecrets(draft, input) };
  }
  return { kind: "reveal", result: revealSecret(draft, input) };
}

function secretDetails(output: RevealSecretToolResult): Record<string, unknown> {
  if (output.kind === "configure") {
    return { result: output.result };
  }
  return { outcome: output.result.outcome };
}

function secretMessage(output: RevealSecretToolResult): string {
  if (output.kind === "configure") {
    return output.result.message;
  }
  return output.result.playerSafeMessage;
}

export const revealSecretToolDefinition: FsnToolDefinition = {
  name: "reveal_secret",
  description:
    "配置或揭示 actor hidden-canonical secret。配置模式只写入 secrets；揭示模式必须验证玩家可见证据后才更新 public。\n\n" +
    "【必须调用的场景】\n" +
    "- 从者首次入场且使用 upsert_actor(kind=upsert-servant) 后：调用 kind=configure-servant-secrets 写入真名/隐藏宝具 secret slot\n" +
    "- 重要非从者 NPC 首次入场且后续 private_resolve 需要隐藏反应时：调用 kind=configure-actor-secrets 写入 privateMotives/unrevealedAffiliations\n" +
    "- 玩家提出真名/宝具/隐藏身份 claim，或场内触发了公开揭示条件：调用 claim-reveal / observed-reveal\n" +
    "- GM 准备把 foreshadowed 线索升级为已揭示事实\n\n" +
    "【配置模式】\n" +
    "- configure-servant-secrets / configure-actor-secrets 是写入幕后 secret slot，不会公开揭示\n" +
    "- revealConditions 必须是之后 claim/trigger/evidence 能字面命中的短线索词，不要写整句判定条件\n" +
    "- 好例子：直死之魔眼、死亡线、自报姓名、両儀式、短剑、契约解除\n" +
    "- 坏例子：The Saber-class protagonist gives her name in-scene. / 玩家证据足够时 / 剧情合适时\n\n" +
    "【揭示模式】\n" +
    "- claim-reveal / observed-reveal 必须同时满足：claim/trigger 命中 secret 值或 revealConditions，且 evidence 命中 revealConditions\n" +
    "- GM 自己知道 secret、或刚配置 secret，不构成 reveal 证据\n\n" +
    "【严禁的行为】\n" +
    "- 对同一从者反复配置相同 secret；首次入场配置一次，后续只追加新隐藏宝具\n" +
    "- 要求列出 secret slots 或幕后真相\n" +
    "- 证据不足时泄露正确答案",
  parameters: Type.Object({
    kind: Type.String({
      description:
        "允许: claim-reveal / observed-reveal / configure-servant-secrets / configure-actor-secrets",
    }),
    actorId: Type.String(),
    claim: Type.Optional(Type.String()),
    trigger: Type.Optional(Type.String()),
    evidence: Type.Optional(Type.String()),
    trueName: Type.Optional(
      Type.Object({
        value: Type.String({ description: "隐藏真名，如 美狄亚" }),
        revealConditions: Type.Array(
          Type.String({
            description:
              "可被 claim/trigger/evidence 字面命中的短线索词；不要写整句判定条件。例：直死之魔眼 / 死亡线 / 自报姓名 / 両儀式",
          }),
        ),
      }),
    ),
    hiddenNoblePhantasms: Type.Optional(
      Type.Array(
        Type.Object({
          value: Type.Object({
            name: Type.String(),
            rank: Type.String({ description: "Fate rank；非真正宝具/无宝具可填 none" }),
            kind: Type.String({ description: "宝具类型，如 对魔术宝具" }),
            status: Type.String({
              description: "隐藏宝具状态，允许: hidden / suspected / revealed",
            }),
            summary: Type.String(),
          }),
          revealConditions: Type.Array(
            Type.String({
              description:
                "可被 claim/trigger/evidence 字面命中的短线索词；不要写整句判定条件。例：短剑 / 契约解除 / Rule Breaker",
            }),
          ),
        }),
      ),
    ),
    privateMotives: Type.Optional(
      Type.Array(
        Type.Object({
          value: Type.String({ description: "NPC 隐藏动机；不会直接公开给玩家" }),
          revealConditions: Type.Array(
            Type.String({
              description:
                "可被 claim/trigger/evidence 字面命中的短线索词；不要写整句判定条件。例：慎二 / 间桐 / 旧识",
            }),
          ),
        }),
      ),
    ),
    unrevealedAffiliations: Type.Optional(
      Type.Array(
        Type.Object({
          value: Type.String({ description: "NPC 未公开隶属/身份；不会直接公开给玩家" }),
          revealConditions: Type.Array(
            Type.String({
              description:
                "可被 claim/trigger/evidence 字面命中的短线索词；不要写整句判定条件。例：圣堂教会 / 监督者 / 令咒",
            }),
          ),
        }),
      ),
    ),
    reason: Type.Optional(Type.String()),
  }),
  execute: async (_toolCallId, params, _signal, _onUpdate, ctx) =>
    revealSecretTool(params, ctx.sessionManager),
};
