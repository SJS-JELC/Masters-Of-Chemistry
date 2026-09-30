(function (root) {
  'use strict';
  const T = root.ActiveQuestionTime;
  const review = new URLSearchParams(location.search).has("review");
  function start(target, id, completed, save, enabled = true) {
    if (!enabled || review) { T.stop(); return; }
    T.start({id, idleLimitMs:180000, saved:target.timing, completed:!!completed,
      onCheckpoint: value => { target.timing = value; save(); }});
  }
  function finish(target) {
    const value = T.finish(); if (value) target.timing = T.snapshot();
    return value;
  }
  const result = target => T.result(target.timing);
  root.IGCSEQuestionTime = Object.freeze({start, finish, result, stop:T.stop, enabled:!review});
})(globalThis);
