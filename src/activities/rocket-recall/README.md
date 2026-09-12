# Rocket Recall

Five-level, typed-answer IGCSE revision game. Open `index.html` directly, or use
the Rocket Recall link in the homepage's factual-recall panel. No installation
or network connection is required. All runtime assets live inside the appropriate app’s `src/`.

## Content and regeneration

The source is `development/igcse/activities/recall/data/igcse-factual-recall.json` (117 stable fact IDs).
`development/igcse/activities/recall/data/rocket-recall-rules.json` contains reviewed self-contained prompts,
resolutions of the 48 qualified records, additional accepted wording and two
explicit colour-change ordering constraints. The original bank is unchanged.
This is the user's IGCSE recall bank, **not an OCR A Level coverage audit**.
It retains the bank's IGCSE topic/subtopic mapping and source review date.

Run from the workspace root:

```
node scripts/build_rocket_recall.js
node --test scripts/test_rocket_recall.js
node scripts/simulate_rocket_recall.js --save
node scripts/review_rocket_recall.js
node scripts/check_website.js
```

`build_rocket_recall.js --check` checks reproducibility without rewriting data.
The dependency-free browser review uses Chrome by default; set
`ROCKET_REVIEW_BROWSER` to a different Chromium browser executable if needed.
On Windows, browser subprocesses may need to run outside the execution sandbox.
Review profiles are isolated temporary directories; no pupil browser data is used.

## Learning and marking

Objectives: recall each selected fact unaided; supply every required component;
distinguish similar tests, conditions and observations; retain the answer on
subsequent scheduled days. Prerequisite: the selected material has been taught.
Select an appropriate topic rather than treating every fact as prior knowledge.

Every question keeps its full answer contract: single, all, any required number,
or ordered. Each accepted component counts once. Alternative procedures cannot
be mixed with one another's observations. Full charged ion notation is accepted
alongside separately stated formula and charge. Case-sensitive chemical formulae,
charges, units, meaningful qualifiers and contradictory extra words are preserved.
Spaces, articles, some equivalent wording, spelling conventions, subscript digits,
superscript charges and common precipitate notation are normalised explicitly.

The checker uses a reviewed vocabulary, not unrestricted language interpretation.
A chemically valid paraphrase outside those rules may need an additional reviewed
alias. Feedback shows the recognised parts and the model answer. Add new wording
to the rules, include positive and misleading-counterexample tests, then regenerate;
never broaden matching by ignoring unknown or negative words wholesale.

## Flight tuning

`flight-core.js` owns all numerical tuning. Height and speed are abstract game units,
not a physical claim about rockets, atmosphere layers or the behaviour of acid.
The laboratory requires 40 charge units. Correct charge = speed-band multiplier + 1;
a wrong answer retains 90% of charge. Ten quick or twenty slow correct answers launch.

After launch, every correct answer adds `(multiplier + assistance) * gain / 2.4`
to speed. Speed decays exponentially with a 2.4-second time constant and becomes
exactly zero below 0.005 units/s. Flight integration uses steps of at most 0.02s.
Acid rises at 0.13 units/s from five units below the pad. Transitions preserve
positions and remaining momentum. Each successive flight level reduces both gain
and assistance. Its height defines the crossing, not an answer-count requirement.

Short-answer bands are 3s / 7s. Both thresholds receive 0.15s per character beyond
12 in the shortest complete reviewed answer, including minimal part separators.
For `any` questions the shortest required distinct parts are used; a combined
charged formula is considered when computing ion-answer length. The threshold
display always shows the actual allowance for that question.

One and two consecutive incorrect answers halve speed. Three trigger terminal
engine failure and the visual crash. Correct recall resets the streak. The
laboratory is exempt. No boost is awarded for a partially correct answer.

Correct feedback pauses for 650ms, then continues. Incorrect feedback waits for
the learner. All feedback, transitions and pauses freeze flight, elapsed time and
answer timing. A question interrupted by a level crossing retains its draft and
active response time. Hiding the browser tab pauses automatically. Pausing hides
the question, and resuming requires an explicit action.

Clean deterministic runs at 2s, 5s and 9s are retained in
`development/igcse/activities/recall/validation/flight-simulations.json`. Counts depend on timing and
carried thrust; the benchmarks are ten quick / fifteen medium in the final level,
roughly ten quick / twenty slow early on. Deliberately unlimited thinking time
does not mean unlimited survival after launch.

## Shared recall service

Reusable modules are in `apps/Masters-of-IGCSE-Chemistry/src/assets/recall/`:

- `igcse-data.js`: generated bank, stable fact IDs and content/marking version hashes.
- `marking.js`: `RecallMarking.mark(question, response)` returns complete correctness,
  recognised count, missing parts, ordering and unmatched text feedback.
- `progress.js`: `RecallProgress.store(storage)`, `record(data, question, event)`,
  `matches`, `counts` and `choose`. Future recall activities should reuse these.

Events require unique `attemptId`, Unix-millisecond `at`, non-negative active
`seconds`, boolean `correct`, and an `activity` name. Only the first submitted
attempt per question presentation is recorded. Unanswered questions and game
failure do not record a failed recall. Detailed history retains 2,000 recent events;
per-fact aggregates persist. The key is `sjs-shared-factual-recall-v1`.

First correct recall schedules tomorrow; successful due reviews advance through
1, 3, 7, 14 and 30 days. Separate days use UTC dates consistently. A third successful
due review on a separate day makes a fact secure. An incorrect answer resets the
stage to still learning and due now; repeating successfully the same day does not
advance that day's schedule again. Changed content versions become new for review.

Question pools are fixed at run start, so earning progress cannot unexpectedly
empty the run. Due facts and weaker facts are prioritised. A missed fact returns
after at least three intervening questions when the pool has four or more facts;
smaller pools use the largest feasible gap.

Storage is browser-local, not an account or cloud sync. Activities served from the
same origin share this store. Browsers may isolate `file://` storage by file path:
direct-file play works, but cross-activity sharing is only guaranteed when served
from the same origin. Future offline modes requiring shared progress should use
one common activity host page. No migration of existing calculation/grade mastery
has been attempted; those records measure different things. Storage failures show
an explicit session-only notice while allowing play to continue.

## Artwork

The original generated rocket and panorama have provenance and prompts in
`assets/README.md`. All interface elements remain HTML/CSS; the game is keyboard
operable and supports reduced motion. The panorama scrolls continuously normally
and switches by level with reduced motion. No audio, network service or paid assets.
