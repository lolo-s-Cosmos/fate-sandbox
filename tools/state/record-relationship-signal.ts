import type { FsnToolDefinition } from "../runtime/tool-definition.ts";
import type { ToolResult } from "../runtime/tool-result.ts";

import { Type } from "typebox";
import { Compile } from "typebox/compile";

import { recordRelationshipSignal } from "../../engine/core/relationship-signal.ts";
import type { RelationshipSignal, State } from "../../engine/core/state.ts";
import { stringEnumSchema } from "../../engine/core/state-enum-schemas.ts";
import { RELATIONSHIP_SIGNAL_VISIBILITIES } from "../../engine/core/state-schema.ts";
import {
  assertNonEmptyString,
  parseTypeBoxValue,
} from "../../engine/core/typebox-validation.ts";

import { runDomainEventTool } from "./domain-tool-runner.ts";

interface RecordRelationshipSignalResult {
  signal: RelationshipSignal;
}

export function recordRelationshipSignalTool(params: unknown, sessionManager: unknown): ToolResult {
  return runDomainEventTool({
    sessionManager,
    execute: (draft) => executeRecordRelationshipSignal(draft, params),
    details: (result) => ({ result }),
    message: formatResult,
  });
}

function executeRecordRelationshipSignal(
  draft: State,
  params: unknown,
): RecordRelationshipSignalResult {
  const input = parseTypeBoxValue(params, "record_relationship_signal 参数", RECORD_VALIDATOR);
  const signal = recordRelationshipSignal(draft, {
    actorId: input.actorId,
    targetActorId: input.targetActorId,
    signal: input.signal,
    interpretation: input.interpretation,
    boundary: input.boundary,
    sourceEventId: normalizeSourceEventId(input.sourceEventId),
    visibility: input.visibility,
  });
  return { signal };
}

function normalizeSourceEventId(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return assertNonEmptyString(value, "sourceEventId");
}

function formatResult(result: RecordRelationshipSignalResult): string {
  const signal = result.signal;
  const layer = signal.visibility === "player-known" ? "玩家已知" : "隐藏";
  return `关系信号已记账（${layer}）：${signal.id}｜${signal.actorId} → ${signal.targetActorId}｜${signal.signal}`;
}

const VISIBILITY_SCHEMA = stringEnumSchema(RELATIONSHIP_SIGNAL_VISIBILITIES);

const RECORD_SCHEMA = Type.Object({
  actorId: Type.String({ minLength: 1 }),
  targetActorId: Type.String({ minLength: 1 }),
  signal: Type.String({ minLength: 1 }),
  interpretation: Type.String({ minLength: 1 }),
  boundary: Type.String({ minLength: 1 }),
  sourceEventId: Type.Optional(Type.Unknown()),
  visibility: VISIBILITY_SCHEMA,
});

const RECORD_VALIDATOR = Compile(RECORD_SCHEMA);

export const recordRelationshipSignalToolDefinition: FsnToolDefinition = {
  name: "record_relationship_signal",
  description:
    "记录关系信号账本：角色之间可回放的行为证据、当下解读与边界。它不是好感度数值，也不是把 NPC 内心独白直接公开；player-known 写 public ledger，secret 写 hidden ledger。\n\n" +
    "【必须调用的场景】\n" +
    "- 重要关系发生可持续变化：信任、警惕、亏欠、保护、疏远、试探、越界或边界重设\n" +
    "- 关系转折轮需要让渲染器落地行为证据：称呼、距离、停顿、回避、主动照料、让路、挡在前面、改变话题\n" +
    "- NPC 的公开表现与隐藏动机/误解分离：公开行为用 visibility=player-known，隐藏解读用 visibility=secret\n" +
    "- 后续 /relations 或 compaction 需要知道关系为何变成这样，而不是只剩一句关系摘要\n\n" +
    "【严禁的行为】\n" +
    "- 记录普通闲聊、一次性礼貌、没有后续意义的情绪形容\n" +
    "- 把未揭示真名、隐藏宝具、幕后动机写进 player-known 信号；需要隐藏就用 visibility=secret\n" +
    "- 用抽象判词代替行为证据：signal 必须是玩家或 GM 可指认的动作/措辞/停顿/选择\n" +
    "- 把 boundary 写成未来剧情指令；它只描述这条信号目前不能越过的关系边界",
  parameters: Type.Object({
    actorId: Type.String({ description: "发出信号的 actor id；必须已存在" }),
    targetActorId: Type.String({ description: "信号指向的 actor id；通常是 protagonist，也可以是 NPC" }),
    signal: Type.String({ description: "行为证据：动作、称呼、距离、停顿、回避、照料或选择" }),
    interpretation: Type.String({ description: "当前解读：为什么这条行为改变关系读法" }),
    boundary: Type.String({ description: "边界：这条信号不能被过度解读成什么" }),
    sourceEventId: Type.Optional(Type.Unknown({ description: "可选来源 event/fact/offscreen id；无来源填 null 或省略" })),
    visibility: Type.String({ description: "player-known / secret" }),
  }),
  execute: async (_toolCallId, params, _signal, _onUpdate, ctx) =>
    recordRelationshipSignalTool(params, ctx.sessionManager),
};
