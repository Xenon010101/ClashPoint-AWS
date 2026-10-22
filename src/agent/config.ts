import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

export function awsConfig() {
  return z.object({
    deciderUrl: z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol)),
    region: z.string().min(1), modelId: z.string().min(1),
    threshold: z.coerce.number().min(0).max(1),
    timeoutMs: z.coerce.number().int().min(1_000).max(120_000),
  }).parse({
    deciderUrl: process.env.STRANDS_DECIDER_URL,
    region: process.env.AWS_REGION,
    modelId: process.env.BEDROCK_MODEL_ID,
    // shortcut: an illustrative initial threshold, tune on development cases before judging.
    threshold: process.env.DECIDER_MIN_CONFIDENCE ?? 0.65,
    timeoutMs: process.env.INFERENCE_TIMEOUT_MS ?? 30_000,
  });
}

export function liveAccess(request: Request): "allowed" | "disabled" | "unauthorized" {
  if (process.env.CLASHPOINT_AWS_ENABLED !== "true") return "disabled";
  const expected = process.env.CLASHPOINT_ACCESS_CODE;
  const actual = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || expected.length < 16 || !actual) return "unauthorized";
  const left = Buffer.from(actual), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right) ? "allowed" : "unauthorized";
}
