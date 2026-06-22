/**
 * SPIKE (spike/in-process-subagents) — feasibility probe, NOT shipped.
 *
 * Validates the cross-extension service handshake that a synchronous one-shot
 * `advance_parallel_line` tool would rely on, using @gotgenes/pi-subagents'
 * in-process SubagentsService. No live model — a stub service simulates an
 * in-process foreground run completing so we can prove the control flow:
 *
 *   spawn(foreground) -> await waitForAll() -> getRecord(id).result
 *
 * Run explicitly:
 *   node --test spikes/in-process-subagents.spike.test.ts
 */

import {
  getSubagentsService,
  publishSubagentsService,
  SUBAGENT_EVENTS,
  unpublishSubagentsService,
  type SpawnOptions,
  type SubagentRecord,
  type SubagentsService,
} from "@gotgenes/pi-subagents";
import assert from "node:assert/strict";
import test from "node:test";

/**
 * Minimal in-process stub mirroring the real adapter contract:
 * spawn() returns an id immediately; the "agent" completes on the same event
 * loop; waitForAll() resolves once done; getRecord() then carries `.result`.
 */
function makeStubService(produce: (prompt: string) => string): SubagentsService {
  const records = new Map<string, SubagentRecord>();
  const pending = new Set<Promise<void>>();
  let seq = 0;

  return {
    spawn(type: string, prompt: string, _options?: SpawnOptions): string {
      const id = `stub-${++seq}`;
      records.set(id, {
        id,
        type,
        description: prompt.slice(0, 40),
        status: "running",
        toolUses: 0,
        startedAt: Date.now(),
        lifetimeUsage: { input: 0, output: 0, cacheWrite: 0 },
        compactionCount: 0,
      });
      // Simulate the in-process agent loop resolving asynchronously on the same runtime.
      const run = Promise.resolve().then(() => {
        const rec = records.get(id);
        if (rec) {
          rec.status = "completed";
          rec.result = produce(prompt);
          rec.completedAt = Date.now();
          rec.toolUses = 1;
        }
      });
      pending.add(run);
      void run.finally(() => pending.delete(run));
      return id;
    },
    getRecord: (id) => records.get(id),
    listAgents: () => [...records.values()],
    abort: () => false,
    steer: async () => false,
    waitForAll: async () => {
      await Promise.all(pending);
    },
    hasRunning: () => pending.size > 0,
    registerWorkspaceProvider: () => () => {},
  };
}

void test("service accessor publish/get/unpublish round-trips via globalThis Symbol", () => {
  assert.equal(getSubagentsService(), undefined);
  const svc = makeStubService(() => "{}");
  publishSubagentsService(svc);
  assert.equal(getSubagentsService(), svc);
  unpublishSubagentsService();
  assert.equal(getSubagentsService(), undefined);
});

void test("SUBAGENT_EVENTS exposes the lifecycle channels an orchestrator subscribes to", () => {
  assert.equal(SUBAGENT_EVENTS.COMPLETED, "subagents:completed");
  assert.equal(SUBAGENT_EVENTS.FAILED, "subagents:failed");
});

void test("one-shot control flow: spawn(foreground) -> waitForAll -> getRecord().result", async () => {
  // The exact shape an `advance_parallel_line` domain tool would run inside execute().
  const candidateJson = JSON.stringify({ candidates: [{ lineId: "lancer", summary: "侦察东门" }] });
  publishSubagentsService(makeStubService(() => candidateJson));
  try {
    const svc = getSubagentsService();
    assert.ok(svc, "service must be reachable from globalThis inside a tool");

    const id = svc.spawn("parallel-line", "推进 Lancer 后台线", {
      foreground: true,
      bypassQueue: true,
    });
    assert.equal(typeof id, "string"); // spawn returns id, NOT the result

    await svc.waitForAll(); // in-process: this drives the agent loop to completion

    const record = svc.getRecord(id);
    assert.equal(record?.status, "completed");
    const parsed = JSON.parse(record?.result ?? "{}");
    assert.equal(parsed.candidates[0].lineId, "lancer");
    // -> parent tool would now validate + land via the existing secret firewall.
  } finally {
    unpublishSubagentsService();
  }
});

void test("failure path: a non-completed record yields no result to land", async () => {
  publishSubagentsService({
    ...makeStubService(() => "{}"),
    spawn: () => "dead-1",
    getRecord: () => undefined, // simulate failed/aborted: no record/result
    waitForAll: async () => {},
  });
  try {
    const svc = getSubagentsService()!;
    const id = svc.spawn("parallel-line", "x", { foreground: true });
    await svc.waitForAll();
    const record = svc.getRecord(id);
    assert.equal(record, undefined); // -> tool must NOT settle the backstage obligation
  } finally {
    unpublishSubagentsService();
  }
});
