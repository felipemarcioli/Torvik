# Torvik Implementation and Validation

## Local Delivery

The implementation preserves the framework and visual identity. This initial
delivery did not add accounts, a workout backend, or video uploads.

| Area            | Result                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Camera          | Control per attempt, idempotent cleanup, disposal of late streams/models, results ignored after cancellation, sequential inference, and a watchdog |
| Loading         | Shared script across simultaneous calls, timeout, removal after errors, and an actual retry                                                        |
| Geometry        | Coordinates converted using actual video dimensions; non-finite or degenerate measurements rejected                                                |
| Counting        | Confirmed starting position, hysteresis, temporal confirmation, and partial cycles discarded after tracking loss or excessive gaps                 |
| Exercises       | The most visible side is chosen and retained during squat/push-up cycles; simultaneous opening is required for jumping jacks                       |
| Session         | Preparation, camera selection when available, countdown, pause, deliberate resume, and pause when the page is hidden                               |
| Report          | Deduplicated events, active duration, app criteria, separate interruptions, and an insufficient-data state                                         |
| History         | Explicit saving, IndexedDB v1, JSON export, deletion, and comparisons only between compatible versions                                             |
| Interface       | Full frame with aligned video/canvas, dedicated action areas, radio selection, independent instructions, pt-BR, and visible focus                  |
| Performance     | Canvas resized only when needed, repeated frames ignored, selective HUD updates, and responsive WebP mascots                                       |
| Diagnostics     | Global error correlation across requests removed; no frames, landmarks, or raw errors in diagnostics                                               |
| Model evolution | Common adapter and isolated lab; Tasks Vision remains experimental and is not used for workouts                                                    |

## Initial Rules Without Scientific Validation

Version `2.0.0` specifies a stable starting position for 300 ms, transitions for
150 ms, range-of-motion confirmation for 100 ms, and interruption after a gap
above 750 ms. Squats and push-ups start below 150°, finish at 160° or above, and
use 90° for the initial range-of-motion criterion. The rules retain
inclination/alignment limits of 40°/25°. These values are engineering parameters
for evaluation, rather than exercise prescriptions.

Active duration begins after the countdown and includes only periods with
recognized tracking and starting position. Pauses, preparation, and loading are
excluded. Frozen frames suspend the clock after the 750 ms tolerance; the
watchdog ends an attempt after 20 seconds without new results. Rotation that
changes frame dimensions requests new preparation.

If legacy inference never resolves, tracks are stopped and results discarded,
but WASM shutdown waits for that operation to finish to avoid concurrent closure.
There is no abort API for the legacy `send`. A permission request can remain
pending until the browser responds; screen cancellation is immediate, and any
stream received afterward is stopped.

Extra application smoothing was removed; the legacy estimator's smoothing remains.
Its effect on latency and quality must be measured on real devices. Correcting
2D scale does not correct perspective or occlusion, and estimated 3D coordinates
are not used in the rules.

## Reproducible Checks

Environment used: Node 20.20.2 and Bun 1.3.10. The previous baseline passed
type/build checks but had 17 lint errors and 7 warnings. The implementation
eliminates the errors; Fast Refresh warnings remain in existing helper components.

Local results on September 22, 2026: **24 unit/integration tests and 8 E2E tests
passed**, type checks passed, lint reported zero errors and six warnings, and the
Vercel build passed. Lab tests cover metrics and cancellation with mocked models,
without validating the engines' actual inference.

- Unit/integration: known geometry at different aspect ratios; invalid points;
  small fluctuations; starting mid-cycle; partial range of motion; complete
  cycles; fixed side; tracking losses and long gaps; jumping jacks without
  simultaneous opening; late permissions; cancellation during creation/inference;
  playback failure; disconnection; timeout; repeated frames; script retry; unique
  events; clock and IndexedDB.
- E2E: keyboard selection/instructions; preparation → countdown → repetition →
  pause → resume; simulated page-hidden signal; reports; saving; reload; deletion;
  empty reports; restart; retry and framing at 360 × 800, 390 × 844, and 844 × 390.
- Frozen installation and build with `NITRO_PRESET=vercel`. The preset was tested
  without duplicating Nitro plugins in the Vite configuration.
- Dependency audit: limited lockfile fixes for `brace-expansion` (1.1.18 and
  5.0.9), `nanoid` (3.3.18), and `js-yaml` (4.3.2); `bun audit` reported no
  vulnerabilities in the local run. This is not a security certification.

## Validation Still Required Before Production

First-phase approval depends on a preview and real devices. Emulation does not
establish permission behavior, field of view, WASM compatibility, temperature,
battery use, or camera performance. No physical Android/iPhone testing,
professional evaluation, or comparison with consented videos was performed in
this delivery. The new adapter was compiled and type-checked; its Worker/WASM
compatibility must be established before use outside the lab.

