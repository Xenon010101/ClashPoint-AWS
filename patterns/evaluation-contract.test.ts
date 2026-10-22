// @vitest-environment node
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("counts malformed Decider distributions as benchmark errors, never measured accuracy", () => {
  const script = new URL("../scripts/evaluate-router.mjs", import.meta.url).href;
  const run = spawnSync(process.execPath, ["--input-type=module", "--eval", `
    process.argv = ["node", "evaluate-router.mjs", "--split", "development"];
    process.env.STRANDS_DECIDER_URL = "http://127.0.0.1:1";
    globalThis.fetch = async () => ({ ok: true, json: async () => ({
      model: "strands-decider-2B-test",
      answers: {
        tool: { type: "choice", choice: "approval", confidence: 1, probabilities: {} },
        intent: { type: "choice", choice: "confirmed", confidence: 1, probabilities: {} }
      }, usage: { input_tokens: 1, output_tokens: 0 }
    }) });
    await import(${JSON.stringify(script)});
  `], { encoding: "utf8", timeout: 10_000 });
  expect(run.error).toBeUndefined();
  expect(run.status).toBe(1);
  const report = JSON.parse(run.stdout);
  expect(report.metrics).toMatchObject({ attempted: 20, completed: 0, exactAccuracyPercent: 0 });
  expect(report.developmentThresholdSweep.every((row: { automated: number }) => row.automated === 0)).toBe(true);
});
