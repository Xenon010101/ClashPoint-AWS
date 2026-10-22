import { NextResponse } from "next/server";
import { analyzeTurn } from "@/lib/analyze";
import { AnalyzeTurnRequestSchema, AnalyzeTurnResponseSchema } from "@/lib/schemas";
import { analyzeAwsTurn } from "@/agent/analyze";
import { liveAccess } from "@/agent/config";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const parsed = AnalyzeTurnRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid turn payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (parsed.data.engine === "aws") {
      const access = liveAccess(request);
      if (access !== "allowed") return NextResponse.json({ error: access === "disabled" ? "Live AWS inference is disabled on this server." : "A valid demo access code is required for live inference." }, { status: access === "disabled" ? 503 : 401 });
    }
    const result = AnalyzeTurnResponseSchema.parse(parsed.data.engine === "aws" ? await analyzeAwsTurn(parsed.data, request.signal) : await analyzeTurn({ ...parsed.data, engine: "rehearsal" }));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Analysis unavailable", detail: "Deterministic checks could not complete." },
      { status: 500 },
    );
  }
}
