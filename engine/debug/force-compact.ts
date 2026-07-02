import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** 历史短于此长度时强制压缩无意义，跳过（避免开局空转）。 */
const MIN_BRANCH_FOR_COMPACT = 4;

function devLog(line: string): void {
  try {
    mkdirSync(join("runtime", "debug"), { recursive: true });
    appendFileSync(join("runtime", "debug", "_force-compact.log"), `${line}\n`);
  } catch {
    // ignore
  }
}

/**
 * Dev 开关（回流自 lonestar force-compact）：设置 FATE_DEV_FORCE_COMPACT（非空）时，
 * 在每个玩家回合开始强制触发一次压缩。用于在不堆满上下文窗口的情况下演练
 * compaction-policy 的确定性接管路径（→ 结算索引，见 settlement-compaction.ts）。
 * headless -p 每进程一个回合，所以做成「每回合一次」而非计数器，保证 -p 下可触发。
 */
export function maybeForceCompact(ctx: ExtensionContext): void {
  if (
    (process.env["FATE_DEV_FORCE_COMPACT"] ?? "") === "" ||
    process.env["NODE_TEST_CONTEXT"] !== undefined
  ) {
    return;
  }
  try {
    const branchLen = ctx.sessionManager.getBranch().length;
    const usage = ctx.getContextUsage();
    devLog(`[${new Date().toISOString()}] branch=${branchLen} usage=${JSON.stringify(usage)}`);
    if (branchLen < MIN_BRANCH_FOR_COMPACT) {
      devLog("  skip: branch too short");
      return;
    }
    ctx.compact({
      onComplete: (result) => devLog(`  onComplete firstKept=${result.firstKeptEntryId}`),
      onError: (error) => devLog(`  onError ${error.message}`),
    });
    devLog("  compact() called");
  } catch (error) {
    devLog(`  threw ${error instanceof Error ? error.message : String(error)}`);
  }
}
