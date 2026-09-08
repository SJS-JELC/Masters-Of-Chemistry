(function (root) {
  "use strict";
  const key = "masters-igcse-results-v2";
  const bands = { 1: "Grade 5–6", 2: "Grade 7–8", 3: "Grade 9" };
  const config = root.IGCSEMasteryConfig;
  const settings = leafId => Object.values(config.activities).find(activity => activity.leafId === leafId);
  function valid(item, now) {
    return item && typeof item.id === "string" && item.id.length > 0 &&
      settings(item.leafId) && (settings(item.leafId).availableGrades || [1, 2, 3]).includes(item.grade) &&
      [0, 0.5, 1].includes(item.score) && Number.isFinite(item.completedAt) &&
      item.completedAt > 0 && item.completedAt <= now;
  }
  function clean(records, now) {
    if (!Array.isArray(records)) return [];
    const seen = new Set();
    return records.filter(item => {
      if (!valid(item, now) || seen.has(item.id)) return false;
      seen.add(item.id); return true;
    }).sort((a, b) => a.completedAt - b.completedAt);
  }
  function read(storage, now = Date.now()) {
    try {
      return clean(JSON.parse(storage.getItem(key) || "[]"), now);
    } catch (_) { return []; }
  }
  function merge(first, second, now = Date.now()) { return clean([...first, ...second], now); }
  // Scores are oldest first; recency 1 is the final (most recent) question.
  function weightedScore(scores, halfLife) {
    if (!Number.isFinite(halfLife) || halfLife <= 0) throw Error("Half-life must be positive.");
    if (!scores.every(score => [0, 0.5, 1].includes(score))) throw Error("Invalid question score.");
    if (!scores.length) return null;
    let numerator = 0, denominator = 0;
    for (let recency = 1; recency <= scores.length; recency++) {
      const weight = 2 ** (-(recency - 1) / halfLife);
      numerator += scores[scores.length - recency] * weight;
      denominator += weight;
    }
    return numerator / denominator;
  }
  function questionScore(correct) {
    if (!correct.length || !correct.every(value => typeof value === "boolean")) throw Error("Marking points must be booleans.");
    return correct.every(Boolean) ? 1 : correct.some(Boolean) ? 0.5 : 0;
  }
  function summarise(records, leafId, grade, now = Date.now()) {
    const matches = clean(records, now).filter(item => item.leafId === leafId && item.grade === Number(grade));
    const latest = matches[matches.length - 1];
    if (!latest) return { score: null, mastery: null, mastered: false, freshness: "unreviewed", days: null, count: 0 };
    const score = weightedScore(matches.map(item => item.score), settings(leafId).halfLives[grade]);
    const days = Math.max(0, Math.floor((now - latest.completedAt) / 86400000));
    return { score, mastery: score * 100, mastered: score > config.threshold, freshness: days <= 7 ? "fresh" : days <= 21 ? "steady" : "due", days, count: matches.length };
  }
  function achievement(records, leafId, now = Date.now()) {
    const states = [1, 2, 3].map(grade => ({ ...summarise(records, leafId, grade, now), grade }));
    let grade = 0;
    for (const state of states) { if (!state.mastered) break; grade = state.grade; }
    const state = grade ? states[grade - 1] : states.find(item => item.mastery !== null) || states[0];
    return { ...state, achievedGrade: grade, states };
  }
  // Never overwrite an existing first attempt.
  function append(records, item, now = Date.now()) {
    const existing = clean(records, now);
    if (!valid(item, now)) throw Error("Invalid mastery result.");
    if (!existing.some(record => record.id === item.id)) existing.push(item);
    return clean(existing, now);
  }
  root.MastersProgress = Object.freeze({ key, bands, read, summarise, achievement, weightedScore, questionScore, append, merge });
})(globalThis);
