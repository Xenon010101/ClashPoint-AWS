# Verification record — October 22, 2026

This records executed checks, not expected results. The original project was not edited. All changes, installs and generated app artifacts are in the separate ClashPoint-AWS directory. An original-tree Git-status audit could not complete under the filesystem permissions; no clean-tree claim is made.

| Check | Result |
| --- | --- |
| TypeScript `tsc --noEmit --incremental false` | Passed, exit 0. |
| Vitest full suite | 35 files, **125 tests passed**, exit 0. |
| Production Webpack build | Passed, exit 0; routes generated successfully. |
| Playwright, installed Chrome, production server | **14 tests passed**, exit 0; 16.2 seconds for final full run. |
| Router dataset validation | 36 cases valid; explicitly no model inference. |
| Real AWS smoke command | Not run through inference: correctly stopped because the app access code/configuration was absent. |
| Docker Linux image build | Passed with frozen lockfile and standalone output. Local tag: clashpoint-aws:local-verified. |
| Docker runtime check | Rehearsal produced F-LEGAL-1, semantic provider skipped, live disabled, logo HTTP 200, uid 1000. Temporary container stopped; image retained. |
| Chrome interactive preview | Script completed with three source-backed findings. Preview served at http://127.0.0.1:3017 while the local server runs. |

## What browser checks cover

Script pacing/pause/reset, three findings, source inspection, evidence modal focus trap/return, frozen evaluation modal, manual entry, decision receipt, microphone fallback copy, separate legacy source health, live-mode configuration failure, source-revision retirement, snapshot download and 390-pixel layout without horizontal overflow.

Screenshots in docs/screenshots are **offline rehearsal**; they are not evidence of real Decider/Bedrock execution.

## Review and fixes

Two independent review passes identified subject matching, offline provider isolation, benchmark validation parity and global capacity scope. Each received a regression test. The benchmark now calls the same runtime response validator/context builder; invalid distributions count as errors. Source retirement retains unavailable evidence for review instead of deleting warnings.

Windows Turbopack's CSS subprocess failed; the supported Webpack build passed. The sandbox prevented some worker temp files and localhost/Docker access; the corresponding checks were rerun outside that boundary. Chrome tests use a stable production server to avoid development hot-reload interruptions.

## Not verified

Real Decider 2B checkpoint execution, Bedrock credentials/model access, live-model accuracy/latency/cost, AWS hosting, microphone hardware capture, article/video publication and submission. The owner subsequently reported organizer-confirmed eligibility; see PROVENANCE.md. No external accounts or cloud resources were created. The author-labeled corpus and deterministic EVAL 27 suite are not general model-accuracy claims.

See LOCAL_SETUP.md for the next real-inference steps, AWS_DEPLOYMENT.md for hosting, and SUBMISSION_CHECKLIST.md for unresolved submission requirements.
