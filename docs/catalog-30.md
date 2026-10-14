# Expansion to 30 Exercises

The inspected baseline contained 16 IDs: 5 legs, 7 upper body, 2 core, and 2 cardio.
Another 14 were added, without removals or replacements, bringing the totals to
**8/8/7/7**. Chest, back, arms, and shoulders remain subcategories within the upper
body group. The analyzers and image files for the previous 16 exercises were
preserved.

## Definitions and Integration

`additions.ts` contains Portuguese names, equipment, preparation, execution,
repetition/hold definitions, camera guidance, and specific limitations.
`catalog.ts` combines the definitions, and `data.ts` preserves the selection
groups. All new options use the same preparation, countdown, workout, voice,
report, and save flows.

| ID                 | Measurement                                 | Observable evidence and camera                                                                                                                                      |
| ------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `romaniandeadlift` | Repetitions                                 | Hip flexion with extended arms, an inclined torso, and slightly bent knees; return upright. Side camera at hip height.                                              |
| `bulgariansquat`   | Repetitions for the selected front leg      | Asymmetric stance and elevated rear ankle; flexion and extension of the front knee. Diagonal side camera showing both feet.                                         |
| `wallsit`          | Valid hold time                             | Approximately vertical torso with hips and knees flexed. Side camera at knee height. Does not establish contact with the wall.                                      |
| `floorpress`       | Repetitions                                 | Horizontal torso; bilateral elbow extension with raised wrists, followed by a return to flexion. Low diagonal side camera, with both arms visible.                  |
| `sideplank`        | Hold time for the selected support side     | Extended body axis, bent supporting arm, and vertically separated shoulders. Low camera facing the exposed side.                                                    |
| `deadbug`          | Repetitions by extended leg                 | Horizontal torso with supporting limbs pointing upward; coordinated extension of the opposite arm and leg, then return. Elevated diagonal camera.                   |
| `birddog`          | Repetitions by extended leg                 | Horizontal torso with the supporting hand and knee underneath; extension of opposite limbs, then return to all fours. Low diagonal side camera.                     |
| `lyinglegraise`    | Repetitions                                 | Horizontal torso; extended legs rise together and return together. Low diagonal side camera.                                                                        |
| `shouldertap`      | Repetitions by hand                         | High plank; a hand approaches the opposite shoulder, then returns to support with an extended arm. Low diagonal front camera. Proximity does not establish contact. |
| `highknees`        | Alternating repetitions and active duration | Knee lift relative to the hip with knee flexion, then return. Oblique front camera showing both legs.                                                               |
| `buttkicks`        | Alternating repetitions and active duration | Knee flexion and reduced ankle-to-hip distance with the thigh low; return to extension. Oblique side camera.                                                        |
| `skater`           | Each completed lateral arrival              | Hip displacement, inferred support-leg change, and a stable arrival with a crossed leg. Fixed front camera with lateral space. Does not establish a jump.           |
| `stepjack`         | Each opening and return by side             | One foot moves while the other stays near its reference position, with arms raised; feet close and arms lower. Fixed front camera.                                  |
| `jumpsquat`        | Squat–rise–return cycle                     | Both knees flex, hips and all four foot landmarks rise, then landing and return upright. Fixed diagonal side camera, with clearly resolved feet.                    |

For alternating movements, a repetition is emitted only on the return. The next
cycle requires the opposite side. For skaters, arrival completes the cycle.
Labels use the model's anatomical side, including when the image is mirrored.
When the side is changed explicitly, the session preserves completed totals,
discards partial evidence, and prepares the other position.

## Initial Rules and Limitations

`catalog-analyzers.ts`, `movement-measures.ts`, `temporal.ts`, and `isometrics.ts`
implement the new `1.0.0` rules. These are engineering heuristics **without
validation against real movements**. `PARAMETERS` groups thresholds by movement;
`MODERN_TIMING` groups timing settings: a 300 ms starting position, 90 ms
entry/return, 70 ms target confirmation, exponential measurement smoothing with a
45 ms time constant, 500 ms isometric acquisition, 250 ms fluctuation tolerance,
and interruption for gaps above 500 ms. Transitions require at least two distinct
timestamps. Entry and exit use different thresholds.

Angles account for the video's aspect ratio; distances are normalized by the
torso, leg, or foot. Relevant landmarks must be in frame, finite, and have
visibility >= 0.65, with a torso at least 20 pixels long. Missing poses or
insufficient confidence interrupt partial evidence and request reframing.
Occlusion during floor exercises can make the framing unsuitable; a diagonal view
must show both pairs of limbs. Preparation, repeated frames, and partial cycles do
not add repetitions.

