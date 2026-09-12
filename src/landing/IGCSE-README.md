# IGCSE pupil hub

Open `../Masters of IGCSE Chemistry.html`. The maintained website runs directly from the synced site folder without a build step.

The overview has three year boxes: cyan Fourth Form, green Lower Fifth and pink Upper Fifth. Topic names and their gems are centred. The boxes sit side by side on desktop and stack on narrow screens. There is no filter rail. Selecting a gem opens a non-modal details panel centred in the viewport. Close it with its close button, Escape or a click outside. Returning home, including browser Back, closes gem details and expanded recall/statistics panels and clears the selected-gem fragment.

Pupil practice is the default. Only the landing-page eagle switches between pupil practice and teacher question selection. Its colours invert in teacher mode. Activities inherit the mode but their eagles are not switches. Teacher mode hides mastery information and offers question selection and printing. Calorimetry, bond enthalpy, structure and bonding, and energy/enthalpy reuse the calorimetry printer icon through `assets/print-button.js`.

For calorimetry and average bond enthalpies, pupil gem details offer four choices: MASTERY, Grade 5–6, Grade 7–8 and Grade 9. Each opens directly into practice, with no topic or question selection. MASTERY cycles question types until each band meets the weighted mastery threshold; grade choices cycle only that band. Each grade choice shows its own recorded mastery and review date.

Two compact icon-and-heading buttons expand factual recall and overall statistics. Rocket Recall is linked; other planned destinations state their availability in the interface.

## Pupil progress

Mastery uses a recency-weighted average of first-attempt question scores: correct = 1, partial = 0.5, incorrect = 0. The strict threshold is greater than 0.8. Yellow requires Grade 5–6 mastery, green requires both lower bands, and purple requires all three. Other assessed or unassessed topics remain grey until the first band qualifies. Freshness continues to use elapsed review days (fresh through day 7, steady through day 21, then due); it does not change the mastery calculation.

See [MASTERY.md](MASTERY.md) for the formula, central per-activity/per-band half-lives, initial tuning values, scoring conventions, storage format and legacy-data handling. Calorimetry, bond enthalpy and structure/bonding record graded results. Energy/enthalpy has reserved settings but its existing unbanded question bank does not supply grade awards.

Calculation activities resume a separate session for each practice choice and share raw score history between modes. Results stay in this browser. Invalid, duplicate and future records are ignored. There is no account or cross-device synchronisation. Cross-page file-URL storage was checked in Edge; verify deployment on the intended browser/origin.

## Checks

- `node scripts/test_fractal_site.js`
- `node scripts/test_igcse_progress.js`
- `node scripts/test_calorimetry_mastery.js`
- `node scripts/test_numeric_practice.js`
- `node scripts/test_calorimetry_question_generator.js`
- `node scripts/review_igcse_hub.js` (headless Edge)

Screenshots are regenerated under `artifacts/igcse-hub/`. Browser checks cover desktop and narrow layouts, all 64 gems, mode restrictions, clean home returns, calorimetry scoring/resume, and teacher print controls.