1. Confirm branches and runtime in the Vercel dashboard and create a Preview of
   the implementation branch. Do not assume equivalence with the current deployment.
2. On Safari/iPhone and Chrome/Android, test granting/denying camera permission,
   cancellation during permission requests and loading, busy/removed cameras,
   connection loss/restoration, front/rear switching, rotation, backgrounding, and
   multiple consecutive sessions. Check the camera indicator after leaving.
3. Check all four frame boundaries and the skeleton in portrait/landscape,
   enlarged text, keyboard navigation, and VoiceOver/TalkBack. Measure contrast
   and feedback legibility at a distance.
4. Run extended sessions on the same devices, recording browser version, delivered
   resolution, latency, failures, heating, and battery use. Compare resolution
   and smoothing without changing multiple factors at once.
5. Inspect destinations, payloads, and headers in Preview and production. Confirm
   the absence of frames/landmarks in network traffic and logs. Inventory CSP and
   other hosting headers before tightening them, accounting for WASM and fonts.
6. Confirm history deletion, unavailable storage behavior, export, and recovery
   after reload. The browser may remove local data; export provides a manual copy.

## Protocol for Rules and Estimators

Build a video dataset with documented consent, cycle annotations, and professional
review. Separate development and evaluation; record the exercise, device,
orientation, framing, cadence, occlusion, count, start/end, and criteria by
repetition. Do not include video or personal data in the repository. Start each
video with the starting position visible for at least 300 ms.

Run both engines on the same files and timestamps. The lab provides absolute
count error, the proportion of tracked frames, and mean/p95 latencies internally
(p95 in the interface). False positives/negatives and agreement by repetition
require additional temporal annotations and event matching; a difference in
totals alone does not measure those indicators.

Define acceptance criteria per device/exercise before comparing: count error,
false positives/negatives, time without tracking, agreement on criteria, latency,
and failures. Promote Tasks Vision only after meeting them, retaining a rollback
to the legacy engine. Evaluate local WASM/model distribution and 2D/3D comparisons
as separate experiments. Do not publish scientific accuracy claims without a
supporting protocol, data, and review.

## Delivery and Rollback

CI validates Pull Requests; it does not deploy. Local work does not confirm the
production branch or change external services. After Preview and device approval,
integrate without rewriting published history. Revert through a new commit and,
if necessary, restore the previous deployment in Vercel. The persisted schema is
versioned; future migrations must preserve data or provide explicit recovery
before changing the database version.

## Expansion to 30 Exercises — October 6, 2026

Implementation in `codex/catalog-30`. The code confirms 30 unique IDs and groups
of 8 legs/glutes, 8 upper body, 7 core, and 7 cardio exercises. The previous 16 IDs,
their rules, and 48 preview files were preserved. Specific rules, camera guidance,
parameters, and limitations for the 14 new exercises are in
[catalog-30.md](catalog-30.md).

Environment: Node 20.20.2, Bun 1.3.10, Pillow 12.3, and Chromium installed in the
environment. The manifest and lockfile were not changed. Final checks were:

