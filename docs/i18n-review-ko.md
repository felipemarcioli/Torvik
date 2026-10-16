# Korean translation review

- Locale: `ko`
- Review date: 2026-10-15
- Review type: AI semantic and structural review; native-speaker approval and audio validation are pending.
- Scope: preserved the existing 699 translations and added 254 missing translations, including all 10 entries in `docs/i18n-export-additions.json` and all 4 entries in `docs/i18n-ui-additions.json`.

Integration note (2026-10-16): the final catalog has 954 entries after one additional UI key. The 953-entry/254-new-value counts below describe this review snapshot; final technical results and the additional critical-voice review are in the implementation report.

## Coverage and automated validation

The Korean resource contains 953 entries, matching all 953 current source entries. The obsolete source key beginning `<!doctype html>` has been removed from the source and is absent from Korean. There are no missing or extra supported keys, empty values, interpolation-token mismatches, Unicode replacement characters, surrogate characters, or non-NFC values. Every value contains Korean text except the legitimate identifiers `torvik`, `A`, `B`, and the existing unit `ms`.

## Semantic review

Reviewed the 254 new translations against the Portuguese source and checked existing Korean terminology for consistency. New labels, help text, accessibility descriptions, exercise instructions, spoken prompts, session comparisons, history summaries, and export copy use Korean wording rather than source-language filler.

- Repetitions, persistent issue episodes, active time, and valid posture time remain distinct. A repetition can have multiple issues; issue counts do not imply that every individual criterion was stored.
- App criteria are translated as `앱 기준` / `기준 충족`. Text retains the limitations that these results do not establish biomechanical improvement or safe execution, and that 2D estimation cannot confirm contact, weight, or spinal details.
- Comparison text retains rule/estimator version differences, unavailable comparisons, percentage-point meaning, and the exclusion of unrecorded days from zero-valued observations.
- Exercise names follow established Korean fitness usage and the existing resource, including 스쿼트, 런지, 플랭크, 덤벨 플로어 프레스, and 마운틴 클라이머. Demonstration descriptions identify the same exercise as the catalog entry.
- Spoken coaching uses short, polite Korean instructions. Left/right direction, joint names, movement direction, and negation remain faithful to the source.
- Count templates keep each original interpolation token and put Korean counters after numeric values. The variable-duration summary avoids a fixed Korean object particle after dynamically formatted durations.
- Export controls, browser printing instructions, session deletion, and local-device storage limitations remain explicit. JSON, CSV, PDF, and the Torvik brand name are retained as identifiers.

## Pending human and device checks

No native-speaker review or listening session was performed. A Korean-speaking reviewer should approve idiomatic fitness terminology, coaching tone, and accessibility descriptions. Device testing should verify Korean voice selection, number/duration pronunciation, pacing during exercise, missing-voice behavior, and the fit of longer Korean text in narrow layouts and PDF output. These are pending checks, not completed approvals.
