"use client";

import type { AgentTrace } from "@/agent/schema";

export function DecisionTrace({ trace, mode, checkedTurns }: { trace: AgentTrace | null; mode: "rehearsal" | "aws"; checkedTurns: number }) {
  if (mode === "rehearsal") return <aside className="decision-trace rehearsal" aria-label="Inference provenance"><strong>Offline rehearsal</strong><p>Deterministic rules and demo fixtures. Decider and Bedrock are not called. This is not a qualifying live-inference demonstration.</p></aside>;
  return (
    <aside className={`decision-trace ${trace?.state ?? "waiting"}`} aria-label="Inference provenance">
      <div className="trace-heading"><strong>{trace?.state === "verified" ? "Evidence checked" : trace?.state === "clarify" ? "Clarification needed" : trace?.state === "unavailable" ? "Check unavailable" : "Live AWS agent"}</strong><span>{checkedTurns} processed turns</span></div>
      <p role="status">{trace?.message ?? "Each final turn is routed by Strands Decider 2B. Amazon Bedrock interprets unfamiliar speech and explains supported findings."}</p>
      {trace && <details>
        <summary>Inspect the decision</summary>
        <dl className="trace-values">
          <div><dt>Selected tool</dt><dd>{trace.tool?.replaceAll("_", " ") ?? "None executed"}</dd></div>
          <div><dt>Intent</dt><dd>{trace.intent ?? "Unavailable"}</dd></div>
          <div><dt>Routing confidence</dt><dd>{trace.confidence === null ? "Unavailable" : `${(trace.confidence * 100).toFixed(1)}%`} / threshold {(trace.threshold * 100).toFixed(0)}%</dd></div>
          <div><dt>Decider</dt><dd>{trace.decider.state} · {trace.decider.latencyMs} ms · {trace.decider.inputTokens} input tokens</dd></div>
          <div><dt>Bedrock</dt><dd>{trace.bedrock.state} · {trace.bedrock.latencyMs} ms · {trace.bedrock.inputTokens} in / {trace.bedrock.outputTokens} out</dd></div>
          <div><dt>Models</dt><dd>{trace.decider.model ?? "No Decider result"}<br />{trace.bedrock.model ?? "No Bedrock result"}</dd></div>
          <div><dt>Checked evidence</dt><dd>{trace.checkedFactIds.join(", ") || "None"}</dd></div>
          <div><dt>Recipe</dt><dd>{trace.promptVersion}</dd></div>
        </dl>
        <small>Confidence is the lower of the two normalized choice-confidence values, not a guarantee of correctness. Zero tokens means no usage was reported, not free hosting.</small>
      </details>}
    </aside>
  );
}
