import { afterEach, describe, expect, it, vi } from "vitest";
import { routeMeetingTurn } from "./decider";
import { ROUTING_QUESTIONS } from "../../patterns/meeting-router";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("official Decider HTTP adapter", () => {
  it("uses the documented endpoint and verifies a real-shaped distribution", async () => {
    vi.stubEnv("AWS_REGION", "us-east-1"); vi.stubEnv("BEDROCK_MODEL_ID", "nova-test"); vi.stubEnv("STRANDS_DECIDER_URL", "http://127.0.0.1:8099");
    const answer = (criteria: Record<string, string>, choice: string) => {
      const n = Object.keys(criteria).length, top = (0.9 * (n - 1) + 1) / n;
      return { type: "choice", choice, confidence: 0.9, probabilities: Object.fromEntries(Object.keys(criteria).map((name) => [name, name === choice ? top : (1 - top) / (n - 1)])) };
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ model: "strands-decider-2B-test", answers: { tool: answer(ROUTING_QUESTIONS.tool.criteria, "approval"), intent: answer(ROUTING_QUESTIONS.intent.criteria, "confirmed") }, usage: { input_tokens: 150, output_tokens: 0 } })));
    vi.stubGlobal("fetch", fetchMock);
    const result = await routeMeetingTurn({ recentTurns: [], currentTurn: { speakerLabel: "Maya", textRaw: "Promise Feature X to Acme Friday." } });
    expect(result.tool).toBe("approval");
    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8099/v1/systemone");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.questions).toEqual(ROUTING_QUESTIONS);
    expect(body.state).not.toContain("F-PRIVATE-1");
  });
});
