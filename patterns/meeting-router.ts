import { z } from "zod";
import { IntentSchema, ToolNameSchema } from "../src/agent/schema.ts";
import questions from "./questions.json" with { type: "json" };

export const PROMPT_VERSION = "meeting-verification-router.v1";
export const ROUTING_QUESTIONS = questions;

const ProbabilitySchema = z.number().min(0).max(1);
function choiceAnswer<T extends z.ZodType>(choice: T) {
  return z.object({ type: z.literal("choice"), choice, confidence: ProbabilitySchema, probabilities: z.record(z.string(), ProbabilitySchema) });
}
export const DeciderResponseSchema = z.object({
  model: z.string().max(200).regex(/^strands-decider-2b(?:-|$)/i, "The hackathon requires a Strands Decider 2B checkpoint."),
  answers: z.object({ tool: choiceAnswer(ToolNameSchema), intent: choiceAnswer(IntentSchema) }),
  usage: z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() }),
});

export type RoutingInput = { recentTurns: Array<{ speakerLabel: string; textRaw: string }>; currentTurn: { speakerLabel: string; textRaw: string } };

/** Keep whole recent turns, newest first in priority; never truncate the current utterance. */
export function routingState(input: RoutingInput) {
  const recent: Array<{ speaker: string; text: string }> = [];
  let remaining = 4_500 - input.currentTurn.textRaw.length;
  for (const turn of input.recentTurns.slice(-8).reverse()) {
    if (turn.textRaw.length > remaining) break;
    recent.unshift({ speaker: turn.speakerLabel, text: turn.textRaw });
    remaining -= turn.textRaw.length + turn.speakerLabel.length + 40;
  }
  return JSON.stringify({ RECENT_TURNS: recent, CURRENT_TURN: { speaker: input.currentTurn.speakerLabel, text: input.currentTurn.textRaw } });
}

export function routingDecision(payload: unknown, threshold: number) {
  const result = DeciderResponseSchema.parse(payload);
  for (const [key, options] of Object.entries(ROUTING_QUESTIONS)) {
    const answer = result.answers[key as "tool" | "intent"];
    const entries = Object.entries(answer.probabilities);
    if (entries.length !== Object.keys(options.criteria).length || entries.some(([name]) => !(name in options.criteria))) throw new Error("Unexpected decision options");
    const total = entries.reduce((sum, [, probability]) => sum + probability, 0);
    if (Math.abs(total - 1) > 0.02 || answer.probabilities[answer.choice] < Math.max(...entries.map(([, p]) => p)) - 0.001) throw new Error("Invalid decision distribution");
    const derived = Math.max(0, (entries.length * Math.max(...entries.map(([, p]) => p)) - 1) / (entries.length - 1));
    if (Math.abs(derived - answer.confidence) > 0.02) throw new Error("Invalid decision confidence");
  }
  const confidence = Math.min(result.answers.tool.confidence, result.answers.intent.confidence);
  const intent = result.answers.intent.choice;
  const proposed = result.answers.tool.choice;
  const tool = confidence < threshold || intent === "ambiguous" ? "clarify" : intent === "social" || intent === "reversed" ? "ignore" : proposed;
  return { tool, intent, confidence, proposed, model: result.model, inputTokens: result.usage.input_tokens };
}
