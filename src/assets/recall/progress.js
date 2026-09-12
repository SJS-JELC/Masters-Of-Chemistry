(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RecallProgress = api;
})(globalThis, function () {
  'use strict';
  const KEY = 'sjs-shared-factual-recall-v1', DAY = 86400000, INTERVALS = [1, 3, 7, 14, 30];
  const fresh = () => ({schema: 1, facts: {}, events: []});
  function valid(data) {
    return data && data.schema === 1 && data.facts && !Array.isArray(data.facts) && Array.isArray(data.events) &&
      data.events.every(e => e && typeof e.attemptId === 'string' && Number.isFinite(e.at) && Number.isFinite(e.seconds) && e.seconds >= 0 && typeof e.correct === 'boolean') &&
      Object.values(data.facts).every(f => f && typeof f.version === 'string' && Number.isFinite(f.lastReviewed) && Number.isFinite(f.due) && Number.isInteger(f.stage) && f.stage >= 0 && f.stage <= 5 && Number.isInteger(f.reviews) && f.reviews >= 0 && Number.isInteger(f.successes) && Number.isInteger(f.mistakes));
  }
  function store(storage) {
    let data = fresh(), available = true;
    try { const raw = storage.getItem(KEY); if (raw) { const parsed = JSON.parse(raw); if (!valid(parsed)) throw Error('Invalid progress'); data = parsed; } }
    catch (_) { available = false; }
    return {get data() { return data; }, get available() { return available; }, save() { try { storage.setItem(KEY, JSON.stringify(data)); available = true; } catch (_) { available = false; } }, reload() { try { const parsed = JSON.parse(storage.getItem(KEY)); if (valid(parsed)) data = parsed; } catch (_) {} }};
  }
  const recordFor = (data, q) => data.facts[q.id]?.version === q.version ? data.facts[q.id] : null;
  const day = ms => new Date(ms).toISOString().slice(0, 10);
  function record(data, q, event) {
    if (!event || !Number.isFinite(event.at) || !Number.isFinite(event.seconds) || event.seconds < 0 || typeof event.correct !== 'boolean' || !event.attemptId) throw Error('Invalid recall event');
    if (data.events.some(e => e.attemptId === event.attemptId)) return false;
    let f = recordFor(data, q);
    if (!f) f = {version: q.version, stage: 0, reviews: 0, due: 0, lastReviewed: 0, lastSuccessDay: null, successes: 0, mistakes: 0};
    if (event.correct) {
      f.successes++;
      if (event.at >= f.due && f.lastSuccessDay !== day(event.at)) {
        f.stage = Math.min(INTERVALS.length, f.stage + 1);
        f.lastSuccessDay = day(event.at);
        f.due = event.at + INTERVALS[f.stage - 1] * DAY;
      }
    } else { f.mistakes++; f.stage = 0; f.due = event.at; }
    f.reviews++; f.lastReviewed = event.at; f.lastCorrect = event.correct;
    data.facts[q.id] = f;
    data.events.push({...event, factId: q.id, version: q.version, activity: event.activity || 'rocket-recall'});
    // Aggregates persist indefinitely; retain the latest 2,000 detailed attempts.
    if (data.events.length > 2000) data.events.splice(0, data.events.length - 2000);
    return true;
  }
  function matches(data, q, filter, now) {
    const f = recordFor(data, q);
    if (filter === 'new') return !f;
    if (filter === 'learning') return !!f && f.stage < 3;
    if (filter === 'due') return !!f && f.due <= now;
    if (filter === 'week') return !!f && now - f.lastReviewed >= 7 * DAY;
    if (filter === 'secure') return !!f && f.stage >= 3;
    return true;
  }
  function counts(data, questions, now) { return Object.fromEntries(['all', 'new', 'learning', 'due', 'week', 'secure'].map(k => [k, questions.filter(q => matches(data, q, k, now)).length])); }
  function choose(pool, data, history, now, random = Math.random) {
    if (!pool.length) return null;
    const gap = Math.min(3, pool.length - 1), recent = history.slice(-gap || history.length).map(h => h.id);
    let candidates = pool.filter(q => !recent.includes(q.id));
    if (!candidates.length) candidates = pool;
    // Recall a missed item once three intervening questions have been attempted.
    const pending = history.find(h => !h.correct && !h.revisited && history.length - history.indexOf(h) > gap);
    if (pending) { const q = candidates.find(x => x.id === pending.id); if (q) { pending.revisited = true; return q; } }
    const weighted = candidates.map(q => {
      const f = recordFor(data, q), seen = history.filter(h => h.id === q.id).length;
      return {q, weight: (!f ? 4 : f.due <= now ? 6 : f.stage < 3 ? 3 : 1) / (1 + seen)};
    });
    let ticket = random() * weighted.reduce((s, x) => s + x.weight, 0);
    for (const item of weighted) { ticket -= item.weight; if (ticket <= 0) return item.q; }
    return weighted.at(-1).q;
  }
  return {KEY, DAY, INTERVALS, fresh, valid, store, record, recordFor, matches, counts, choose};
});
