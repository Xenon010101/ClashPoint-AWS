import { afterEach, describe, expect, it, vi } from "vitest";
import { ConverseCommand, BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { explainFinding } from "./bedrock";
import { analyzeTurn } from "@/lib/analyze";
import type { AnalyzeTurnRequest } from "@/lib/schemas";

const input: AnalyzeTurnRequest = { meetingId: "m", principalId: "demo_product", factsVariant: "default", recentTurns: [], currentTurn: { turnId: "t", meetingId: "m", speakerId: "maya", speakerLabel: "Maya", textRaw: "Promise Feature X to Acme Friday.", isFinal: true, startedAt: "2026-10-22T00:00:00.000Z", endedAt: "2026-10-22T00:00:01.000Z" } };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("Bedrock trust boundary", () => {
  it("uses Converse and rejects a generated evidence ID outside the verified finding", async () => {
    vi.stubEnv("AWS_REGION", "us-east-1"); vi.stubEnv("BEDROCK_MODEL_ID", "nova-test"); vi.stubEnv("STRANDS_DECIDER_URL", "http://127.0.0.1:8099");
    const send = vi.spyOn(BedrockRuntimeClient.prototype, "send").mockResolvedValue({ stopReason: "end_turn", output: { message: { content: [{ text: JSON.stringify({ factIds: ["invented"], whyItMatters: "Wrong evidence", saferWording: "Do not act" }) }] } }, usage: { inputTokens: 1, outputTokens: 1 } } as never);
    const result = await analyzeTurn(input);
    await expect(explainFinding(result.card!, result.event)).rejects.toThrow("unverified evidence");
    expect(send.mock.calls[0][0]).toBeInstanceOf(ConverseCommand);
    const command = send.mock.calls[0][0] as ConverseCommand;
    expect(command.input.messages?.[0].content?.[0].text).not.toContain("F-PRIVATE-1");
  });
});
