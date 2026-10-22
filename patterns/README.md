# Reusable pattern: meeting verification routing

Pattern: **tool selection**. Decider 2B selects a read-only tool from a final utterance and recent context. A second typed question distinguishes confirmation, tentative language, reversal, questions, social speech and ambiguity. Both share one state in one `/v1/systemone` request.

```ts
import { ROUTING_QUESTIONS, routingState, routingDecision } from "./meeting-router";

const response = await fetch(`${privateDeciderUrl}/v1/systemone`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ state: routingState(input), questions: ROUTING_QUESTIONS }),
});
if (!response.ok) throw new Error("Decision unavailable");
const route = routingDecision(await response.json(), minimumConfidence);
if (route.tool === "ignore") return;
if (route.tool === "clarify") return askForClarification();
const evidence = await readOnlyTools[route.tool](authorizedContext);
return generateWithBedrock(evidence); // Validate source-owned evidence IDs before display.
```

Actual wiring: `src/agent/analyze.ts` branches before retrieval, executes the selected tool family and calls Bedrock after verification. It uses fetch and the AWS SDK; no Strands Agents SDK integration is claimed. A framework-based agent can run the same gate before tool dispatch.

The reusable unit is `meeting-router.ts`, `questions.json` and the small `src/agent/schema.ts` dependency, using Zod. The JSON questions work from any language.

## Policy

- Serve a real Strands Decider **2B** checkpoint. Its returned model name is validated; do not rename another checkpoint to bypass this check.
- The adapter validates options, probabilities, argmax and the official normalized-confidence formula. Confidence is not a safety guarantee.
- The lower of tool/intent confidence controls abstention. Ambiguity requests clarification; social/reversed intent cannot dispatch a check.
- `0.65` is illustrative. Select the threshold on development cases, freeze it, then evaluate validation cases.
- Authorization, numeric capacity and evidence status remain code checks. Apply ACL filtering before ranking or transmitting facts.
- Models cannot author quotations. Revalidate IDs against current authorized source records.
- An outage, unknown reference or missing source never becomes an all-clear. No source mutation or external commitment is included.

## Limits

One route per utterance; unrelated simultaneous actions request clarification. Entity grounding accepts only labels/owners/dates present in recent dialogue; unsupported aliases may abstain. Context keeps whole recent turns in a character budget, never slices the current utterance and prioritizes immediate context. Characters are not tokens: use server `--strict-window` and handle HTTP 422 as unavailable.

Use `pnpm eval:router --validate-only` for corpus validation, not model accuracy. Real provider runs generate benchmark reports. The author-labeled corpus is small; transcription errors, prompt injection and distribution shift still require evaluation.

Official contracts: [schema](https://github.com/strands-labs/strands-decider/blob/main/src/strands_decider/schema.py), [server](https://github.com/strands-labs/strands-decider/blob/main/src/strands_decider/server.py), [inference](https://github.com/strands-labs/strands-decider/blob/main/docs/inference.md).
