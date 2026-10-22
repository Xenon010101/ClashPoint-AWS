import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthorizedFacts } from "@/lib/facts";

const RequestSchema = z.object({
  factsVariant: z.enum(["default", "approval", "restricted"]),
  evidence: z.array(z.object({ cardId: z.string().min(1), facts: z.array(z.object({ factId: z.string(), revision: z.string() })).min(1).max(3) })).max(30),
});

/** Rechecks a selected fixture revision. Missing evidence never proves that a warning is resolved. */
export async function POST(request: Request) {
  try {
    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid evidence request" }, { status: 400 });
    const facts = getAuthorizedFacts("demo_product", parsed.data.factsVariant);
    const results = parsed.data.evidence.map((item) => {
      const current = item.facts.map((old) => facts.find((fact) => fact.factId === old.factId));
      const retired = current.every((fact) => fact && ["resolved", "superseded"].includes(fact.status) &&
        (fact.status === "resolved" || fact.supersededBy.some((id) => facts.some((next) => next.factId === id && next.status === "active"))));
      const unchanged = current.every((fact, index) => fact && fact.status === "active" && fact.sourceRevision === item.facts[index].revision);
      return { cardId: item.cardId, state: retired ? "retired" : unchanged ? "unchanged" : "review", message: retired ? "An authorized successor record supersedes the supporting evidence." : unchanged ? "Evidence is unchanged." : "Evidence changed or is unavailable; human review is required." };
    });
    return NextResponse.json({ sourceMode: "fixture", results }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Evidence recheck unavailable" }, { status: 400 }); }
}
