"use client";

import { useEffect, useState } from "react";

export function EnginePicker({ engine, onEngine, accessCode, onAccessCode }: {
  engine: "rehearsal" | "aws"; onEngine: (engine: "rehearsal" | "aws") => void;
  accessCode: string; onAccessCode: (code: string) => void;
}) {
  const [setup, setSetup] = useState("Checking server configuration…");
  useEffect(() => {
    if (engine !== "aws") return;
    const controller = new AbortController();
    fetch("/api/runtime", { signal: controller.signal, cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((result) => { if (!controller.signal.aborted) setSetup(result.liveEnabled && result.configured ? "Server configured. A live request will verify provider access." : "Server setup required. Follow the AWS setup guide before a qualifying demonstration."); })
      .catch(() => { if (!controller.signal.aborted) setSetup("Server configuration could not be checked."); });
    return () => controller.abort();
  }, [engine]);
  return <div className="engine-picker">
    <fieldset><legend>Analysis engine</legend>
      <button type="button" aria-pressed={engine === "rehearsal"} className={engine === "rehearsal" ? "selected" : ""} onClick={() => onEngine("rehearsal")}><strong>Offline rehearsal</strong><span>No credentials · deterministic checks</span></button>
      <button type="button" aria-pressed={engine === "aws"} className={engine === "aws" ? "selected" : ""} onClick={() => onEngine("aws")}><strong>Live AWS inference</strong><span>Decider 2B + Amazon Bedrock</span></button>
    </fieldset>
    {engine === "aws" && <div className="engine-setup"><p role="status">{setup}</p><label htmlFor="access-code">Demo access code</label><input id="access-code" type="password" autoComplete="off" value={accessCode} onChange={(event) => onAccessCode(event.target.value)} placeholder="The app access code, never AWS credentials" /><small>Held in this tab only. Live requests send the transcript to your configured inference services. Source data remains labeled as fixtures.</small></div>}
  </div>;
}
