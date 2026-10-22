import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeAwsTurn } from "./analyze";
import { routeMeetingTurn } from "./decider";
import { explainFinding, interpretEvent } from "./bedrock";
import type { AnalyzeTurnRequest } from "@/lib/schemas";

vi.mock("./decider", () => ({ routeMeetingTurn: vi.fn() }));
vi.mock("./bedrock", () => ({ explainFinding: vi.fn(), interpretEvent: vi.fn() }));
const input: AnalyzeTurnRequest = { meetingId: "m", principalId: "demo_product", factsVariant: "default", engine: "aws", recentTurns: [], currentTurn: { turnId: "t", meetingId: "m", speakerId: "maya", speakerLabel: "Maya", textRaw: "Promise Feature X to Acme Friday.", isFinal: true, startedAt: "2026-10-22T00:00:00.000Z", endedAt: "2026-10-22T00:00:01.000Z" } };
const routed = { tool: "approval" as const, intent: "confirmed" as const, confidence: 0.9, proposed: "approval" as const, model: "strands-decider-2B-test", inputTokens: 120, latencyMs: 150, threshold: 0.65 };
afterEach(() => vi.resetAllMocks());

describe("live agent orchestration", () => {
  it("runs the Decider-selected tool and generates from verified evidence", async () => {
    vi.mocked(routeMeetingTurn).mockResolvedValue(routed);
    vi.mocked(explainFinding).mockImplementation(async (card) => ({ card: { ...card, saferWording: "Target Friday, pending DPA approval." }, trace: { state: "complete", model: "nova-test", latencyMs: 200, inputTokens: 50, outputTokens: 20 } }));
    const result = await analyzeAwsTurn(input);
    expect(result.agent).toMatchObject({ state: "verified", tool: "approval", checkedFactIds: ["F-LEGAL-1"] });
    expect(result.card?.evidence[0].quote).toBe("Do not proceed with Feature X until the DPA update is approved.");
    expect(result.card?.saferWording).toBe("Target Friday, pending DPA approval.");
    expect(interpretEvent).not.toHaveBeenCalled();
  });
  it.each(["ignore", "clarify"] as const)("makes no generative call for %s", async (tool) => {
    vi.mocked(routeMeetingTurn).mockResolvedValue({ ...routed, tool });
    const result = await analyzeAwsTurn(input);
    expect(result.card).toBeNull(); expect(result.agent?.checkedFactIds).toEqual([]);
    expect(explainFinding).not.toHaveBeenCalled(); expect(interpretEvent).not.toHaveBeenCalled();
  });
  it("fails honestly when Decider is unavailable", async () => {
    vi.mocked(routeMeetingTurn).mockRejectedValue(new Error("secret provider failure"));
    const result = await analyzeAwsTurn(input);
    expect(result.agent?.state).toBe("unavailable"); expect(result.card).toBeNull();
    expect(JSON.stringify(result)).not.toContain("secret provider failure");
    expect(explainFinding).not.toHaveBeenCalled();
  });
  it("retains verified evidence but labels a failed generative explanation", async () => {
    vi.mocked(routeMeetingTurn).mockResolvedValue(routed);
    vi.mocked(explainFinding).mockRejectedValue(new Error("invalid fact ID"));
    const result = await analyzeAwsTurn(input);
    expect(result.card?.evidence[0].factId).toBe("F-LEGAL-1");
    expect(result.agent?.state).toBe("unavailable");
    expect(result.agent?.message).toContain("deterministic explanation");
  });
  it("does not let a different chosen tool run the approval check", async () => {
    vi.mocked(routeMeetingTurn).mockResolvedValue({ ...routed, tool: "capacity" });
    const result = await analyzeAwsTurn(input);
    expect(result.card).toBeNull(); expect(explainFinding).not.toHaveBeenCalled();
  });
  it("does not send inactive or restricted records to Bedrock", async () => {
    vi.mocked(routeMeetingTurn).mockResolvedValue(routed);
    const result = await analyzeAwsTurn({ ...input, factsVariant: "approval" });
    expect(result.card).toBeNull(); expect(explainFinding).not.toHaveBeenCalled();
  });
});
