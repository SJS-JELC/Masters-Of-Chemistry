# Energy & Enthalpy

Maintained IGCSE activity at `index.html`, linked from Energetics > Energy and Enthalpy on the IGCSE map. Open the source page directly or serve the appropriate app’s `src/` with the existing local preview workflow. No installation, external marking service or portable export is required to use the activity.

## Editing and reproduction

- `data.js`: generated bank of 54 original, automatically marked questions (36 written/choice tasks and 18 diagrams). C03, C04, C08, E03, E04 and A06 are retired; other IDs are retained. C08 is saved for a future equilibria activity. Edit prompts, feedback, answer-field wording and button choices in the reviewed Markdown bank; edit accepted answers in `scripts/build_energy_enthalpy.js`, then regenerate.
- `core.js`: whole-field answer normalization and matching, relational diagram grading, local progress, scheduling and mastery rules.
- `app.js`: automatic answer submission, feedback and teacher answer key.
- `editor.js`: directly draggable levels, peak, arrow shafts/endpoints and formula labels, with undo, reset and keyboard/touch alternatives.
- `styles.css`: responsive presentation; reuses the site's Comfortaa Bold font.

The source page recreates all diagrams from the structured metadata on each load. Relative-level numbers are drawing coordinates, not chemical measurements. No RDKit molecule depiction is needed; methane combustion is presented as a balanced text equation.

Run from the workspace root:

```powershell
node scripts/build_energy_enthalpy.js
node --test scripts/test_energy_enthalpy.js
node scripts/check_website.js
node scripts/review_energy_enthalpy.js
```

The browser review uses installed Microsoft Edge and the pinned Playwright dependency in the workspace's root node_modules/. Review captures and results are written to `.scratch/energy-enthalpy-v2/`.

## Question wording and answer controls

The source bank is `development/igcse/plans/igcse-energy-enthalpy-automarked-question-bank.md`. Each written question has an `Answer fields` block containing one bullet per mark and a `_____` gap. An optional `Buttons` suffix lists choices in backticks, for example `more` / `less`. The generator reads these labels and choices and checks that each set has exactly one accepted answer. Fields without choices remain typed recall questions.

C07 uses Yes/No buttons; E01 and E02 link chemical energy levels to the relative energies for breaking and making bonds using More/Less buttons. Other explicit comparisons use the same interaction. Buttons start unselected, allow a single choice per field, support keyboard activation, and lock after checking. Selection alone does not submit the answer. Unknown typed responses can still be rephrased before submission.

The 8 September wording revision uses familiar heat-energy language and feedback explaining energy stored in the chemicals. Grade-band assignments remain to be agreed.

## Supplied reaction data

E09–E18 and D09–D18 introduce ten additional reactions: hydrogen with chlorine; combustion of hydrogen, carbon monoxide, carbon, sulfur and magnesium; nitrogen monoxide formation; carbon with steam; methane with steam; and carbon with carbon dioxide. Each appears once as a short interpretation task and once as a diagram task. Six are exothermic and four endothermic.

The app shows a balanced equation with state symbols and a supplied ΔH beside it. New values are in kJ for the stoichiometric equation as written; pupils interpret the sign, magnitude, stored energy and diagram direction without calculating an enthalpy. Unfamiliar reactions are contexts for interpreting supplied data, not extra reaction-recall or equilibrium requirements.

`development/igcse/data/energy-enthalpy-reactions.json` stores the equations as stoichiometric species records, the selected NIST formation enthalpies, source links and access date. `scripts/energy_enthalpy_reactions.js` checks atom conservation and calculates each reaction enthalpy before the bank can build. The source Markdown equations and ΔH text must match these checked records. Values are rounded to whole kJ at standard reference conditions; they do not specify actual process temperatures or activation energies. The generator emits all data needed by the maintained activity, which remains usable offline.

## Assessment boundaries

Every question is automatically marked. Short-answer fields use reviewed whole-field alternatives; no substring matching or language-model grading. Unrecognized answers can be rephrased without revealing answers or recording an attempt. Hinted questions and Show answer count as practice rather than mastery. Diagram geometry and formula placement earn independent points.

Teacher-agreed bands: Energy and Enthalpy Change (28 C/E/A questions) is Grade 5–6; Reaction Profile Diagrams (18 D questions) and Bond Enthalpies (eight B questions) are Grade 7–8. Grade 9 is unavailable. This assignment is stored on strands and questions by the generator. The map offers mixed mastery and practice in either available band.

First unhinted answers score 1 for all correct, 0.5 for some correct and 0 for none correct. Weighted band mastery uses `apps/Masters-of-IGCSE-Chemistry/src/assets/igcse-mastery-config.js`: half-lives of three questions for Energy and Enthalpy Change (5–6), Reaction Profile Diagrams (7–8) and Bond Enthalpies (7–8), with a strict score above 0.8. Normalisation uses the fixed infinite geometric weight sum, so evidence starts from zero: m = decay * m + (1 - decay) * score. Seven consecutive correct answers exceed the threshold in either available band. Existing raw history is recalculated. The 7–8 gem requires mastery of both bands. The reserved Grade 9 half-life remains configurable but cannot earn a gem. Strand scores are shown for feedback; the previous variety/delay heuristic only helps choose practice questions.

Practice history stays in this browser under `sjs-energy-enthalpy-v2`; new band results use the shared `masters-igcse-results-v2` store and update the map gem. Previous history lacks partial scores and is not converted into band evidence. Reset clears this activity's practice and band results, preserving other activities. Storage failure falls back to the current visit. `node --test scripts/test_energy_grade_browser.js` checks band routing, partial scores, map availability and reset.

Curriculum references and source versions are included in the activity's teacher notes. Full rationale and research are in `development/igcse/plans/igcse-enthalpy-energy-mastery.md` in the development workspace. Scope is IGCSE Chemistry, including Pearson Chemistry-only and Cambridge Supplement points. No calorimetry, practical methods or average bond enthalpy calculations.
