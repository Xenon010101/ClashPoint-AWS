import { z } from "zod";

export const ToolNameSchema = z.enum(["ignore", "approval", "dependency", "capacity", "ownership", "prior_decision", "clarify"]);
export const IntentSchema = z.enum(["confirmed", "tentative", "reversed", "question", "social", "ambiguous"]);
const ProviderTraceSchema = z.object({
  state: z.enum(["complete", "skipped", "unavailable"]),
  model: z.string().nullable(),
  latencyMs: z.number().nonnegative(),
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
});

export const AgentTraceSchema = z.object({
  mode: z.enum(["aws", "rehearsal"]),
  state: z.enum(["ignored", "clarify", "verified", "insufficient", "unavailable", "rehearsal"]),
  message: z.string(),
  tool: ToolNameSchema.nullable(),
  intent: IntentSchema.nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  threshold: z.number().min(0).max(1),
  promptVersion: z.string(),
  decider: ProviderTraceSchema,
  bedrock: ProviderTraceSchema,
  checkedFactIds: z.array(z.string()),
});

export type ToolName = z.infer<typeof ToolNameSchema>;
export type MeetingIntent = z.infer<typeof IntentSchema>;
export type AgentTrace = z.infer<typeof AgentTraceSchema>;
export const skippedProvider = () => ({ state: "skipped" as const, model: null, latencyMs: 0, inputTokens: 0, outputTokens: 0 });
