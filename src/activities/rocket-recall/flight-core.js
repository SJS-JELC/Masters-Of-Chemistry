(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RocketFlight = api;
})(globalThis, function () {
  'use strict';
  // Distances are game units, not a physical model of the atmosphere.
  const CONFIG = Object.freeze({
    quick: 3, medium: 7, allowancePerCharacter: .15, freeCharacters: 12,
    decaySeconds: 2.4, stopBelow: .005, acidSpeed: .13, initialClearance: 5,
    chargeTarget: 40, chargeErrorFactor: .9, errorSpeedFactor: .5,
    levels: [
      {name: 'Laboratory', height: 0, gain: 1, assistance: 1},
      {name: 'Lower atmosphere', height: 40, gain: 1, assistance: 1},
      {name: 'Clouds', height: 33, gain: .9, assistance: .7},
      {name: 'Upper atmosphere', height: 28, gain: .8, assistance: .35},
      {name: 'Edge of space', height: 21, gain: .7, assistance: 0}
    ]
  });
  const ceiling = level => CONFIG.levels.slice(1, level).reduce((sum, l) => sum + l.height, 0);
  function band(seconds, allowance = 0) { return seconds <= CONFIG.quick + allowance ? 3 : seconds <= CONFIG.medium + allowance ? 2 : 1; }
  function create() { return {level: 1, height: 0, acid: -CONFIG.initialClearance, speed: 0, charge: 0, errors: 0, elapsed: 0, questionSeconds: 0, phase: 'active', beforePause: null, correct: 0, incorrect: 0, submitted: false}; }
  function pause(s) { if (['active', 'feedback', 'transition'].includes(s.phase)) { s.beforePause = s.phase; s.phase = 'paused'; } }
  function resume(s) { if (s.phase === 'paused') { s.phase = s.beforePause; s.beforePause = null; } }
  function next(s) { if (['feedback', 'transition'].includes(s.phase)) { s.phase = 'active'; s.questionSeconds = 0; s.submitted = false; } }
  function advance(s, seconds) {
    if (s.phase !== 'active' || !Number.isFinite(seconds) || seconds <= 0) return s;
    // Bounded integration also makes acid collision/level crossing independent of frame rate.
    for (let remaining = seconds; remaining > 1e-8 && s.phase === 'active';) {
      const dt = Math.min(.02, remaining); remaining -= dt;
      s.elapsed += dt; s.questionSeconds += dt;
      if (s.level === 1) continue;
      const decay = Math.exp(-dt / CONFIG.decaySeconds);
      s.height += s.speed * CONFIG.decaySeconds * (1 - decay);
      s.speed *= decay;
      if (s.speed < CONFIG.stopBelow) s.speed = 0;
      s.acid += CONFIG.acidSpeed * dt;
      if (s.acid >= s.height) { s.phase = 'crashed'; s.speed = 0; break; }
      if (s.height >= ceiling(s.level)) {
        if (s.level === 5) { s.phase = 'won'; s.speed = 0; }
        else { s.level++; s.phase = 'transition'; }
      }
    }
    return s;
  }
  function answer(s, correct, allowance = 0) {
    if (s.phase !== 'active' || s.submitted) return null;
    s.submitted = true;
    const multiplier = correct ? band(s.questionSeconds, allowance) : 0;
    if (correct) {
      s.correct++; s.errors = 0;
      const l = CONFIG.levels[s.level - 1];
      if (s.level === 1) {
        s.charge = Math.min(CONFIG.chargeTarget, s.charge + multiplier + l.assistance);
        if (s.charge >= CONFIG.chargeTarget) {
          s.level = 2; s.speed = 1; s.phase = 'transition';
        }
      } else s.speed += (multiplier + l.assistance) * l.gain / CONFIG.decaySeconds;
    } else {
      s.incorrect++;
      if (s.level === 1) s.charge *= CONFIG.chargeErrorFactor;
      else {
        s.errors++; s.speed *= CONFIG.errorSpeedFactor;
        if (s.errors >= 3) { s.speed = 0; s.phase = 'crashed'; }
      }
    }
    if (s.phase === 'active') s.phase = 'feedback';
    return {correct, multiplier, seconds: s.questionSeconds};
  }
  function progress(s) { return s.level === 1 ? s.charge / CONFIG.chargeTarget : Math.max(0, Math.min(1, (s.height - ceiling(s.level - 1)) / CONFIG.levels[s.level - 1].height)); }
  function time(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}.${Math.floor(seconds * 10 % 10)}`; }
  return {CONFIG, create, advance, answer, next, pause, resume, band, progress, ceiling, time};
});
