# IGCSE mastery scoring

Edit `../assets/igcse-mastery-config.js` to tune the common threshold and each activity's three half-lives. Grade keys `1`, `2`, `3` mean Grade 5–6, Grade 7–8 and Grade 9. Every activity in `catalog.js` must have all three entries; `scripts/test_igcse_progress.js` checks coverage.

Initial half-lives, in answered questions:

| Activity | Grade 5–6 | Grade 7–8 | Grade 9 |
| --- | ---: | ---: | ---: |
| Calorimetry | 4 | 6 | 8 |
| Bond enthalpy | 3 | 5 | 6 |
| Structure and bonding | 6 | 6 | 6 |
| Energy and enthalpy (reserved) | 6 | 8 | 10 |

These are provisional tuning choices. Calorimetry starts with four calculation types and adds information routes at higher levels. Bond enthalpy has fewer calculation types, with reaction variation and an additional unknown-bond type above the first level. Structure and bonding reuses its comparison bank with different response support. Energy and enthalpy currently has no grade mapping: its entries are reserved, and its existing unbanded strand checks do not award graded gems.

For each activity and band independently:

```
weight = 2 ** (-(recency - 1) / half_life)
mastery_score = sum(score * weight) / sum(weight)
```

The most recent completed question has recency 1, the previous question recency 2. Intervening answers in other bands or activities do not count. Calendar time only changes the existing freshness effect, not the mastery score. Equal completion timestamps retain insertion order.

Every completed first attempt contributes one score: 1 if all marking points are correct, 0.5 if some are correct, and 0 if none are correct. Hints do not alter this correctness score. Rechecking the same attempt does not replace it or add evidence. Incomplete submissions do not count. Grade 9 bond-enthalpy drawing confirmation is one additional marking point; the result is saved only after confirmation. Structure and bonding uses automatic table checks at Grade 5–6 and completed, evidence-linked self-assessment at the higher bands.

The threshold is strictly greater than 0.8, evaluated before rounding percentages. Yellow requires Grade 5–6; green requires both Grade 5–6 and Grade 7–8; purple requires all three. No qualifying first band means a grey gem, even with a high score at Grade 9. A later weak result can reduce an award. No evidence is unassessed. There is no minimum question count or prior: one correct first attempt produces a score of 1, as specified by the formula.

The calculation MASTERY mode cycles question types, then selects the first band that has not achieved cumulative mastery. It completes only when all three bands qualify. Fixed-band practice keeps cycling its selected band. Session scheduling and independent-answer metadata are separate from the weighted score.

Raw results live in browser storage under `masters-igcse-results-v2`, as `{ id, leafId, grade, score, completedAt }` with optional provenance fields. `progress.js` validates, deduplicates, sorts and recalculates these results on read. Changing configuration therefore applies to existing history. Failed storage writes retain evidence in the current activity tab and show a warning.

Legacy `masters-igcse-results-v1` aggregate percentages and `*-evidence-v1` type flags are preserved but not used: they cannot reconstruct correct/partial/incorrect question histories. Previously submitted questions in resumed sessions are not retrospectively scored. New attempts build the new history. Existing session storage keys are retained.

Verification:

```
node --test scripts/test_igcse_progress.js scripts/test_numeric_practice.js scripts/test_calorimetry_mastery.js scripts/test_fractal_site.js
node --test scripts/review_igcse_hub.js
```

Browser review images are written to `artifacts/igcse-hub/`. Tests cover formula values, recency, retuning, exact threshold boundaries, missing prerequisite bands, award reduction, first-attempt persistence, partial numeric scoring, drawing confirmation, all three structure/bonding levels, desktop/mobile layouts and teacher controls.
