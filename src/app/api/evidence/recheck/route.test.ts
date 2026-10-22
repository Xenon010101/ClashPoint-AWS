import { describe, expect, it } from "vitest";
import { POST } from "./route";

const request = (factId: string, factsVariant = "approval") => new Request("http://localhost/api/evidence/recheck", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ factsVariant, evidence: [{ cardId: "card", facts: [{ factId, revision: "old" }] }] }) });
describe("source revision recheck", () => {
  it("retires an obsolete warning only after an authorized successor is present", async () => {
    expect((await (await POST(request("F-LEGAL-1"))).json()).results[0].state).toBe("retired");
  });
  it.each(["missing", "F-PRIVATE-1", "F-DEP-1"])("does not silently retire %s", async (id) => {
    expect((await (await POST(request(id))).json()).results[0].state).toBe("review");
  });
});
