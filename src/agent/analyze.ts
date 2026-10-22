import { resolveEvent, verifyAndBuildCard } from "@/lib/analyze";
import { getAuthorizedFacts } from "@/lib/facts";
import type { AnalyzeTurnRequest, AnalyzeTurnResponse } from "@/lib/schemas";
import { PROMPT_VERSION } from "../../patterns/meeting-router";
import { routeMeetingTurn } from "./decider";
import { explainFinding, interpretEvent } from "./bedrock";
import { skippedProvider, type AgentTrace } from "./schema";
import { groundedEvent, toolFacts, verifyTool } from "./tools";
import { projectFacts } from "@/graphify/project";
import { findEvidencePath } from "@/graphify/query";
import { explainEvidencePath } from "@/graphify/explain";

export async function analyzeAwsTurn(input: AnalyzeTurnRequest, signal?: AbortSignal): Promise<AnalyzeTurnResponse> {
  const start = performance.now();
  let event = resolveEvent(input.recentTurns, input.currentTurn);
  const agent: AgentTrace = {
    mode: "aws", state: "unavailable", message: "Decider is unavailable. No verification was completed.",
    tool: null, intent: null, confidence: null, threshold: 0.65, promptVersion: PROMPT_VERSION,
    decider: { ...skippedProvider(), state: "unavailable" }, bedrock: skippedProvider(), checkedFactIds: [],
  };
  let collision: AnalyzeTurnResponse["collision"] = null;
  let card: AnalyzeTurnResponse["card"] = null;
  let lane: AnalyzeTurnResponse["gate"]["lane"] = "ignore";
  let resolverMs = 0, retrievalMs = 0, verificationMs = 0;
  const finish = (): AnalyzeTurnResponse => ({
    event, gate: { lane, reasons: [agent.message] }, collision, card, agent,
    checks: { deterministic: "complete", semantic: agent.state === "unavailable" ? "unavailable" : agent.bedrock.state },
    timingsMs: { resolver: resolverMs, retrieval: retrievalMs, collision: verificationMs, verification: 0, total: Math.round(performance.now() - start) },
  });
  try {
    const routed = await routeMeetingTurn(input, signal);
    resolverMs = routed.latencyMs;
    Object.assign(agent, { tool: routed.tool, intent: routed.intent, confidence: routed.confidence, threshold: routed.threshold,
      decider: { state: "complete", model: routed.model, latencyMs: routed.latencyMs, inputTokens: routed.inputTokens, outputTokens: 0 } });
    if (routed.tool === "clarify") {
      agent.state = "clarify"; agent.message = "Please name the work item and confirm whether this is a commitment or a conditional proposal. No verification tool was run.";
      return finish();
    }
    if (routed.tool === "ignore") {
      agent.state = "ignored"; agent.message = "Decider kept this turn quiet. No records were retrieved and no Bedrock call was made.";
      return finish();
    }
    lane = routed.intent === "confirmed" ? "immediate_check" : "quiet_check";
    const lookupStart = performance.now();
    // Authorization precedes tool retrieval and every call that could transmit facts to a model.
    const authorized = getAuthorizedFacts(input.principalId, input.factsVariant);
    const candidates = toolFacts(routed.tool, authorized);
    retrievalMs = Math.round(performance.now() - lookupStart);
    agent.checkedFactIds = candidates.map((fact) => fact.factId);
    if (!candidates.length) {
      agent.state = "insufficient"; agent.message = "No current authorized records are available for this check. This is not an all-clear.";
      return finish();
    }
    if (event.eventType === "none") {
      agent.message = "Bedrock interpretation is unavailable. No finding was generated.";
      agent.bedrock = { ...skippedProvider(), state: "unavailable" };
      const interpreted = await interpretEvent(input, candidates, signal);
      event = interpreted.event; agent.bedrock = interpreted.trace;
    }
    if (event.eventType === "none" || event.entities.length === 0 || !groundedEvent(event, input)) {
      agent.state = "clarify"; agent.message = "The target could not be grounded in the conversation. Name the project, feature or person before checking.";
      return finish();
    }
    const tentative = routed.intent !== "confirmed" || ["tentative", "proposal", "idea"].includes(event.certainty);
    if (tentative) lane = "quiet_check";
    const checkStart = performance.now();
    collision = verifyTool(routed.tool, event, candidates, tentative);
    const graph = projectFacts(authorized);
    const ids = event.entities.map((entity) => `${entity.type}:${entity.value.toLowerCase().replaceAll(" ", "-")}`);
    const path = collision ? explainEvidencePath(graph, findEvidencePath(graph, ids, collision.factIds)) : [];
    card = verifyAndBuildCard(collision, authorized, input.currentTurn.textRaw, path);
    verificationMs = Math.round(performance.now() - checkStart);
    if (!card) {
      collision = null; agent.state = "insufficient";
      agent.message = "The selected tool found no supported conflict in the connected records. Unconnected facts and unresolved references remain unchecked.";
      return finish();
    }
    agent.message = "Evidence was verified, but Bedrock could not generate a validated explanation. The card below uses the deterministic explanation.";
    const earlier = agent.bedrock;
    agent.bedrock = { ...earlier, state: "unavailable" };
    const explained = await explainFinding(card, event, signal);
    card = explained.card;
    agent.bedrock = { ...explained.trace, latencyMs: earlier.latencyMs + explained.trace.latencyMs, inputTokens: earlier.inputTokens + explained.trace.inputTokens, outputTokens: earlier.outputTokens + explained.trace.outputTokens };
    agent.state = "verified";
    agent.checkedFactIds = card.evidence.map((fact) => fact.factId);
    agent.message = tentative ? "A conditional proposal was checked. The finding remains advisory; no interruption or source mutation occurred." : "A conflict was verified against current authorized evidence. Bedrock proposed wording for human review.";
    return finish();
  } catch {
    agent.state = "unavailable";
    return finish();
  }
}
