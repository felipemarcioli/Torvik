# English translation review

Date: 2026-10-15. Reviewer: AI-assisted translation agent. Locale: `en`; expected speech locale: `en-US` (integration owned by the main implementation).

## Scope and technical checks

Translated all 829 entries in the supplied `pt-BR/translation.json` inventory into English, preserving exact source keys and interpolation tokens. This count describes the inventory at translation handoff; the main implementation may remove obsolete entries or add newly discovered text.

Executed a Python JSON comparison against the Portuguese catalog:

- Source keys: 829; English keys: 829.
- Missing keys: 0; extra keys: 0.
- Empty translations: 0.
- Interpolation-token mismatches: 0.
- Unicode replacement characters or invalid control characters: 0.
- Nine unchanged values are intentional shared names, units, or labels: `ms`, `torvik`, `Volume`, `Dead bug`, `Bird dog`, `Mountain Climber`, `A`, `B`, and `{{value0}} ms`.

These checks verify catalog structure, not runtime interpolation, rendered UI, actual speech playback, or pronunciation. Those require the integration test suite and device review.

## AI semantic review

Reviewed the supplied preparation instructions, movement cues, exercise descriptions, posture explanations, history/report interpretations, and privacy/authentication messages directly against Portuguese. No online translation service or back-translation service was used.

| Source meaning | English treatment | Review outcome |
| --- | --- | --- |
| Romanian deadlift: move the hips back, lean the torso, and return upright | “Push your hips back, hinge your torso forward … return to standing upright” | Preserves the hip hinge and does not suggest spinal rounding. |
| Keep the arm close to the torso during a curl or kickback | “Keep your upper arm close to your torso” | Clarifies the anatomical segment that remains stable while the elbow bends. |
| Lower and raise the pelvis during plank correction | “Raise your hips slightly” / “Lower your hips slightly” | Direction preserved; explanatory text distinguishes movement toward or away from the supporting surface. |
| Forearm plank support | “Rest on your forearms” | Does not substitute hand support. |
| Opposite arm and leg in dead bug/bird dog | “one arm and the opposite leg” | Contralateral coordination preserved. |
| Left/right side of the extended leg or moving hand | Described explicitly in the repetition criteria | Does not confuse the support side with the moving side. |
| Front leg of Bulgarian split squat | “selected front leg” | Preserves which leg the app evaluates. |
| Elbow flexion vs. extension | “bend” / “straighten,” with “flexion” / “extension” in technical explanations | Direction preserved and brief spoken cues remain natural. |
| Heel rise vs. foot movement | “heel” is retained in calf-raise cues | Does not change the target to the whole foot or toes. |
| Safe range and controlled return | “comfortable range of motion” / “with control” | Preserves the original limits; adds no stronger instruction. |
| Camera limitations | “does not verify” actual contact, load, spinal curvature, or airborne phase | Keeps the original uncertainty instead of implying clinical or biomechanical validation. |
| Report values | “meeting criteria,” “evaluated repetitions,” “valid time” | Does not equate app criteria with proven safety or improvement. |
| Local history and authentication | Preserves optional saving, per-account separation, local storage, Supabase, and lack of sync | No new privacy guarantees added. |

The two legacy messages explicitly naming a Portuguese local voice were translated faithfully. The main implementation is retiring these in favor of language-neutral voice-availability keys. The raw HTML fallback document was translated without changing its markup, but the main implementation is removing this accidental full-document key.

## Follow-up and human validation

Native English fitness-language review is still pending, especially for the 30-exercise catalog, safety wording, and brief spoken corrections. AI review is not clinical validation or proof of natural pronunciation. Some standalone common exercise names were absent from the supplied inventory; this was reported to the main agent for a broader source audit.

Visual review, actual English TTS playback, pronunciation/naturalness assessment, and Android/iOS browser checks were not performed by this translation task. No such results are claimed.

Validation classification at handoff:

- A — Catalog technically valid: verified by the checks above.
- B — Semantics: reviewed with AI; native speaker review pending.
- C — TTS integration: outside this translation task; see the main test report.
- D — Actual audio playback: not tested here.
- E — Human pronunciation/naturalness review: pending.
