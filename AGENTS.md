# AGENTS.md

面向在本项目工作的开发者与编码 agent。游玩说明见 `README.md`。

---

## 宪章

本项目是跑在**自己机器上**的东西——没有用户兼容性包袱、没有遗留接口、没有「先这样后面再改」。每一次妥协都会留到下一次、再下一次，最终变成屎山。唯一能拦住这个螺旋的是：**从一开始就不妥协。**

本文件是工程纪律的单一权威源。违反宪章的代码不叫「能跑就行」，叫「不合格」。

---

## 工具链基线

| 工具       | 配置                                                                                              | 不可绕过                           |
| ---------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- |
| TypeScript | `tsconfig.json` — `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters` | `pnpm typecheck` 零错误才能 commit |
| oxlint     | `.oxlintrc.json` — `correctness` + `suspicious` + `typeAware` + 逐条显式                          | `pnpm lint` 零错误                 |
| oxfmt      | `.oxfmtrc.json` — import 分组排序                                                                 | `pnpm format:check` 零差异         |
| pnpm       | `pnpm@11.3.0`, `node>=24`, `packageManager` 钉死                                                  | 不用 npm/yarn                      |

任何绕过（`// @ts-ignore`、`// oxlint-disable-next-line`、`/* prettier-ignore */`）必须附带一行注释说明**为什么这里非绕过不可**。无注释的绕过视为蓄意违规。

---

## 类型系统戒律

### 零 `any`

`any` 是瘟疫。项目里不应出现。如果 pi SDK 的类型定义确实返回 `any`，在消费点立即窄化——写到类型守卫、写到 assert 函数里，不要扩散到业务代码。

```ts
// ❌ 不合格：把 any 传染出去
const data: any = pi.session.get("state");
return data.money;

// ✅ 正确：在边界窄化
const raw = pi.session.get("state");
const state = assertStateSchema(raw);
return state.money;
```

### `as` 断言必须有理由

类型断言不是「我知道这是什么」的声明，是「编译器不知道，我来告诉它」的覆盖。每次 `as` 都是一次信任链断裂。

```ts
// ❌ 不合格：静默绕过
const el = document.getElementById("root") as HTMLDivElement;

// ✅ 合格：断言后立即验证，或注释说明为什么安全
const el = document.getElementById("root");
if (!el || !(el instanceof HTMLDivElement)) throw new Error("root not found");
// 或
const state = raw as State; // safe: validated by assertStateSchema above
```

### 导出函数必须标注返回类型

公共 API 的返回类型是契约的一部分。让编译器推导是让契约变成「碰巧产生的副作用」。

```ts
// ❌ 不合格
export function getStatus() {
  return status();
}

// ✅ 合格
export function getStatus(): StatusSnapshot {
  return status();
}
```

### 歧视联合 > optional 字段 > `| undefined`

一个状态对象有 N 种形态 → 用 tagged union，不要靠 optional 字段的存在性区分。

```ts
// ❌ 不合格
type SceneResult = {
  settlement?: Settlement; // 只有 success 才有
  events?: Event[];
  error?: string; // 只有 failure 才有
};

// ✅ 合格
type SceneResult =
  | { kind: "success"; settlement: Settlement; events: Event[] }
  | { kind: "failure"; error: string };
```

---

## 文件与命名

### 文件按职责分目录，不按类型平铺

```
engine/           # 运行时引擎（被 extension.ts import）
  core/           # 基础组件（state、time、schema）
    state.ts
    time.ts
  codeact.ts      # CodeAct 沙箱
  codeact-sandbox.d.ts
  scene.ts        # 场景引擎（视题材）
data/             # 结构化数据（JSON/TS）
tools/            # 工具定义与注册
  registry.ts
agents/           # GM prompt 分层文件
extensions/       # pi extension 动态注入（含 subagent）
  subagents/
```

### 文件名：kebab-case

```
core/state.ts     ✅
core/State.ts     ❌
core/stateStore.ts ❌（应拆成 state-store.ts）
```

### 变量/函数：camelCase。类型/接口：PascalCase。常量：UPPER_SNAKE_CASE

```ts
const INITIAL_STATE: GameState = { ... };
function adjustMoney(delta: number): void { ... }
type SceneParams = { ... };
```

### 带 `_` 前缀表示有意未使用

```ts
function handleTurn(state: State, _turnIndex: number): void {
  // _turnIndex 保留给未来使用，当前不需要
}
```

`noUnusedParameters` 已开启，不用 `_` 前缀的未用参数会直接编译失败。

---

## 导入纪律

### 零副作用导入

`import "./side-effects"` 不存在于本项目中。pi 用 jiti/tsx 加载，模块初始化顺序不可靠。

### type import 必须显式

`verbatimModuleSyntax` 已开启。运行时用不到的东西必须标注 `type`：

```ts
import type { State, StatusSnapshot } from "./types";
import { patchState } from "./state";
```

### 导入分组顺序

oxfmt 已配置自动排序：`type-import` → `type-internal` → `type-parent/sibling/index` → `value-builtin/external` → `value-internal` → `value-parent/sibling/index`。不要手动排——跑 `pnpm format`。

---

## 错误处理

### 不吞错误

每个 `catch` 必须做点什么——throw、log、warp。空 `catch {}` 不存在。

```ts
// ❌ 不合格
try {
  doRisky();
} catch {}

// ✅ 合格：至少 log
try {
  doRisky();
} catch (e) {
  console.error("doRisky failed:", e);
  throw e;
}
```

### 抛有意义的错误

```ts
// ❌ 不合格
throw new Error("failed");

// ✅ 合格
throw new Error(`lookup("location", "${query}"): no match found`);
```

