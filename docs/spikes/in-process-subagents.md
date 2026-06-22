# Spike: in-process subagents for a synchronous `advance_parallel_line`

**Branch:** `spike/in-process-subagents` · **Status:** feasibility validated, NOT merged
**Candidate substrate:** [`@gotgenes/pi-subagents@17.2.0`](https://pi.dev/packages/@gotgenes/pi-subagents) (in-process hard fork of tintinweb's)

## Question

Phase 3 (backstage obligation loop) shelved a one-shot `advance_parallel_line`
tool because a domain tool **cannot synchronously invoke a subagent** — the
standard subagent runs as a separate pi **process**, and a tool's
`ExtensionContext` has no agent-spawn surface. We closed the loop with a pure
ledger + hard block instead.

`@gotgenes/pi-subagents` runs subagents **in-process** (same pi runtime, no
subprocess) and publishes a typed service on `globalThis`. Does that make the
synchronous one-shot feasible, and is it worth adopting?

## Verdict

**Technically feasible — confirmed at the source level and with a runnable spike.**
**Not worth migrating now.** The Phase 3 ledger already closes correctness; the
one-shot is an ergonomics win that costs a substrate swap + a permission
companion + a firewall rewrite. Keep this as a documented future option.

## What was validated

### 1. The synchronous one-shot control flow is real (runnable)

`spikes/in-process-subagents.spike.test.ts` (run: `node --import jiti/register
--test spikes/in-process-subagents.spike.test.ts`) proves the exact shape an
`advance_parallel_line` tool would run, against a stub service:

```ts
const { getSubagentsService } = await import("@gotgenes/pi-subagents");
const svc = getSubagentsService();                       // reachable from globalThis inside a tool
const id = svc.spawn("parallel-line", prompt, { foreground: true, bypassQueue: true });
await svc.waitForAll();                                  // in-process: drives the agent loop to completion
const json = svc.getRecord(id)?.result;                 // completed record carries .result
// -> validate + land via the existing secret firewall (record_offscreen_event path)
```

Source confirmation (`src/service/service.ts`, `src/service/service-adapter.ts`,
`src/tools/foreground-runner.ts`):

- The public `SubagentsService.spawn()` returns an **id** (string), even with
  `foreground: true` — NOT the result. You retrieve output via
  `await waitForAll()` then `getRecord(id).result`.
- Internally a `spawnAndWait(): Promise<Subagent>` exists (used by the
  `subagent` tool's foreground runner) and returns the completed record, but it
  is **not** on the public service contract — external callers use the
  spawn→waitForAll→getRecord triad.
- `getSubagentsService()` reads `globalThis[Symbol.for("@gotgenes/pi-subagents:service")]`,
  so a **domain tool can grab it without it being threaded through
  `ExtensionContext`** — this is the crux that unblocks Phase 3.

Caveats baked into the spike:

- `waitForAll()` waits for **all** running/queued agents, not just yours.
- A failed/aborted run yields no record/result → the tool must **not** settle
  the backstage obligation (failure ≠ discharge — preserves Phase 3 semantics).
- The await blocks the parent tool for the whole sub-conversation (seconds to
  minutes).

### 2. Install + load compatibility

- Installs cleanly alongside our `0.79.9` pi deps (peer deps `>=0.75.0`; its
  `@sinclair/typebox ^0.34.49` does not conflict with our `typebox ^1.3.0`).
- **Runtime entry is raw TS**: `exports["."].default → ./src/service/service.ts`;
  `dist/` ships only `.d.ts`. Node's native type-stripping refuses TS under
  `node_modules`, so loading requires a TS-aware loader. pi loads extensions via
  `jiti` (already our devDep), so this is a non-issue inside pi but means plain
  `node --test` needs `--import jiti/register`.

## The firewall dealbreaker (and its mitigation)

Our `parallel-line` subagent is strictly hermetic — `tools: lookup` only, one
extension, `inheritSkills: false`, `systemPromptMode: replace`. It must NOT be
able to write canonical state or touch secret tools; it returns JSON candidates
that the parent validates + lands.

`createSubagentSession()` (`src/lifecycle/create-subagent-session.ts`):

- Creates the child with `tools: cfg.toolNames` where `toolNames =
  registry.getToolNamesForType(type)` — and the `tools:` frontmatter only covers
  **built-ins** (read/bash/edit/write/grep/find/ls).
- Then **`await session.bindExtensions({})`** — *"Children always load the
  parent's extensions and skills."* All parent extensions bind into the child.
- `applyRecursionGuard()` strips only `["subagent", "get_subagent_result",
  "steer_subagent"]` from the active set.

**Consequence:** a `parallel-line` child in @gotgenes **core** would have every
one of our domain tools active — `commit_turn`, `record_offscreen_event`,
`reveal_secret`, `patch_state`, … That demolishes the secret firewall. The core
removed the `extensions` / `skills` / `isolated` frontmatter keys, so isolation
is **not expressible in the core alone**.

**Mitigation:** add the companion [`@gotgenes/pi-permission-system`](https://github.com/gotgenes/pi-permission-system)
and express the firewall as per-agent `permission:` deny rules in frontmatter
(its `before_agent_start` handler removes denied tools from the child before it
starts). So the firewall is recoverable — but only with a second package and a
rewrite from "allowlist one extension tool" to "denylist all domain tools."

## State-sync reframing

The user's intuition — *in-process fundamentally solves state sync* — is true in
one mode: in-process means the child's tools resolve the **same `state-store`
singleton** as the parent, so a child could mutate live state directly. But that
**inverts our architecture**: our discipline is *child emits JSON → parent
validates + lands behind the secret firewall*. Letting the child write live
state trades the firewall for convenience. So the real, safe win here is the
**synchronous one-shot ergonomics**, not shared-state writes.

## Costs of migrating (why "not now")

1. **Different lineage.** This is a fork of tintinweb's, not our current unscoped
   `pi-subagents` (in `.pi/npm`). The `subagent` tool's args differ
   (`{subagent_type, prompt, description}` vs our `{agent, task, agentScope}`),
   so `extension.ts:73` interception + `extensions/subagents/timeline/task-injection.ts`
   need rewriting. We'd also lose the unscoped package's chain/parallel/intercom
   DSL.
2. **Coexistence collision.** Two extensions both registering a `subagent` tool —
   the existing one must be removed/replaced, not run side by side.
3. **Firewall rewrite.** +1 companion package (`pi-permission-system`), port the
   hermetic agent to `permission:` deny rules, re-validate no secret leakage.
4. **Child binds our `extension.ts`.** All domain tools + GM hooks initialize in
   the child context; needs auditing beyond the built-in recursion guard.
5. **Frontmatter rewrite** for both `.pi/agents/*.md` (`systemPromptMode →
   prompt_mode`, drop `extensions`/`inheritSkills`/`agentScope`).
6. **Correctness is already done.** The Phase 3 ledger + hard block ships and is
   tested (528 tests). The one-shot removes GM manual steps; it does not fix a
   bug.

## Recommended future migration path (if/when we want the one-shot)

1. Adopt `@gotgenes/pi-subagents` + `@gotgenes/pi-permission-system`; remove the
   current unscoped subagents extension.
2. Port `parallel-line` / `timeline-showrunner` to the new frontmatter, with
   `permission:` deny rules reconstructing the secret firewall (deny every
   state-mutating / secret domain tool; allow only `lookup`).
3. Rewrite the `subagent` interception in `extension.ts` for the new arg shape;
   port `task-injection.ts`.
4. Add `advance_parallel_line`: grabs `getSubagentsService()`, `spawn(foreground,
   bypassQueue)`, `await waitForAll()`, reads `getRecord(id).result`, then
   validates + lands through the **existing** `record_offscreen_event` firewall —
   strictly **outside** any `runDomainEventTool` draft (no concurrent mutation of
   the state singleton). On no-result/failure, leave the backstage obligation
   open (do not fake a discharge).
5. Re-run the full secret-leak + audit suite before trusting it.

## Artifacts on this branch

- `spikes/in-process-subagents.spike.test.ts` — runnable control-flow proof.
- `package.json` / lockfile — `@gotgenes/pi-subagents@17.2.0` added (spike only;
  revert before any merge that doesn't adopt the migration).
