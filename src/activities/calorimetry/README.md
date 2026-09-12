# Calorimetry practice and question selection

The IGCSE gem pop-out offers MASTERY, Grade 5–6, Grade 7–8 and Grade 9. Each opens directly into a question; pupils have no calculation-family or question-selection screen. Only the home-page eagle switches to teacher mode, where the original detailed controls and printing remain available.

## Practice flow

`?mode=pupil&practice=mastery` starts (or resumes) all four calculation types: solution heat, combustion heat, solution molar enthalpy and combustion molar enthalpy. The first round covers one of each at Grade 5–6. At the end of each round, weighted scores select the first band that has not achieved cumulative mastery. A completed session can be practised again by reopening MASTERY.

`?mode=pupil&practice=grade&grade=1`, `2` or `3` cycles all four types continuously within the chosen band. It never advances to another band. Reopening a mode automatically resumes its unfinished question.

The three labels describe practice bands, not verified examination-grade boundaries. The existing chemistry and answer calculations in `data.js` and `core.js` are unchanged. `mastery-core.js` adapts them to the shared `assets/numeric-mastery.js` scheduler; `mastery-ui.js` connects the existing renderer to `assets/numeric-practice.js`.

## Weighted mastery records

First attempts score 1 for all correct, 0.5 for some correct, and 0 for none correct. Hints do not change the score; rechecking cannot replace the first attempt. Each band's recency-weighted average uses its configured half-life, with a strict threshold above 0.8. Higher gem awards also require all preceding bands.

See [the shared mastery documentation](../../landing/MASTERY.md) for configuration, raw-result storage, legacy-data handling and tuning. Existing all-band and fixed-band session keys still resume unfinished questions; new raw question scores are shared in `masters-igcse-results-v2`.

## Verification

- `node scripts/test_numeric_practice.js`: all-type rounds, weighted progression, fixed-band cycles, persistence and reproducible review IDs for both calculation activities.
- `node scripts/test_calorimetry_mastery.js`: deterministic numerical marking and progression.
- `node scripts/test_calorimetry_question_generator.js`: existing chemical calculations.
- `node scripts/review_igcse_hub.js`: browser modes, independent records, resume, direct entry, teacher printing and responsive layouts.

Use maintained website source pages; portable builds are not part of this workflow.
