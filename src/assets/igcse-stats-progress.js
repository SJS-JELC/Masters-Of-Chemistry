(function (root) {
  'use strict';
  const P = root.MastersProgress, source = root.IGCSEMasteryConfig;
  const config = Object.freeze(Object.fromEntries(Object.values(source.activities).map(setting => [setting.leafId,
    Object.freeze({...setting, progressionVersion: 1, availableGrades: setting.availableGrades || [1,2,3], levelLabels: P.bands})])));
  // Adapt at the read boundary. Stored grade records and mastery recurrence stay intact.
  const clean = (items, now = Date.now()) => P.clean(items, now).map(item => ({...item, level: item.grade}));
  root.IGCSEStatsProgress = Object.freeze({key: P.key, bands: P.bands, config, threshold: source.threshold,
    weightedScore: P.weightedScore, bar: P.masteryBar, clean, history: () => clean(P.read(localStorage))});
})(globalThis);
