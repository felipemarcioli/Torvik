# Hindi translation review

Date: 2026-10-15. Locale: `hi`. Reviewer: AI translation agent. Expected speech locale: `hi-IN`.

## Scope and catalog validation

Preserved the 699 existing Hindi translations and added 255 missing translations directly from the Portuguese source. The additions include all ten report/export strings in `docs/i18n-export-additions.json` and all five final UI strings in `docs/i18n-ui-additions.json`. The obsolete full HTML document key is absent from the final source and Hindi catalogs.

Validated the final catalogs with Python JSON parsing and key, interpolation, and Unicode comparisons:

- Portuguese source: 954 keys; Hindi: 954 keys.
- Missing or extra keys: 0.
- Empty values, duplicate keys, or interpolation-token mismatches: 0.
- Invalid Unicode, replacement characters, or unexpected control characters: 0.
- All 255 new values were reviewed against their source meanings. Existing translations were preserved and included in the structural checks; this pass does not claim a new comprehensive semantic review of the previous 699 entries.
- The only source-identical values are the brand `torvik` and comparison identifiers `A` and `B`. All other values contain Hindi text. Familiar fitness terms are transliterated into Devanagari; file formats, interpolation tokens, and the Torvik name retain their identifiers.

## AI semantic review

The new translations were written and reviewed directly without an external translation service. Short cues use polite Hindi imperatives, and report explanations preserve uncertainty and the distinction between app criteria and actual exercise safety.

| Meaning reviewed | Hindi treatment and outcome |
| --- | --- |
| Repetition counts and criterion compliance | `दोहराव` and `मानदंडों के अनुरूप` preserve evaluated repetitions and compliance without calling them medically safe or biomechanically correct. |
| Valid time and active time | `मान्य समय` and `सक्रिय समय` remain distinct. Preparation, pauses, tracking loss, and invalid posture retain the exclusions stated by each source string. |
| Comparison across analysis versions | Keeps separate rule/model versions and explicitly says differences are not calculated when versions differ. Percentage points are translated as `प्रतिशत अंक`, not percentages. |
| Sparse history and trends | Missing records are not zero and do not imply no exercise occurred. Variations do not prove improvement in the mechanics of body movement. |
| Persistent posture episodes versus repetition occurrences | Preserves the different counting methods and the possibility that one repetition appears under multiple criteria. |
| Camera limits | Preserves 2D estimation, occlusion, lack of actual contact detection, spinal-detail limits, and inability to identify weights or load. Shoulder proximity does not become proof of a touch. |
| Left/right and support side | `बाईं` and `दाईं` preserve side direction. Support side and front leg are named separately. |
| Movement direction | Heel/hip elevation, a deeper reverse lunge, elbow extension, and pulling the elbow backward retain the source direction and anatomy. Kickback cues distinguish upper-arm stability from elbow movement. |
| Exercise names and descriptions | Uses familiar Devanagari fitness terms such as `स्क्वाट`, `प्लैंक`, `लंज`, and `डंबल`; descriptions preserve floor/forearm support and no-jump variations. |
| Voice availability | States whether a compatible voice exists, keeps written instructions available, and retains that some voices require internet. |
| Export and deletion | PDF instructions match the translated print/save label. Deletion remains limited to the selected session and the suggestion to export first is retained. |
| Report disclaimer and privacy | Retains automatic app rules, lack of proof of safety or biomechanical improvement, active-time exclusions, and storage only in the originating browser and device. |

## Pending validation

Native Hindi fitness-language review is pending, including exercise-name familiarity, concise spoken cues, anatomical terminology, and the longer report disclaimers. This AI review is not clinical validation.

Actual Hindi audio playback, pronunciation and naturalness review, browser voice availability, rendered Devanagari layout, and Android/iOS device review were not performed in this translation task. Catalog checks do not establish those outcomes.

- A — Catalog structure: verified.
- B — Semantics of the 255 additions: AI-reviewed; native review pending.
- C — TTS integration: owned by the main implementation, not verified here.
- D — Actual audio playback: pending.
- E — Human pronunciation and naturalness review: pending.
