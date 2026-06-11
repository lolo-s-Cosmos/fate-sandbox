/**
 * /fuck — 快速回退到上一次用户输入（坏输入急救）
 *
 * 行为：
 * 1. GM 正在生成时先中断再回退
 * 2. navigateTree 回到倒数第 N 条用户输入之前，原输入文本自动回填输入框
 * 3. 从 session 文件中物理删除被废弃的分支（坏输入不值得保留）
 * 4. 游戏状态由主 extension 的 session_tree 钩子自动从回退点快照重新水合
 *
 * 用法：/fuck [N]，N 默认 1。
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { pruneAbandonedSubtree } from "./prune.ts";
import { extractUserMessageText, findRollbackTarget, parseRollbackSteps } from "./rollback.ts";

export default function rewindExtension(pi: ExtensionAPI): void {
  pi.registerCommand("fuck", {
    description: "回退到上一次用户输入并删除废弃分支（用法：/fuck [N]，N 默认 1）",
    handler: async (args, ctx) => {
      const steps = parseRollbackSteps(args);
      if (steps === undefined) {
        ctx.ui.notify("用法：/fuck [N] — N 为正整数，默认 1（回到倒数第 N 次输入）", "warning");
        return;
      }

      // 刚发出去就后悔是主场景：先打断生成，等部分输出落盘后一并删掉。
      if (!ctx.isIdle()) {
        ctx.abort();
        await ctx.waitForIdle();
      }

      const target = findRollbackTarget(ctx.sessionManager.getBranch(), steps);
      if (target === undefined) {
        ctx.ui.notify(`当前分支上找不到倒数第 ${steps} 条用户输入，无法回退`, "warning");
        return;
      }
      const newLeafId = target.parentId;

      if (target.id === ctx.sessionManager.getLeafId()) {
        // 边界：目标输入之后还没有任何回复（leaf 就是目标本身）。
        // navigateTree(target) 会因 target === leaf 而静默 no-op，
        // 改为导航到父节点并手动回填输入框。
        if (newLeafId === null) {
          ctx.ui.notify("会话只有这一条未回复的输入，没有可回退的位置", "warning");
          return;
        }
        const editorText = extractUserMessageText(target);
        const result = await ctx.navigateTree(newLeafId, { summarize: false });
        if (result.cancelled) {
          ctx.ui.notify("回退被取消", "warning");
          return;
        }
        ctx.ui.setEditorText(editorText);
      } else {
        // 常规路径：navigateTree 到用户消息 = leaf 移到其父节点 + 原文回填输入框。
        const result = await ctx.navigateTree(target.id, { summarize: false });
        if (result.cancelled) {
          ctx.ui.notify("回退被取消", "warning");
          return;
        }
      }

      // ctx.sessionManager 类型上是只读视图，运行时就是完整 SessionManager；
      // prune 内部用 type guard 验证可写能力后才动文件。
      const pruned = pruneAbandonedSubtree(ctx.sessionManager, target.id, newLeafId);

      ctx.ui.notify(
        pruned
          ? `已回退 ${steps} 步，废弃分支已删除；原输入在输入框里，改完直接重发`
          : `已回退 ${steps} 步（session 未持久化，跳过分支删除）；原输入在输入框里`,
        "info",
      );
    },
  });
}
