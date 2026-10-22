import assert from "node:assert/strict";

const base = process.env.CLASHPOINT_BASE_URL ?? "http://127.0.0.1:3000";
try {
  assert.ok(process.env.CLASHPOINT_ACCESS_CODE?.length >= 16, "Set CLASHPOINT_ACCESS_CODE locally; no live smoke test was run.");
  const setup = await fetch(`${base}/api/runtime`, { signal: AbortSignal.timeout(5_000) }).then((response) => response.json());
  assert.ok(setup.liveEnabled && setup.configured, "Live inference is not configured on the app server.");
  const now = new Date().toISOString();
  const response = await fetch(`${base}/api/analyze-turn`, {
    method: "POST", signal: AbortSignal.timeout(120_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CLASHPOINT_ACCESS_CODE}` },
    body: JSON.stringify({ engine: "aws", meetingId: "smoke", principalId: "demo_product", recentTurns: [], factsVariant: "default", currentTurn: { turnId: "smoke-1", meetingId: "smoke", speakerId: "maya", speakerLabel: "Maya", textRaw: "Let's promise Feature X to Acme by Friday.", isFinal: true, startedAt: now, endedAt: now } }),
  });
  assert.ok(response.ok, `Live app returned HTTP ${response.status}.`);
  const result = await response.json();
  assert.equal(result.agent?.mode, "aws");
  assert.equal(result.agent?.state, "verified", "A full verified live result was not produced; inspect provider setup, routing confidence and source grounding.");
  assert.equal(result.agent.decider.state, "complete");
  assert.equal(result.agent.bedrock.state, "complete");
  assert.ok(result.card?.evidence.some((item) => item.factId === "F-LEGAL-1"));
  console.log(JSON.stringify({ passed: true, sourceMode: "demo fixtures", inference: result.agent, timingsMs: result.timingsMs }, null, 2));
} catch (error) {
  console.error(error instanceof assert.AssertionError ? error.message : "Live smoke unavailable. Check the app URL, Decider server, AWS credentials and model access.");
  process.exitCode = 1;
}
