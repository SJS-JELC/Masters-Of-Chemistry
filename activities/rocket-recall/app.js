(function () {
  'use strict';
  const F = RocketFlight, P = RecallProgress, M = RecallMarking, bank = IGCSERecall.facts;
  const reviewBank=QuestionReview.bank('RR',bank);
  const $ = id => document.getElementById(id);
  let storage; try { storage = window.localStorage; } catch (_) { storage = null; }
  const saved = P.store(storage);
  let state = null, question = null, pool = [], history = [], runId = '', attempt = 0, lastFrame = performance.now(), feedbackUntil = null, transitionKeepsQuestion = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function saveStatus() { $('saveStatus').textContent = saved.available ? 'Recall progress saved in this browser. Use the same site address across activities.' : 'Progress cannot be saved here. You can still play; this session’s progress stays until you close the page.'; }
  function subset() { return bank.filter(q => ($('topic').value === 'all' || q.topic.number === Number($('topic').value)) && ($('subtopic').value === 'all' || q.subtopic.id === $('subtopic').value)); }
  function stat(container, entries) { $(container).replaceChildren(...entries.map(([value, label]) => { const el = document.createElement('div'), strong = document.createElement('strong'), span = document.createElement('span'); strong.textContent = value; span.textContent = label; el.append(strong, span); return el; })); }
  function updateSetup() {
    const questions = subset(), counts = P.counts(saved.data, questions, Date.now());
    stat('masterySummary', [[counts.new, 'new'], [counts.learning, 'still learning'], [counts.secure, 'secure']]);
    for (const option of $('filter').options) { option.textContent = `${{all:'All facts',new:'New',learning:'Still learning',due:'Due for review',week:'Not reviewed for 7 days',secure:'Secure'}[option.value]} · ${counts[option.value]}`; }
    const count = counts[$('filter').value];
    $('poolCount').textContent = `${count} whole questions selected${count < 4 && count ? ' · small sets repeat more often' : ''}`;
    $('start').disabled = !count;
    $('setupError').textContent = count ? '' : 'No facts in this set yet. Choose another revision set or topic.';
    saveStatus();
  }
  function topics() {
    for (const topic of IGCSERecall.topics.filter(t => bank.some(q => q.topic.number === t.number))) $('topic').add(new Option(topic.name, topic.number));
    $('topic').addEventListener('change', () => {
      $('subtopic').replaceChildren(new Option('All subtopics', 'all'));
      const seen = new Set();
      for (const q of bank) if (($('topic').value === 'all' || q.topic.number === Number($('topic').value)) && !seen.has(q.subtopic.id)) { seen.add(q.subtopic.id); $('subtopic').add(new Option(`${q.subtopic.id} · ${q.subtopic.name}`, q.subtopic.id)); }
      updateSetup();
    });
    $('topic').dispatchEvent(new Event('change'));
    $('subtopic').onchange = updateSetup; $('filter').onchange = updateSetup;
  }
  function setQuestion() {
    question = P.choose(pool, saved.data, history, Date.now()); attempt++;
    QuestionReview.mount($('questionArea'),reviewBank.id(question),loadReview);
    $('question').textContent = question.question;
    $('questionTopic').textContent = `${question.topic.name} / ${question.subtopic.name}`;
    $('questionNumber').textContent = `Q${attempt}`;
    $('answer').value = ''; $('answer').disabled = false; $('submit').disabled = false;
    $('answerError').textContent = ''; $('feedback').hidden = true; $('questionArea').classList.remove('reviewing');
    $('timingNote').textContent = `3× within ${(3 + question.allowance).toFixed(1)}s · 2× within ${(7 + question.allowance).toFixed(1)}s · 1× after that. No expiry.`;
    $('answer').focus({preventScroll: true});
  }
  function start(event) {
    event.preventDefault(); saved.reload();
    pool = subset().filter(q => P.matches(saved.data, q, $('filter').value, Date.now()));
    if (!pool.length) { updateSetup(); return; }
    state = F.create(); history = []; attempt = 0; runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`; feedbackUntil = null;
    $('setup').hidden = true; $('results').hidden = true; $('playing').hidden = false; $('questionArea').hidden = false; $('interlude').hidden = true;
    $('sceneMessage').hidden = true; $('scene').classList.remove('crashed', 'won');
    lastFrame = performance.now(); setQuestion(); render();
  }
  function examples(q, container) {
    container.replaceChildren();
    for (const [i, set] of q.sets.entries()) {
      const box = document.createElement('div'); box.className = 'answer-example';
      const label = document.createElement('b'); label.textContent = q.sets.length > 1 ? `Complete method ${i + 1}` : set.mode === 'any' ? `Any ${set.required} distinct parts` : 'Reviewed answer';
      const list = document.createElement(set.mode === 'ordered' ? 'ol' : 'ul');
      for (const part of set.parts) { const li = document.createElement('li'); li.textContent = part.accepted[0]; list.append(li); }
      box.append(label, list); container.append(box);
    }
    if (q.note) { const p = document.createElement('p'); p.className = 'note'; p.textContent = q.note; container.append(p); }
  }
  function submit(event) {
    event.preventDefault(); if (!state || state.phase !== 'active' || state.submitted) return;
    tickNow(); if (state.phase !== 'active') return;
    const result = M.mark(question, $('answer').value);
    if (result.empty) { $('answerError').textContent = result.message; return; }
    const shot = F.answer(state, result.correct, question.allowance);
    if (!shot) return;
    saved.reload();
    P.record(saved.data, question, {attemptId: `${runId}:${attempt}`, at: Date.now(), seconds: shot.seconds, correct: result.correct, activity: 'rocket-recall'});
    saved.save(); saveStatus();
    history.push({id: question.id, correct: result.correct, seconds: shot.seconds});
    $('answer').disabled = true; $('submit').disabled = true; $('answerError').textContent = '';
    $('feedback').hidden = false; $('feedback').classList.toggle('good', result.correct);
    $('feedbackTitle').textContent = result.correct ? `${shot.multiplier}× boost!` : state.level === 1 ? 'Charge reduced — keep going.' : 'Thrust lost — review and recover.';
    $('feedbackText').textContent = result.message;
    $('submittedAnswer').textContent = result.correct ? '' : `You wrote: ${$('answer').value}`;
    $('questionArea').classList.toggle('reviewing', !result.correct);
    $('modelAnswers').replaceChildren();
    if (!result.correct) examples(question, $('modelAnswers'));
    $('continue').hidden = result.correct;
    if (state.phase === 'crashed') finish();
    else if (state.phase === 'transition') showTransition(false);
    else if (result.correct) feedbackUntil = performance.now() + 650;
    else { $('continue').focus({preventScroll: true}); requestAnimationFrame(() => $('feedback').scrollIntoView({block:'nearest',behavior:'instant'})); }
    render();
  }
  function continueQuestion() {
    if (!state || state.phase !== 'feedback') return;
    feedbackUntil = null; F.next(state); setQuestion(); lastFrame = performance.now(); render();
  }
  function showTransition(keep) {
    transitionKeepsQuestion = keep; feedbackUntil = null;
    $('questionArea').hidden = true; $('interlude').hidden = false;
    $('interludeKicker').textContent = `LEVEL ${state.level} / 5`;
    $('interludeTitle').textContent = state.level === 2 ? 'Ready for lift-off.' : F.CONFIG.levels[state.level - 1].name;
    $('interludeText').textContent = state.level === 2 ? 'The roof is open. Acid will rise as soon as you launch. Three wrong answers in a row now cut the engine.' : 'The acid keeps its pace. Your boosts are less powerful here. Keep your momentum.';
    $('resume').textContent = state.level === 2 ? 'Launch rocket ↑' : 'Keep climbing ↑';
    $('resume').focus({preventScroll: true});
  }
  function pause() {
    if (!state || !['active','feedback','transition'].includes(state.phase)) return;
    tickNow(); if (!['active','feedback','transition'].includes(state.phase)) return;
    F.pause(state); feedbackUntil = null;
    $('questionArea').hidden = true; $('interlude').hidden = false;
    $('interludeKicker').textContent = 'FLIGHT PAUSED'; $('interludeTitle').textContent = 'Take a breath.';
    $('interludeText').textContent = 'Your rocket, the acid and all timers are paused.'; $('resume').textContent = 'Resume flight →';
    render(); $('resume').focus({preventScroll: true});
  }
  function resume() {
    if (!state) return;
    if (state.phase === 'paused') {
      F.resume(state);
      if (state.phase === 'transition') { showTransition(transitionKeepsQuestion); render(); return; }
      if (state.phase === 'feedback' && $('continue').hidden) feedbackUntil = performance.now() + 650;
    } else if (state.phase === 'transition') {
      const questionSeconds = state.questionSeconds;
      F.next(state);
      if (transitionKeepsQuestion) state.questionSeconds = questionSeconds;
      else setQuestion();
    } else return;
    $('interlude').hidden = true; $('questionArea').hidden = false; lastFrame = performance.now();
    if (state.phase === 'active') $('answer').focus({preventScroll:true}); else $('continue').focus({preventScroll:true});
    render();
  }
  function finish(ended = false) {
    feedbackUntil = null;
    if (ended) state.phase = 'ended';
    $('playing').hidden = true; $('results').hidden = false;
    const won = state.phase === 'won';
    $('scene').classList.toggle('won', won); $('scene').classList.toggle('crashed', state.phase === 'crashed');
    $('resultKicker').textContent = won ? 'MISSION COMPLETE' : ended ? 'MISSION ENDED' : 'MISSION REPORT';
    $('resultTitle').textContent = won ? 'You reached space.' : ended ? 'Progress saved.' : state.errors >= 3 ? 'Engine cut. Rocket lost.' : 'The acid caught up.';
    $('resultTime').textContent = F.time(state.elapsed);
    $('resultDetail').textContent = `Level ${state.level} / 5 · ${Math.round(state.height)} flight units climbed · ${state.correct} correct answers. ${won ? 'Your time to space.' : 'Your recall progress stays with you.'}`;
    const attempted = [...new Set(history.map(h => h.id))].map(id => bank.find(q => q.id === id));
    const counts = P.counts(saved.data, attempted, Date.now());
    stat('runSummary', [[attempted.length, 'facts practised'], [counts.secure, 'secure'], [counts.learning, 'still learning']]);
    $('reviewList').replaceChildren();
    const missed = [...new Set(history.filter(h => !h.correct).map(h => h.id))];
    const toReview = missed.length ? missed : attempted.filter(q => !P.matches(saved.data, q, 'secure', Date.now())).slice(0, 5).map(q => q.id);
    for (const id of toReview) {
      const q = bank.find(q => q.id === id), li = document.createElement('li'); li.textContent = `${reviewBank.id(q)} · ${q.question}`;
      const answer = document.createElement('small'); answer.textContent = q.examples[0]; li.append(answer); $('reviewList').append(li);
    }
    if (!toReview.length) { const li = document.createElement('li'); li.textContent = 'No missed facts. Come back for your next scheduled review.'; $('reviewList').append(li); }
    render(); $('resultTitle').focus({preventScroll:true});
  }
  function tickNow() {
    const now = performance.now(), seconds = Math.max(0, (now - lastFrame) / 1000); lastFrame = now;
    if (!state) return;
    const before = state.phase; F.advance(state, seconds);
    if (before === 'active' && state.phase === 'transition') showTransition(!state.submitted);
    if (before === 'active' && ['won','crashed'].includes(state.phase)) finish();
  }
  function render() {
    const s = state || F.create(), progress = F.progress(s), clearance = Math.max(0, s.height - s.acid);
    $('sceneEyebrow').textContent = `MISSION ${String(s.level).padStart(2,'0')} / 05`;
    $('sceneTitle').textContent = F.CONFIG.levels[s.level - 1].name;
    $('elapsed').textContent = F.time(s.elapsed); $('speed').textContent = s.speed.toFixed(1);
    $('clearance').textContent = s.level === 1 ? 'Safe' : clearance.toFixed(1); $('clearanceUnit').textContent = s.level === 1 ? 'charging' : 'flight units';
    $('errors').textContent = `${s.errors} / 3`; $('errors').style.color = s.errors ? 'var(--yellow)' : 'var(--ink)';
    $('errorHint').textContent = s.level === 1 ? 'safe in the lab' : s.errors === 2 ? 'next error is fatal' : 'correct = reset';
    $('stageLabel').textContent = s.level === 1 ? 'Launch charge' : s.phase === 'won' ? 'Space reached' : 'Level progress';
    $('stagePercent').textContent = `${Math.min(100,Math.floor(progress * 100))}%`; $('stageProgress').value = progress * 100;
    $('flightStatus').textContent = s.phase === 'won' ? 'IN SPACE' : s.phase === 'crashed' ? 'SIGNAL LOST' : s.phase === 'paused' ? 'PAUSED' : s.level === 1 ? 'ON THE PAD' : s.speed < .05 ? 'NO THRUST' : 'ASCENDING';
    $('acidWarning').textContent = s.level === 1 ? 'Safe on the pad. Mistakes only delay launch.' : s.phase === 'crashed' ? 'Rocket lost. Your recall progress is safe.' : s.phase === 'won' ? 'Clear of the atmosphere. Mission complete.' : clearance < 4 ? 'ACID CLOSE — a correct answer restores thrust.' : 'Acid rising at a constant rate. Keep climbing.';
    $('scene').classList.toggle('flying', s.level > 1); $('scene').classList.toggle('paused', s.phase !== 'active'); $('scene').classList.toggle('danger', s.level > 1 && clearance < 4);
    const journey = Math.min(1, s.height / F.ceiling(5));
    $('panorama').style.backgroundPositionY = `${100 - (reduced.matches ? (s.level - 1) / 4 : journey) * 100}%`;
    $('acid').style.top = s.level === 1 || s.phase === 'won' ? '110%' : s.phase === 'crashed' ? '62%' : `${Math.min(103, 60 + clearance * 2.8)}%`;
    $('exhaust').style.opacity = s.level > 1 && s.phase === 'active' ? Math.min(1, s.speed * .8) : 0;
    for (const li of $('levelRail').children) li.classList.toggle('current', Number(li.dataset.level) === s.level);
    if (question) { const b = F.band(s.questionSeconds, question.allowance); $('boostNow').textContent = `${b}× boost available`; $('boostNow').style.color = b === 3 ? 'var(--cyan)' : b === 2 ? 'var(--mint)' : 'var(--yellow)'; }
  }
  function frame() { tickNow(); if (state?.phase === 'feedback' && feedbackUntil && performance.now() >= feedbackUntil) continueQuestion(); render(); requestAnimationFrame(frame); }
  $('setupForm').onsubmit = start; $('answerForm').onsubmit = submit;
  $('answer').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('answerForm').requestSubmit(); } };
  $('continue').onclick = continueQuestion; $('pause').onclick = pause; $('resume').onclick = resume;
  $('endRun').onclick = () => finish(true);
  $('again').onclick = () => { state = null; question = null; $('results').hidden = true; $('setup').hidden = false; $('sceneMessage').hidden = false; $('scene').classList.remove('won','crashed'); saved.reload(); updateSetup(); render(); $('start').focus(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); lastFrame = performance.now(); });
  window.addEventListener('storage', e => { if (e.key === P.KEY) { saved.reload(); if (!state) updateSetup(); } });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') { if (state?.phase === 'paused') resume(); else pause(); } });
  function loadReview(id){
    const q=reviewBank.get(id);pause();
    let board=$('reviewBoard');
    if(!board){board=document.createElement('section');board.id='reviewBoard';board.className='panel';document.querySelector('.flight-deck').prepend(board);}
    document.querySelector('.flight-deck').classList.add('review-flight');
    document.querySelector('.control-panel').hidden=true;
    for(const name of ['scene','playing','setup','results'])$(name).hidden=true;
    board.replaceChildren();QuestionReview.mount(board,reviewBank.id(q),loadReview);
    const prompt=document.createElement('h2');prompt.textContent=q.question;board.append(prompt);
    const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Checked answer';details.append(summary);
    const answers=document.createElement('div');examples(q,answers);details.append(answers);board.append(details);
    board.scrollIntoView({block:'start'});
  }
  topics(); updateSetup(); requestAnimationFrame(frame);
  QuestionReview.launcher($('setup'),loadReview);
  QuestionReview.requested(loadReview);
})();
