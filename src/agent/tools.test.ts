import { describe, expect, it } from "vitest";
import { getAuthorizedFacts } from "@/lib/facts";
import { resolveEvent } from "@/lib/analyze";
import { groundedEvent, toolFacts, verifyTool } from "./tools";
import type { ConversationEvent } from "@/lib/schemas";

const makeEvent = (text: string) => resolveEvent([], { turnId: "t", meetingId: "m", speakerId: "m", speakerLabel: "Maya", textRaw: text, isFinal: true, startedAt: "2026-10-22T00:00:00.000Z", endedAt: "2026-10-22T00:00:01.000Z" });
const facts = getAuthorizedFacts("demo_product", "default");

describe("read-only verification tools", () => {
  it("runs only the selected verification family", () => {
    expect(toolFacts("capacity", facts).map((fact) => fact.factId)).toEqual(["F-CAP-1"]);
    expect(toolFacts("ignore", facts)).toEqual([]);
  });
  it("grounds an approval conflict and never interrupts a conditional proposal", () => {
    const event = makeEvent("Promise Feature X to Acme Friday.");
    expect(verifyTool("approval", event, facts, false)).toMatchObject({ severity: "interrupt", factIds: ["F-LEGAL-1"] });
    expect(verifyTool("approval", event, facts, true)?.severity).toBe("side_panel");
  });
  it("does not mix similarly worded projects", () => {
    const event = { ...makeEvent("Promise Feature X to Acme Friday."), entities: [{ type: "feature", value: "Inventory Sync" }, { type: "customer", value: "Contoso" }] };
    expect(verifyTool("approval", event, facts, false)).toBeNull();
  });
  it("requires the actual subject, not a shared customer or person", () => {
    const promise = makeEvent("Promise Feature X to Acme Friday.");
    expect(verifyTool("approval", { ...promise, entities: [{ type: "feature", value: "Inventory Sync" }, { type: "customer", value: "Acme" }] }, facts, false)).toBeNull();
    expect(verifyTool("approval", { ...promise, entities: [{ type: "feature", value: "Feature X" }, { type: "customer", value: "Contoso" }] }, facts, false)).toBeNull();
    expect(verifyTool("dependency", { ...promise, entities: [{ type: "feature", value: "Inventory Sync" }, { type: "customer", value: "Acme" }] }, facts, false)).toBeNull();
    const owner = { ...promise, eventType: "assignment" as const, assignee: "Valya", entities: [{ type: "issue", value: "Inventory Sync" }, { type: "person", value: "Diego" }] };
    expect(verifyTool("ownership", owner, facts, false)).toBeNull();
    const status = { ...promise, eventType: "status_change" as const, canonicalStatement: "All Acme blockers are cleared.", entities: [{ type: "project", value: "Acme" }] };
    expect(verifyTool("dependency", status, facts, false)?.factIds).toEqual(["F-DEP-1"]);
  });
  it("rejects a generated owner that never appeared in the conversation", () => {
    const currentTurn = { turnId: "t", meetingId: "m", speakerId: "m", speakerLabel: "Maya", textRaw: "Promise Feature X to Acme Friday.", isFinal: true as const, startedAt: "2026-10-22T00:00:00.000Z", endedAt: "2026-10-22T00:00:01.000Z" };
    const input = { meetingId: "m", principalId: "demo_product" as const, factsVariant: "default" as const, recentTurns: [], currentTurn };
    expect(groundedEvent(makeEvent(currentTurn.textRaw), input)).toBe(true);
    expect(groundedEvent({ ...makeEvent(currentTurn.textRaw), assignee: "Invented Owner" }, input)).toBe(false);
  });
  it("compares numeric capacity for a differently named owner", () => {
    const event: ConversationEvent = { ...makeEvent("Give a new P0 to Valya."), assignee: "Rina", entities: [{ type: "person", value: "Rina" }] };
    const renamed = facts.filter((fact) => fact.factType === "capacity").map((fact) => ({ ...fact, entityKeys: ["person:rina"], structured: { assignee: "Rina", activeP0Count: 4, p0Limit: 3 } }));
    expect(verifyTool("capacity", event, renamed, false)?.collisionType).toBe("capacity_conflict");
    renamed[0].structured.activeP0Count = 2;
    expect(verifyTool("capacity", event, renamed, false)).toBeNull();
  });
  it("keeps a global person capacity policy when a project is also named", () => {
    const event = { ...makeEvent("Give a new P0 to Valya."), entities: [{ type: "person", value: "Valya" }, { type: "project", value: "Acme" }] };
    expect(verifyTool("capacity", event, facts, false)?.factIds).toEqual(["F-CAP-1"]);
  });
  it("does not use superseded approval holds or restricted evidence", () => {
    const current = getAuthorizedFacts("demo_product", "approval");
    expect(verifyTool("approval", makeEvent("Promise Feature X to Acme Friday."), current, false)).toBeNull();
    expect(toolFacts("approval", getAuthorizedFacts("demo_product", "restricted")).some((fact) => fact.factId === "F-PRIVATE-1")).toBe(false);
  });
});
