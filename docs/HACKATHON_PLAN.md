# ClashPoint AWS edition

Build a meeting verification agent for the AWS Agent Experience Hackathon: Strands Decider.

## Scope

Preserve the original project, its attribution, immutable transcript, source-owned quotations, access filtering, keyboard access, and credential-free rehearsal. Add an independent live AWS engine: typed Strands Decider 2B tool selection, confidence-based clarification, read-only verification tools, and Bedrock event interpretation and evidence-grounded explanations. Do not silently fall back to rehearsal in live mode.

Changes reach the request/response schemas, analyze route, reusable routing pattern, provider adapters, verification tools, source refresh, meeting UI, tests, CI, deployment configuration, and submission documentation. No cloud resources are created or deployed by this work.

## Acceptance

- [x] No edits made to original project; copy excluded secrets, Git history, generated files and dependencies before installing/building locally.
- [x] Existing deterministic tests continue to pass.
- [x] Decider uses the official `/v1/systemone` contract and its result controls which tool executes; contract tested with controlled responses.
- [x] Low confidence, invalid responses and provider failures are explicit; none becomes a clean result.
- [x] Bedrock Converse interpretation/generation path implemented and adapter-tested; no browser credentials.
- [x] Evidence remains server-owned, authorized, active and entity-scoped.
- [x] Conditional statements cannot become interrupt-level cards.
- [x] Offline rehearsal and live inference have distinct visible labels.
- [x] Trace exposes selected tools, confidence, provider status, reported tokens and measured latency; no seeded live-model results.
- [x] Evidence refresh retires warnings only for verifiably superseded/resolved facts.
- [x] Reusable routing recipe, evaluation command, AWS deployment guide, article draft and sub-three-minute video script exist.
- [x] Type checking, 125 unit tests, production build and 14 Chrome flows verified on October 22, 2026.
- [x] Independent code review findings addressed with regression tests, including global capacity scope.
- [x] Linux standalone image built and local non-root container rehearsal checked; see VERIFICATION.md.
- [ ] Actual Decider 2B + Bedrock smoke test and model evaluation: requires local model server and AWS account setup.
- [x] Owner reports organizer-confirmed eligibility on October 22, 2026; prior work remains disclosed.
- [x] Separate public ClashPoint-AWS repository published with MIT license; original ClashPoint repository made private and both settings verified.
- [ ] AWS execution, article/video publication and submission: require owner's account and actual execution. See SUBMISSION_CHECKLIST.md.

## Design

Retain the established graphite operations console (#0b0d0f, #111418), off-white text (#f2efe7), amber warnings (#efb64a), red conflicts (#f06464), and blue focus (#78a7d8). Keep IBM Plex Sans for speech and explanations, Plex Mono for evidence metadata. Transcript and decision evidence remain the two primary columns. Add one compact, expandable decision trace rather than a dashboard of decorative metrics. Narrow layouts stack the columns; reduced motion and modal focus behavior remain intact.

## Eligibility and provenance

This is derived from Xenon010101/ClashPoint, whose history predates the event. The owner reports that organizers confirmed eligibility on October 22, 2026. Prior work and new contributions remain documented in PROVENANCE.md. A new repository or private predecessor does not erase that history. No claim of measured model accuracy, live provider success, or winning probability is made without evidence.
