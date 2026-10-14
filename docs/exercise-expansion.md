# Catalog of 16 Exercises

Eight new repetition-based exercises reuse the existing capture, inference,
automatic preparation, voice guidance, `SessionLedger`, v2 session contract,
IndexedDB, and exports. The previous eight detectors and their versions remain
unchanged. Side selection and pixel distance were simply extracted into a shared
module.

## Detectors and Camera

| Exercise / ID                        | Camera                                                            | Evidence and cycle completion                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Glute bridge / `glutebridge`         | Side view, close to the floor                                     | Bent knees, shoulder–hip–knee extension, and elevation relative to support points; counts when the hips return to the low position.                                                    |
| Standing calf raise / `calfraise`    | Side view, with the body and feet clear                           | Heel-to-toe elevation normalized by the foot and projected onto the initial body axis; counts when support is restored. Leaning the torso with a flat foot does not imitate elevation. |
| Reverse lunge / `reverselunge`       | Slightly oblique side view; both feet visible                     | Confirms a backward step using foot orientation and relative displacement, front-knee flexion, and rear-knee descent; completes only when the feet are close together again.           |
| Shoulder press / `shoulderpress`     | Front view, with both arms fully visible                          | Bilateral elbow extension and wrist elevation above the shoulders; counts on the return to the bent position.                                                                          |
| Front raise / `frontraise`           | Side view, with the face and arm visible                          | Forward elevation relative to the torso; direction is inferred from the face's projection. Tracks one arm and flags persistent elbow flexion or excessive elevation.                   |
| Bent-over row / `bentoverrow`        | Side view, with the arm, hip, and knee visible                    | Inclined torso, elbow flexion with displacement toward the hip, and the hand moving closer; counts on extension. Torso movement alone does not satisfy the cycle.                      |
| Triceps kickback / `tricepskickback` | Side view, with the arm, hip, and knee visible                    | Inclined torso and upper arm alongside the body; elbow extension and return, with upper-arm stability evaluated.                                                                       |
| Mountain climber / `mountainclimber` | Slightly oblique side view, with the hands and both knees visible | High plank, one knee moving closer, then return. Each knee counts as one repetition; after the return, the opposite side is required.                                                  |

Single-side exercises choose the side with greater visibility before the cycle
and do not switch sides during execution. For reverse lunges, the interface
identifies the inferred front knee; for mountain climbers, it identifies the side
of the cycle; for bilateral shoulder presses, it does not indicate a single side.

The new rules use version `1.0.0`, defined in the catalog. Parameters are in
`NEW_RULES`. They require a 300 ms starting position, 150 ms transitions (250 ms
for calf raises), 100 ms range-of-motion confirmation, and at least two samples
with distinct timestamps. They also confirm a minimum excursion so that an
isolated peak does not register a repetition.

Visibility loss, invalid dimensions, NaN, pause, camera changes, and gaps above
750 ms discard partial evidence. Preparation and countdown do not count. Cycles
with enough excursion but without the target range of motion are classified as
outside the criteria; noise and incomplete returns do not count. Interruptions
preserve completed totals.

## Interface and Data

The catalog was sorted by category without changing components, styles, or
controls. All 16 options use the existing cards and accordion. `back` was added
as a category; kickbacks use `arms` with the label "Tríceps" (triceps). No filters
were added.

New reports remain `schemaVersion: 2`, `type: REP_BASED`, with deduplicated
events and the same totals, reasons, active time, and versions. There was no
schema change or migration. Planks retain their hold-based mode. Voice guidance
uses the shared dictionary: range-of-motion feedback after two repetitions with
that reason, persistent posture feedback, and milestones every five repetitions.

## Assets

Sprites were generated with the built-in image tool using the current mascot as
a reference, then assembled with the existing Pillow converter. Prompts and
assembly criteria are in `exercise-preview-prompts.json`.

Eight sets were approved: glute bridge, calf raise, reverse lunge, shoulder press,
front raise, row, kickback, and mountain climber. Each set in
`public/exercise-previews/` contains:

- `torvik-{id}.webp`: eight 256 × 256 frames, a 1,600 ms loop, and actual alpha
  transparency.
- `torvik-{id}-still.webp`: the first frame for reduced motion.
- `torvik-{id}-sprite.webp`: a normalized lossless strip for reproducing the
  process.

Animated files are below 122 KB. They use discrete poses without interpolation or
transparency blending. Each sequence uses a single scale; individual frames are
not resized to fill their cells. Review uses light and dark backgrounds and checks
margins, tail, ears, hands, feet, and dumbbells. Existing assets were not changed.

The mountain climber uses an elevated front view to show alternating knees:
high plank, one knee moving closer and returning, then the other. The set was
generated with `torvik-lunge-still.webp` as the identity reference; the built-in
tool removed the background before assembly. It has eight frames, 1,600 ms per
cycle, and 121,444 bytes in the animated file. Configuration now enables the real
preview; the generic fallback remains intact. No exercise rule or visual
component was changed.

