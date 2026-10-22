import { describe, expect, it } from "vitest";
import { ROUTING_QUESTIONS, routingDecision, routingState } from "./meeting-router";

function answer(options: Record<string, string>, choice: string, confidence: number) {
  const count = Object.keys(options).length;
  const top = (confidence * (count - 1) + 1) / count;
  return { type: "choice", choice, confidence, probabilities: Object.fromEntries(Object.keys(options).map((key) => [key, key === choice ? top : (1 - top) / (count - 1)])) };
}
export function routingPayload(tool = "approval", intent = "confirmed", confidence = 0.9) {
  return { model: "strands-decider-2B-test", answers: { tool: answer(ROUTING_QUESTIONS.tool.criteria, tool, confidence), intent: answer(ROUTING_QUESTIONS.intent.criteria, intent, confidence) }, usage: { input_tokens: 123, output_tokens: 0 } };
}

describe("the reusable routing policy", () => {
  it("turns a confident typed choice into an executable tool", () => {
    expect(routingDecision(routingPayload(), 0.65)).toMatchObject({ tool: "approval", intent: "confirmed", confidence: 0.9 });
  });
  it.each([0, 0.2, 0.64])("asks rather than guessing at confidence %s", (confidence) => {
    expect(routingDecision(routingPayload("approval", "confirmed", confidence), 0.65).tool).toBe("clarify");
  });
  it("does not treat a withdrawal as a new commitment", () => {
    expect(routingDecision(routingPayload("approval", "reversed"), 0.65).tool).toBe("ignore");
  });
  it("rejects impossible distributions and fabricated confidence", () => {
    const payload = routingPayload();
    payload.answers.tool.probabilities.approval = 0.01;
    expect(() => routingDecision(payload, 0.65)).toThrow();
    const other = routingPayload(); other.answers.intent.confidence = 0.1;
    expect(() => routingDecision(other, 0.65)).toThrow();
    const empty = routingPayload(); empty.answers.tool.probabilities = {};
    expect(() => routingDecision(empty, 0.65)).toThrow();
  });
  it("rejects an unsupported tool rather than executing it", () => {
    expect(() => routingDecision(routingPayload("delete_everything"), 0.65)).toThrow();
  });
  it("keeps the immediate pending question and the whole current turn within its budget", () => {
    const recentTurns = Array.from({ length: 8 }, (_, index) => ({ speakerLabel: "Maya", textRaw: `${index}:${"x".repeat(999)}` }));
    recentTurns[7].textRaw = "Are all the blockers cleared?";
    const state = JSON.parse(routingState({ recentTurns, currentTurn: { speakerLabel: "Diego", textRaw: "Yeah." } }));
    expect(state.RECENT_TURNS.at(-1).text).toBe("Are all the blockers cleared?");
    expect(state.CURRENT_TURN.text).toBe("Yeah.");
    expect(state.RECENT_TURNS.length).toBeLessThan(8);
  });
});
