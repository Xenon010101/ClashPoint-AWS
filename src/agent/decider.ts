import { ROUTING_QUESTIONS, routingDecision, routingState, type RoutingInput } from "../../patterns/meeting-router";
import { awsConfig } from "./config";

export async function routeMeetingTurn(input: RoutingInput, signal?: AbortSignal) {
  const config = awsConfig();
  const started = performance.now();
  const response = await fetch(`${config.deciderUrl.replace(/\/$/, "")}/v1/systemone`, {
    method: "POST", redirect: "error", cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: routingState(input), questions: ROUTING_QUESTIONS, model: "strands-decider-2b" }),
    signal: AbortSignal.any([AbortSignal.timeout(config.timeoutMs), ...(signal ? [signal] : [])]),
  });
  if (!response.ok) throw new Error("Decider inference unavailable");
  const result = routingDecision(await response.json(), config.threshold);
  return { ...result, latencyMs: Math.round(performance.now() - started), threshold: config.threshold };
}