### 不要用异常做控制流

异常是异常。不要「try 一个操作，失败表示另一种状态」——用 discriminated union 表达两种可能性。

---

## 函数设计

### 单一职责，小函数

一个函数做一件事。函数体超过 30 行 → 开始怀疑它在做不止一件事。

### 纯函数优先

能不依赖外部状态的函数，就不依赖。纯函数可测试、可缓存、可复用。

```ts
// ❌ 不纯：依赖 global state store
function getBalance(): number {
  return globalThis.__idol_master_state_store__.money;
}

// ✅ 纯：传入 state
function getBalance(state: State): number {
  return state.money;
}
```

### 不写「可能以后有用」的抽象

YAGNI。只写当前需要的代码。多余的泛型参数、未调用的工厂函数、预留的扩展点——都是死后腐烂的尸体。

---

## 死代码零容忍

`noUnusedLocals` + `noUnusedParameters` 保证函数级干净。但还要注意：

- 未调用的导出函数 → 删
- 注释掉的代码 → 删（git 里有历史）
- 「先留着万一要用」的 `data/*.json` 字段 → 删
- 写了但没在 `tools/registry.ts` 注册的工具 → 删或注册

---

## 注释

### 注释解释「为什么」，不解释「是什么」

代码说「是什么」。如果代码说清楚了自己是什么，就不要注释。如果代码说不清楚——**先改代码**，后补注释。

```ts
// ❌ 不合格：复述代码
// increment money by delta
money += delta;

// ❌ 不合格：该改代码
// if status is 3 it means banned
if (user.status === 3) { ... }

// ✅ 合格：解释不可见的约束
// 必须用 adjustMoney 而非直接 patch——money 是 protected path，
// 裸 patch 会被 schema guard 拒绝
adjustMoney(delta);
```

### 不写 JSDoc 废话

```ts
// ❌ 不合格：复述签名
/** Get the current status */
export function getStatus(): StatusSnapshot { ... }
```

如果 JSDoc 只说了一遍类型签名已经写明的东西——删了它。

---

## 测试

### 确定性代码必测

state migration、schema validation、lookup 索引、场景结算公式——这些确定性逻辑必须有测试。测试跑在 `pnpm test` 里，CI 不可跳过。

### 不测 LLM 行为

GM 的叙事质量、工具调用的时机——这些不写测试。不是不想，是测不了。把测试资源集中在引擎逻辑上。

### 测试文件跟源文件同目录，或放 `tests/`

```
engine/core/state.test.ts   ✅
tests/state.test.ts         ✅
__tests__/state.ts          ❌（不用 jest 目录惯例）
```

---

## 提交

### 一个 commit 做一件事

不要「修了 A bug + 重构了 B + 加了 C 字段」。拆开。

### commit message 用英文 imperative

```
feat: add state rollback on session fork
fix: reject bare patch on protected money path
refactor: extract lookup index builder to shared utility
```

不要写「更新」「修」「改」这类无信息量的词。

### 提交前必须通过三项检查

```bash
pnpm typecheck && pnpm lint && pnpm format:check
```

一条不过 = 不能 commit。不允许 `--no-verify`。

---

## 反模式黑名单

以下模式在本项目中不存在，代码审查时看到即打回：

| 反模式                       | 为什么禁止                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------- | -------------- | --- | ----------------------------- |
| `Record<string, any>`        | any 瘟疫的载体。定义具体类型                                                        |
| `as unknown as T`            | 双重断言等于放弃类型系统。写 type guard                                             |
| `setTimeout` 做异步控制      | pi 的事件循环不受你控制。用 hook/工具返回值驱动                                     |
| mutation of function params  | 纯函数不收副作用。clone 后改                                                        |
| `!!` 做布尔转换              | 写 `Boolean(x)`——意图明确                                                           |
| `x                           |                                                                                     | defaultValue` | 用 `??` 而非 ` |     | `，除非你真的想捕获 `""`和`0` |
| 导出 mutable 对象            | `export const X = {}` 是全局可变状态。用函数包装                                    |
| magic number / magic string  | 3.14 → `const TAX_RATE = 0.0314`。`"battle"` → `const SceneKind = { ... } as const` |
| 深层嵌套三元                 | `a ? b ? c : d : e` → 用 if-else 或 lookup table                                    |
| `import * as X` 命名空间导入 | 除非是 `import * as fs from "node:fs"` 这种标准库，否则具名导入                     |

---

## 修改提示词 / 数据 / 引擎时的规则

- **改 GM prompt** → 保持三层分工：`gm-system.md`（身份+契约）→ `gm-context.md`（工具速查+世界观）→ `gm-rules.md`（硬规则+few-shot）。不要把硬规则塞进 system 层
- **新增工具** → 在 `tools/registry.ts` 注册；description 必须含「必须调用场景」+「严禁行为」
- **改 state 结构** → 同步 `INITIAL_STATE` + schema + protected paths 白名单。只允许经 migration 后访问新字段，不做运行时 fallback
- **查 state 的代码** → 必须处理 `noUncheckedIndexedAccess` 带来的 `| undefined`——每个索引访问都有判空路径
- **任何改动** → `pnpm typecheck && pnpm lint && pnpm format:check` 全过

---

## 与 tavern2agent skill 的关系

tavern2agent 是迁移工具——它产出的代码只需要「能代表卡片逻辑」。但本项目的工程标准**远高于** tavern2agent 的基线要求。skill 迁移完之后的代码，必须在本项目的 lint/typecheck/format 三件套下归零，该重构就重构。不通过的不算「迁移完成」。