| Check                                     | Result                                                                                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run typecheck`                       | Passed, including tests.                                                                                                                              |
| `bun run lint`                            | Zero errors; six existing Fast Refresh warnings in UI components.                                                                                     |
| `bun run test`                            | **156 tests passed**, with 944 assertions, including 41 new tests and previous regressions.                                                           |
| `bun run build`                           | Passed for client, SSR, and Nitro.                                                                                                                    |
| `NITRO_PRESET=vercel bun run build`       | Passed, without publishing.                                                                                                                           |
| Playwright in mobile and desktop Chromium | **110 unique scenarios passed across grouped runs**: 74 existing and 36 new.                                                                          |
| New assets                                | 42 files present and decoded: 14 animations, 14 thumbnails, and 14 lossless strips. Alpha, margins, loops, dimensions, duration, and hashes verified. |
| Previous assets                           | All 48 files remain identical by SHA-256.                                                                                                             |
| Width and playback                        | 14 animated previews at 360/390 px, reduced motion, side changes, and timers; additional visual inspection at 390 × 844.                              |
| Final workout layout                      | Six targeted scenarios passed after constraining the grid column: isometrics at 360/390 px and camera/actions in portrait and landscape.              |
| `git diff --check`                        | Passed.                                                                                                                                               |

The environment used `node_modules/.cloud-playwright.mjs` to select the installed
Chromium, a synthetic camera, and a controlled estimator. The local server and
browser required execution permission outside the sandbox; this does not publish
the application. Final regressions correct ambiguous Squat/Jumping jack
("Agachamento"/"Polichinelo") selectors and the previous count of seven upper body
exercises. Local execution timeouts were adjusted to include reload and review
of all previews.

Tests cover complete/partial cycles, preparation, missing poses, low confidence,
invalid values, gaps, jitter, mirroring, alternating/selected sides, opposite
limbs, incorrect simultaneous flexion during running movements, isometric
acquisition/pause, side changes with separate times, persistence, export, and
progress. No change promoted Tasks Vision to workouts.

**Analysis implemented and verified with synthetic data; not validated against
real movements.** Consented videos annotated by cycle/side, threshold calibration,
evaluation of false positives/negatives and valid time error, and camera,
performance, and accessibility checks on Android/Chrome and iPhone/Safari remain
pending. Skaters do not establish an airborne phase; jump squats estimate elevation
in 2D and may confuse vertical camera movement with body elevation. Both require
a fixed camera. Other specific limitations are presented before starting and in
the documentation.

At the initial local delivery, no commit, push, or deployment had been performed.
Temporary review files remain outside the repository at
`/workspace/work/torvik-catalog30`.

### Revalidation for Integration into Main — October 6, 2026

The implementation was saved in commit `9a840b1`. After refreshing references,
`origin/main` was at `01470b61187ae30f00a017a817e6ff52f204e4c5`, an ancestor of
the implementation. Local integration used a fast-forward, without conflicts or
history rewriting, following authorization to publish directly to main.

Type checks, lint, the 156 unit tests, default and Vercel builds, decoding and
hashes of the 42 new assets, and integrity checks for the previous 48 assets
were repeated. All passed; lint retained the six existing warnings.

Running two browsers simultaneously was interrupted after automatic-start
failures under CPU constraints. With a single worker, the full suite had
108 passes and two failures: sampling the synthetic butt-kick cycle and scrolling
the guidance beneath the fixed action. Tests now wait for continuous samples of
each pose, including the starting position, and center the guidance before
checking its position relative to the button. Product thresholds and rules were
not changed.

After these adjustments, type checks and lint passed again. The targeted rerun
had **12 passes**, covering both failed scenarios, skaters, jump squats, and side
changes in mobile and desktop profiles. Across the full suite and rerun, all
**110 unique scenarios** had passing executions. There was no single full-suite
run with 110 passes. Practical validation with real movements and physical
devices remains pending, as described above.

### TanStack Start Security Update — October 6, 2026

To address the reported deployment block for CVE-2026-102989,
`@tanstack/react-start` was updated from `1.168.32` to `1.168.60`.
`@tanstack/react-router` moved to `1.170.41` and `@tanstack/router-plugin` to
`1.168.42`, following Start's exact dependencies and sharing
`@tanstack/router-core@1.171.34`. The `bun.lock` file was regenerated with
Bun 1.3.10; there is a single Start resolution at the corrected version, with no
copy of `1.168.32`.

The updated Start requires Node 22.12 or later. `.node-version` now records
22.23.3, used by the existing CI, and `engines.node` selects `22.x` in Vercel.
The generated `.vc-config.json` confirmed `nodejs22.x`. The root error component
uses `ErrorComponentProps`, compatible with the updated Router's types; server
diagnostics remain sanitized.

Checks performed with Node 22.23.3 and Bun 1.3.10:

- Installation with `bun install --frozen-lockfile`: passed without changing the
  lockfile.
- Type checks: passed after adjusting the error component's type.
- Lint: zero errors; the same six Fast Refresh warnings in UI components.
- Unit tests: **156 passed**, with 944 assertions.
- Default and `NITRO_PRESET=vercel` builds: passed for client, SSR, and Nitro.
- SSR from the Vercel output, served locally through an HTTP adapter: the home
  page responded with 200 and a nonexistent route with 404, with their respective
  content.
- Playwright: **eight targeted scenarios passed**, four in mobile Chromium and
  four on desktop, using that production output. They cover floor press, side
  changes and separate side-plank times, history filters/chart/calendar,
  preparation, workout, pause, reports, saving, and restart. The full
  110-scenario suite was not repeated for this update.
- `git diff --check`: passed.

`bun audit --json` did not report vulnerabilities in TanStack Start or any other
resolved TanStack packages. The command still returns status 1 due to existing
warnings for `brace-expansion` (1.1.18 and 5.0.9), `shell-quote` (1.10.0), and
`source-map-js` (1.2.1), whose versions were already in the previous lockfile and
were preserved. These independent findings remain pending.

In the local environment, the initial resolution of cached metadata stalled;
`bun install --no-cache --network-concurrency=1` completed the update using the
same npm source and configured proxy. The subsequent frozen installation did not
need that adjustment. Tools, logs, and adapters used in the review remain outside
tracked files.
