<img src="./public/clashpoint-mark.png" alt="ClashPoint logo" width="64" />

# ClashPoint · AWS edition

**Catch the contradiction before the commitment.**

A meeting verification agent that chooses a read-only tool with **Strands Decider 2B**, checks authorized records, and uses **Amazon Bedrock** to explain supported conflicts and propose conditional wording. Humans make the decision; the agent never edits a company source or promises a delivery date.

```text
final turn + recent dialogue
  → Decider 2B: choose tool + classify intent
  → low confidence? clarify without a tool call
  → selected approval / dependency / capacity / ownership / prior-decision tool
  → server-owned active evidence
  → Bedrock Converse explanation
  → evidence-ID validation → finding + inspectable trace
```

## Offline rehearsal

Requires Node.js 24+ and pnpm 11.19.0. Dependency versions are pinned.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. Choose **Offline rehearsal**, **Start ClashPoint**, then **Next demo beat**. The inherited deterministic pipeline works without credentials. It does **not** invoke Decider or Bedrock and is **not** the qualifying live-model demonstration.

Development and production scripts use the supported Webpack path: Turbopack's CSS subprocess failed on the inspected Windows host. Browser tests use installed Chrome and a separate local port, 3017.

1. “Are all the Acme blockers cleared?” → “Yeah.” exposes an open dependency.
2. “Let's promise Feature X to Acme by Friday.” exposes an outstanding approval requirement.
3. Assigning Valya another P0 exposes a numeric capacity limit.
4. **Apply simulated approval update** rechecks source revisions and retires the obsolete legal warning while retaining evidence in a downloadable snapshot.
5. Manual input supports conditional wording, reversals and source-grounded checks. Microphone uses the browser speech service; Script/Manual remain available.

**All GitHub/Notion/policy records in the analysis pipeline are labeled demo fixtures.** The optional legacy live GitHub health adapter does not feed this pipeline. The source-update button changes the selected fixture revision in this session; it does not change GitHub or Notion.

## Actual Decider + Bedrock inference

Follow [LOCAL_SETUP.md](docs/LOCAL_SETUP.md):

1. Run the official Strands Decider **2B** server on loopback or a private network, with `--strict-window` to refuse rather than silently truncate long prompts.
2. Configure an AWS profile/role with permission to invoke your selected Bedrock Converse model.
3. Create `.env.local` from `.env.example`, enable AWS mode and set an app access code of at least 16 characters. Never put AWS credentials in the browser.
4. Restart the app. Choose **Live AWS inference**, enter the app access code and run the scenario.
5. Inspect the live trace. Provider failure remains unavailable; there is no silent fallback.

```sh
pnpm smoke:aws
```

The smoke test succeeds only when real Decider routing, real Bedrock generation and verified evidence complete. Configuration status alone does not prove inference access. No live-model results are included until services are configured and measured.

## Reusable decision pattern

[patterns/README.md](patterns/README.md) documents the typed questions, confidence policy and integration seam. [patterns/questions.json](patterns/questions.json) is shared by the app and evaluation CLI. [patterns/meeting-router.ts](patterns/meeting-router.ts) validates the official wire response, bounds context and turns the result into control flow.

Hackathon tags: `#strands-decider-2b` and `#tool-selection`.

## Verification and evaluation

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm eval:router --validate-only
pnpm eval:router --split development --out decider-development.json
pnpm eval:router --split validation --out decider-validation.json
pnpm eval:router --baseline --split validation --out bedrock-validation.json
```

Provider evaluations make real calls and can incur compute/Bedrock charges. The 36 author-labeled router cases include different entities, short replies, conditions, reversals, topic switches and ambiguity. Select a threshold on development cases, freeze it, then evaluate validation cases. This is a small development corpus, not an independent benchmark. Reports include dataset/question hashes, errors, token usage and latency. Hosting is not free just because Decider generates no tokens.

**EVAL 27** remains the inherited deterministic fixture suite, not a measurement of Decider/Bedrock accuracy.

Executed local checks and limitations are recorded in [VERIFICATION.md](docs/VERIFICATION.md).

## Hosting and submission

- [AWS deployment guide](docs/AWS_DEPLOYMENT.md): standalone container, private Decider and IAM boundary. Nothing deploys automatically.
- [Article draft](docs/SUBMISSION_ARTICLE.md): agent, meaningful decision and measured lessons.
- [Video script](docs/DEMO_SCRIPT.md): 2:45 demonstration; not a recorded/uploaded video.
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md): required evidence, public repository/license, tags and disclosure.
- [Provenance](PROVENANCE.md): inherited work and eligibility caveat.
- [Hackathon strategy](docs/HACKATHON_STRATEGY.md): requirements, judging dimensions and demonstration priorities.

## Boundaries

This is a single-principal prototype, not a production multi-tenant recorder. The app access code limits paid inference access; it is not production authentication. Raw turns remain in browser memory and are sent to configured providers in live mode. The app does not persist history; configured services may have their own logging settings. Downloaded evidence snapshots contain source text and interpreted statements; review before sharing.

The default confidence threshold is illustrative, not calibrated for meetings. Checks are limited to available structured records. Missing sources, low confidence and unsupported interpretations are not an all-clear.

MIT covers the code. Model weights and dependencies retain their own licenses.
