(function (root) {
  "use strict";
  // Half-lives count answered questions within this activity and band.
  // Initial tuning values, not calibrated examination-grade boundaries.
  const activities = {
    "calorimetry": { leafId: "lower-10-3", halfLives: { 1: 4, 2: 6, 3: 8 } },
    "bond-enthalpy": { leafId: "lower-10-4", halfLives: { 1: 3, 2: 5, 3: 6 } },
    "structure-and-bonding": { leafId: "lower-6-5", halfLives: { 1: 6, 2: 6, 3: 6 } },
    // Grade 9 is reserved for future content; its half-life remains centrally tunable.
    "energy-enthalpy": { leafId: "lower-10-1", availableGrades: Object.freeze([1, 2]), halfLives: { 1: 6, 2: 8, 3: 10 } }
  };
  for (const activity of Object.values(activities)) {
    Object.freeze(activity.halfLives);
    Object.freeze(activity);
  }
  root.IGCSEMasteryConfig = Object.freeze({ threshold: 0.8, activities: Object.freeze(activities) });
})(globalThis);
