import { NextResponse } from "next/server";
import { awsConfig } from "@/agent/config";

export async function GET() {
  let configured = false;
  try { awsConfig(); configured = true; } catch { /* Report readiness without leaking configuration or credentials. */ }
  return NextResponse.json({
    liveEnabled: process.env.CLASHPOINT_AWS_ENABLED === "true",
    configured: configured && (process.env.CLASHPOINT_ACCESS_CODE?.length ?? 0) >= 16,
    message: "Configuration status only. Provider connectivity, credentials and model access are verified by an actual live request.",
  }, { headers: { "Cache-Control": "no-store" } });
}