Isometric exercises accumulate only the intervals between two consecutive valid
frames after stable acquisition. Brief fluctuations preserve acquisition but
**do not add invalid time or bridge the gap**. After the tolerance expires,
acquisition is required again. Confidence loss, pause, or a side change requires
new acquisition. The tolerance can be configured in the analyzer constructor.

Particularly relevant limitations:

- Side planks require projected shoulder separation to distinguish them from
  front planks; views with overlapping shoulders are rejected.
- Skaters evaluate displacement and arrival, without establishing an airborne
  phase. Counts cannot establish that each displacement was a real jump.
- Jump squats depend on clear feet and a stationary camera. Vertical image
  translation after a squat can imitate elevation evidence; pose estimation
  cannot establish physical contact. Very short jumps may be missed.
- Very fast alternating runs can be rejected by confirmation times or an
  incomplete return between sides. Calibration with real videos is required.
- No rule recognizes load, muscle activation, bench stability, actual floor/wall
  contact, or spinal details. General instructions are presented separately
  from messages about observed evidence.

## History and Compatibility

Repetition events can include `side`. Sessions for exercises with sides can
include `sideResults` with repetitions, repetitions meeting the criteria, and
valid seconds by side. Reports, details, comparisons, CSV, and printable reports
show these values. The progress chart supports filtering by side; older summaries
without that information are not given invented values. JSON exports preserve
the new fields.

The contract remains `schemaVersion: 2`, with validated optional fields and
deduplicated events; IndexedDB remains at version 1. Older schema 1 readers and
previous schema 2 sessions remain covered by regression tests. Active duration
and valid hold time are different metrics.

## Animations

Each new exercise has its own animation, thumbnail, and lossless strip at
`public/exercise-previews/torvik-{id}{,-still,-sprite}.webp`. Playback remains in
`ExercisePreview`, using native animated WebP; reduced motion uses the thumbnail.
The catalog references all three files and does not use placeholders.

The sheets were generated with the built-in image tool using the existing Torvik
as a reference. Revisions preserve the character, sunglasses, vest, colors, and
3D finish, and distinguish alternating limb pairs. Movements that need equipment
include dumbbells, a bench, or a wall. These are discrete poses for demonstrating
preparation, execution, and return, rather than a continuous anatomical simulation.

The existing Pillow converter gained a reviewed grid mode, small alpha-fragment
cleanup, a single scale without distortion, row alignment, and explicit playback
ordering. The origin is preserved within each row to retain jump height and
displacement. Sheets that cut off bodies at the edges are rejected. Prompts,
orders, and encoding metadata are in `catalog-30-preview-prompts.json`.

The 14 animated files total 1,114,338 bytes, and each is below 98 KB.
All have eight 256 × 256 frames, a 1,920 ms infinite loop, and actual alpha
transparency. Reading the 42 files verified dimensions, transparent margins,
duration, and playback; the previous 48 assets remain identical by SHA-256.
The file inventory, sizes, and hashes are in `catalog-30-preview-assets.json`.

To re-encode an approved normalized strip without moving or resizing frames:

```sh
python3 scripts/build-exercise-preview.py public/exercise-previews/torvik-birddog-sprite.webp birddog --normalized --frame-ms 240 --output /tmp/torvik-preview-check
```

## Verification and Practical Validation

`tests/catalog-30.test.ts` and its fixtures exercise complete/partial cycles,
starting positions, pose loss, low confidence, NaN, gaps, repeated timestamps,
noise, aspect ratios, mirroring, alternation, explicit side changes, opposite
limbs, isometric acquisition/pause, deduplication, and history/export by side.
`tests/e2e/catalog-30.spec.ts` covers selection, preparation, measurement with a
controlled estimator, reports, saving, reload, and CSV for the 14 exercises, plus
side changes, animation, reduced motion, and mobile widths of 360/390 px.

No videos of people or real cameras were used to evaluate the new rules.
Consented recordings with annotated cycles and sides, Android/Chrome and
iPhone/Safari tests, different bodies, cadences, diagonal views, occlusion, and
lighting are still required. Measure false positives/negatives by cycle and valid
time error before publishing accuracy claims. Use `/lab` to compare counts and
coverage over the same segment; it does not measure agreement by repetition
without additional temporal annotations.

The final command results for this delivery are in `validation.md`.
