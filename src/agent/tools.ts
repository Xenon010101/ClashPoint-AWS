import type { AnalyzeTurnRequest, CollisionRecord, ConversationEvent, Fact } from "@/lib/schemas";
import type { ToolName } from "./schema";

const toolTypes: Record<ToolName, Fact["factType"][]> = {
  approval: ["approval_blocker", "approval"], dependency: ["dependency"], capacity: ["capacity"],
  ownership: ["ownership"], prior_decision: ["previous_decision"], ignore: [], clarify: [],
};
const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function groundedEvent(event: ConversationEvent, input: AnalyzeTurnRequest) {
  const normalize = (text: string) => text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const dialogue = ` ${normalize([...input.recentTurns.map((turn) => turn.textRaw), input.currentTurn.textRaw].join(" "))} `;
  return [...event.entities.map((entity) => entity.value), event.assignee, event.deadline, event.priority]
    .filter((value): value is string => Boolean(value)).every((value) => dialogue.includes(` ${normalize(value)} `));
}

export function toolFacts(tool: ToolName, facts: Fact[]) {
  return facts.filter((fact) => fact.status === "active" && fact.supersededBy.length === 0 && toolTypes[tool].includes(fact.factType));
}

function matchesEntity(tool: ToolName, event: ConversationEvent, fact: Fact) {
  const matches = ({ type, value }: ConversationEvent["entities"][number]) => fact.entityKeys.includes(`${type}:${slug(value)}`) ||
    (["project", "customer"].includes(type) && ["project", "customer"].some((alias) => fact.entityKeys.includes(`${alias}:${slug(value)}`)));
  const scope = event.entities.filter(({ type }) => ["project", "customer"].includes(type));
  const scopedRecord = fact.entityKeys.some((key) => /^(project|customer):/.test(key));
  if (scopedRecord && scope.length && !scope.every(matches)) return false;
  const subjectTypes = tool === "capacity" ? ["person"] : tool === "ownership" ? ["issue"] : ["feature", "issue"];
  const subjects = event.entities.filter(({ type }) => subjectTypes.includes(type));
  if (subjects.length) return subjects.every(matches);
  // Aggregate blocker claims intentionally check the whole named project, not an unrelated feature.
  return tool === "dependency" && event.eventType === "status_change" && scope.length > 0;
}

/** Tools compare authoritative structured records; models never do capacity arithmetic or author quotations. */
export function verifyTool(tool: ToolName, event: ConversationEvent, facts: Fact[], tentative: boolean): CollisionRecord | null {
  if (event.eventType === "none" || event.eventType === "reversal" || event.polarity === "negative") return null;
  const scoped = toolFacts(tool, facts).filter((fact) => matchesEntity(tool, event, fact));
  let fact: Fact | undefined;
  let type: CollisionRecord["collisionType"];
  let reason: string;
  switch (tool) {
    case "approval":
      if (event.eventType !== "commitment") return null;
      fact = scoped.find((item) => item.factType === "approval_blocker" && item.structured.effect === "blocked");
      type = "legal_or_policy"; reason = "conditional_requirement_unmet"; break;
    case "dependency":
      if (event.eventType !== "deadline" && event.eventType !== "commitment" && !(event.eventType === "status_change" && /blockers?.*(cleared|closed|resolved)|ready|unblocked/i.test(event.canonicalStatement))) return null;
      fact = scoped.find((item) => item.structured.issueState === "open");
      type = event.eventType === "status_change" ? "status_mismatch" : "dependency_blocker"; reason = "active_blocker"; break;
    case "capacity":
      if (event.eventType !== "assignment" || event.priority?.toLowerCase() !== "p0" || !event.assignee) return null;
      fact = scoped.find((item) => {
        const { activeP0Count, p0Limit, assignee } = item.structured;
        return typeof activeP0Count === "number" && typeof p0Limit === "number" && Number.isFinite(activeP0Count) && Number.isFinite(p0Limit) &&
          typeof assignee === "string" && slug(assignee) === slug(event.assignee!) && activeP0Count >= p0Limit;
      });
      type = "capacity_conflict"; reason = "capacity_limit_reached"; break;
    case "ownership":
      if (!event.assignee || !event.entities.some((entity) => entity.type === "issue")) return null;
      fact = scoped.find((item) => typeof item.structured.assignee === "string" && slug(item.structured.assignee) !== slug(event.assignee!));
      type = "ownership_conflict"; reason = "known_owner_mismatch"; break;
    case "prior_decision":
      if (event.eventType !== "decision" && event.eventType !== "commitment") return null;
      fact = scoped.find((item) => typeof item.structured.rejectedOption === "string" && event.canonicalStatement.toLowerCase().includes(item.structured.rejectedOption.toLowerCase()));
      type = "previous_decision"; reason = "contradicts_recorded_decision"; break;
    default: return null;
  }
  if (!fact) return null;
  return {
    collisionId: `col_${event.eventId}`, meetingId: event.meetingId, eventId: event.eventId,
    collisionType: type, factIds: [fact.factId], reasonCode: reason, status: "active",
    severity: tentative || ["status_mismatch", "ownership_conflict"].includes(type) ? "side_panel" : "interrupt",
  };
}