To re-encode an approved set with Python and Pillow 12.x:

```sh
python3 scripts/build-exercise-preview.py public/exercise-previews/torvik-glutebridge-sprite.webp glutebridge --rows 1 --output /tmp/torvik-preview-check
```

The converter rejects overlapping silhouettes, large unassigned components, and
characters touching the edges; it requires visual review of the original sheet
before extraction. It never crops automatically using fixed cells. Generated
poses may contain small appearance variations between frames; they are not a
validated biomechanical reference.

## Files

- `src/lib/exercises/catalog.ts`: eight definitions, categories, and previews.
- `src/lib/exercises/expansion.ts` (new): rules and cycle state machines for the
  new exercises.
- `src/lib/exercises/side.ts` (new): extracted helpers without changes to previous
  behavior.
- `src/lib/exercises/analyzers.ts`: registration of new factories and helper
  imports.
- `src/lib/exercises/core.ts`: heel and toe landmark names.
- `src/lib/exercises/feedback.ts`: messages shared with voice guidance and reports.
- `scripts/build-exercise-preview.py`: new identifiers accepted by the converter.
- `tests/fixtures/expansion.ts`, `tests/expansion.test.ts`, and
  `tests/e2e/expansion.spec.ts` (new).
- `tests/exercises.test.ts`, `tests/voice.test.ts`, and
  `tests/e2e/exercises.spec.ts`: catalog, feedback, and unambiguous selection
  between Lunge ("Afundo") and Reverse lunge ("Afundo reverso").
- 24 WebP files, this document, and the prompt record.

## Limitations and Physical Validation

Heuristics based on 2D images do not measure load, force, actual depth, clinical
accuracy, or execution safety. Limb occlusion, low light, small feet in the frame,
and perspective can prevent or distort counts. Calf raises are particularly
sensitive to foot resolution. Front raises depend on side orientation and the
face's projection; reverse lunges depend on visible foot orientation. Mountain
climbers require both knees to be visible and a return to plank between knee
movements, which can reject very fast cadences.

There is no detection of descent speed, rhythm, load, momentum, or three-dimensional
knee alignment. These items are not presented as detected errors.

Synthetic tests and a simulated camera do not replace validation with people and
consented videos. Physical sessions in Chrome/Android and Safari/iPhone,
different bodies, cadences, and camera positions, as well as real audio and
thermal performance, remain pending.

## Local Verification Results — September 27, 2026

Environment: Node 20.20.2, Bun 1.3.10, and Pillow 12.3.0. Dependencies were installed
with the frozen lockfile; the manifest and lockfile were not changed.

- `bun run typecheck`: passed, including test types.
- `bun run lint`: zero errors; six Fast Refresh warnings in existing UI components.
- `bun test tests/*.test.ts`: **115 tests passed**, including regressions for the
  previous eight exercises, geometry, counting, camera, preparation, voice, and
  persistence.
- `bun run test:e2e --workers=2 --reporter=line`: **66 scenarios passed** in mobile
  and desktop Chromium. They cover selection, framing, countdown, repetitions,
  pause, cancellation, voice on/off, reports, history, exports, keyboard, layouts,
  and reduced motion.
- `bun run build`: passed for client, SSR, and Nitro, with existing plugin
  configuration warnings. No deployment was performed.
- Assets: the seven animated files have actual alpha transparency, eight frames,
  a 1,600 ms duration, infinite looping, 256 × 256 dimensions, and transparent
  margins in every frame. Visual review on light/dark backgrounds was completed;
  previous original assets were preserved.

The review added regressions to prevent a curl with a stationary elbow from
counting as a row and to keep feedback from inventing a range-of-motion problem
when the only recorded reason is posture. Positive messages also use the positive
visual state. The final feedback presentation adjustment had another unit test,
type, lint, and build run, followed by four passing targeted browser tests for
glute bridge and front raise flows.

The Lunge E2E selectors now use the identifier to avoid confusing the name with
Reverse lunge; the Metric ("Métrica") selector uses the combobox role, preserving
its verification. No changes were made to interface components, camera hooks,
MediaPipe, storage, or the previous exercises' algorithms. No commit, push, or
deployment was performed.

### Addendum: Mountain Climber Preview

- `npm run typecheck` and `npm run build`: passed.
- `npm run lint`: zero errors and the same six existing Fast Refresh warnings.
- Four targeted E2E tests for cards/previews passed in mobile and desktop Chromium,
  including 360 × 800, 390 × 844, and reduced motion.
- Card playback was confirmed by three consecutive captures showing different
  frames; the path was correct, with no unavailable message or horizontal overflow.
- Eight decoded frames, actual alpha transparency, and transparent margins were
  verified on light and dark backgrounds. Other preview files remain identical
  by SHA-256.
- This delivery added only the three mountain climber WebP files, enabled their
  mapping, and updated tests/documentation. No commit, push, or deployment was
  performed.
