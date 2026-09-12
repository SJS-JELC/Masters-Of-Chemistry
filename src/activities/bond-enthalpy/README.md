# Average bond enthalpy practice

The IGCSE gem offers MASTERY and three fixed grade bands. Pupils enter directly into a question; reaction and question selection remain in teacher mode, reached only through the home-page eagle.

MASTERY cycles the available calculation types, then selects the first band that has not achieved cumulative weighted mastery. Grade 5–6 covers the staged enthalpy-change calculation. Grade 7–8 and Grade 9 each cover enthalpy-change and missing average-bond-enthalpy calculations. Existing reaction eligibility is preserved. Fixed-band practice cycles those types continuously without changing grade. Successive questions of the same type use a different compatible reaction where available. These are practice labels, not independently verified examination-grade boundaries.

The original `data.js` and `core.js` provide the checked chemistry, numerical answers and displayed formulae. `mastery-core.js` chooses existing generator seeds for each task type; review IDs still reproduce the exact questions. The shared scheduler and pupil interface are `../../assets/numeric-mastery.js` and `../../assets/numeric-practice.js`.

Numerical answers are checked automatically. Grade 9 also asks for a drawing on paper: after numerical submission, pupils compare it with the displayed-equation model and report whether it matches. This drawing check is explicitly self-assessed. Scaffold use is retained as metadata; correctness determines the weighted score. A first attempt cannot be upgraded by retrying the same question.

Mastery uses a separate recency-weighted average for each grade: correct = 1, partial = 0.5, incorrect = 0. Hints do not alter the score. Grade 9 drawing confirmation adds a marking point, and the attempt is saved only after confirmation. The threshold is strictly above 0.8; higher gem awards require every preceding band. See [the shared mastery documentation](../../landing/MASTERY.md) for central half-lives, raw history, session handling and preserved legacy data.

Run `node scripts/test_numeric_practice.js`, `node scripts/test_bond_enthalpy_question_generator.js`, `node scripts/test_question_review.js` and `node scripts/review_igcse_hub.js`. Browser screenshots are written to `artifacts/igcse-hub/`. Teacher selection and the shared calorimetry-style print button are retained.
