(async function () {
  'use strict';
  var bridge = globalThis.TestModeBridge;
  var test = (await (bridge && bridge.connect ? bridge.connect() : Promise.resolve(null))) || null;
  var bank = window.PRACTICAL_BANK || { title: 'Energetics practical work', questions: [] };
  var questions = Array.isArray(bank.questions) ? bank.questions : [];
  var core = window.PracticalCore;
  var diagrams = window.PracticalDiagrams;
  var progressModel = globalThis.MastersProgress;
  var settings = globalThis.IGCSEMasteryConfig && globalThis.IGCSEMasteryConfig.activities && globalThis.IGCSEMasteryConfig.activities['energetics-practical'];
  var params = new URLSearchParams(location.search);
  var requestedGrade = Number(test && test.level || params.get('grade'));
  var requestedBand = requestedGrade === 2 ? '7-8' : requestedGrade === 3 ? '9' : '';
  var teacher = !test && globalThis.ChemistryMode && globalThis.ChemistryMode.get() === 'teacher';
  var storeKey = 'energetics-practical-' + bank.version + (teacher ? '-teacher' : '-pupil');
  var state = { level: requestedBand || 'all', currentId: questions[0] && questions[0].id, review: false, responses: {}, checked: {} };
  var masteryRecords = [];
  var testCompleted = false;
  var completedAt = null;
  var els = {};

  function $(id) { return document.getElementById(id); }
  function text(value) { return String(value == null ? '' : value); }
  function make(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }
  function append(parent) { Array.prototype.slice.call(arguments, 1).forEach(function (child) { if (child) parent.appendChild(child); }); return parent; }
  function currentQuestion() { return questions.find(function (q) { return String(q.id) === String(state.currentId); }); }
  function visibleQuestions() { return questions.filter(function (q) { return state.level === 'all' || String(q.band) === state.level; }); }
  function hash(value) { var n = 2166136261; String(value).split('').forEach(function (character) { n ^= character.charCodeAt(0); n = Math.imul(n, 16777619); }); return n >>> 0; }
  function testQuestion(snapshot) {
    var pool = questions.filter(function (q) { return !requestedBand || String(q.band) === requestedBand; });
    var restored = pool.find(function (q) { return q.id === snapshot || q.id === (snapshot && snapshot.questionId); });
    if (restored) return restored;
    if (pool.length > 1 && test && test.previous && test.previous.questionId) pool = pool.filter(function (q) { return q.id !== test.previous.questionId; });
    return pool[hash(test && test.attemptId || Date.now()) % Math.max(1, pool.length)];
  }
  function blankResponse(question, previous) {
    var fields = {};
    (question.fields || []).forEach(function (field) { fields[String(field.id)] = field.multiselect ? [] : ''; });
    return { fields: fields, selectedId: '', errorId: '', overrides: [], hinted: Boolean(previous && previous.hinted), recorded: Boolean(previous && previous.recorded), firstScore: previous && previous.firstScore != null ? previous.firstScore : null, attemptId: previous && previous.attemptId || (test ? test.attemptId : crypto.randomUUID()), firstResult: previous && previous.firstResult || null };
  }
  function responseFor(question) {
    var id = String(question.id);
    if (!state.responses[id]) state.responses[id] = blankResponse(question);
    var response = state.responses[id];
    response.fields = response.fields && typeof response.fields === 'object' ? response.fields : {};
    (question.fields || []).forEach(function (field) {
      var id = String(field.id);
      if (response.fields[id] == null) response.fields[id] = field.multiselect ? [] : '';
      if (field.multiselect && !Array.isArray(response.fields[id])) response.fields[id] = response.fields[id] ? [String(response.fields[id])] : [];
    });
    if (!response.attemptId) response.attemptId = test ? test.attemptId : crypto.randomUUID();
    if (!Array.isArray(response.overrides)) response.overrides = [];
    return response;
  }
  function readSaved() {
    if (test) return;
    try {
      var raw = window.localStorage.getItem(storeKey);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;
      if (saved.responses && typeof saved.responses === 'object') state.responses = saved.responses;
      if (saved.checked && typeof saved.checked === 'object') state.checked = saved.checked;
      state.review = saved.review === true;
      if (saved.currentId != null && questions.some(function (q) { return String(q.id) === String(saved.currentId); })) state.currentId = saved.currentId;
      if (saved.level === 'all' || saved.level === '7-8' || saved.level === '9') state.level = saved.level;
    } catch (_) { /* Private browsing and file:// storage are allowed to fail. */ }
  }
  function save() {
    if (test) { if (currentQuestion()) bridge.save(snapshot()); return; }
    try { window.localStorage.setItem(storeKey, JSON.stringify({ responses: state.responses, checked: state.checked, review: state.review, currentId: state.currentId, level: state.level })); } catch (_) { /* Continue without persistence. */ }
  }
  function labelFor(kind, id) {
    var item = diagrams && diagrams.apparatus(kind).find(function (entry) { return entry.id === id; });
    return item ? item.label : id;
  }
  function displayApparatus(kind, id, named) {
    var item = diagrams && diagrams.apparatus(kind).find(function (entry) { return entry.id === id; });
    return item ? (named ? item.label + ' · ' + item.name : item.label) : text(id);
  }
  function setStatus(message, warning) {
    var old = els.card && els.card.querySelector('.status-message');
    if (old) old.remove();
    if (!message || !els.card) return;
    var status = make('div', 'status-message' + (warning ? ' warning' : ''), message);
    status.setAttribute('role', 'status');
    var anchor = els.card.querySelector('.actions');
    if (anchor) anchor.after(status); else (els.card.querySelector('.marking') || els.card).appendChild(status);
  }
  function updateCounts() {
    var checkedCount = questions.filter(function (q) { return state.checked[String(q.id)]; }).length;
    $('progressCount').textContent = checkedCount + '/' + questions.length;
    $('allCount').textContent = questions.length;
    $('coreCount').textContent = questions.filter(function (q) { return String(q.band) === '7-8'; }).length;
    $('stretchCount').textContent = questions.filter(function (q) { return String(q.band) === '9'; }).length;
    $('railCount').textContent = visibleQuestions().length;
    if (!test && !teacher) progressModel.renderHeader(masteryRecords, settings.leafId);
  }
  function renderList() {
    var list = els.list;
    list.replaceChildren();
    visibleQuestions().forEach(function (question) {
      var item = make('button', 'question-item');
      item.type = 'button';
      item.classList.toggle('is-active', String(question.id) === String(state.currentId));
      item.classList.toggle('is-checked', Boolean(state.checked[String(question.id)]));
      item.dataset.questionId = question.id;
      append(item, make('span', 'question-id', question.id));
      if (state.checked[String(question.id)]) append(item, make('span', 'question-state', '✓ checked'));
      item.addEventListener('click', function () { state.currentId = question.id; save(); render(); });
      list.appendChild(item);
    });
  }
  function makeDiagram(question, response, checked) {
    if (!question.diagram || !diagrams) return null;
    var wrap = make('div', 'diagram-wrap');
    var interactive = question.type === 'select';
    wrap.innerHTML = diagrams.render(question.diagram, { highlight: question.highlight, selected: response.selectedId, checked: checked, review: state.review, interactive: interactive });
    if (question.diagram !== 'graph' && interactive) {
      wrap.querySelectorAll('[data-apparatus]').forEach(function (node) {
        node.addEventListener('click', function () {
          if (state.checked[String(question.id)]) return;
          response.selectedId = node.getAttribute('data-apparatus') || '';
          save(); renderCard(question);
        });
        node.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            node.dispatchEvent(new MouseEvent('click', { bubbles: true, view: window }));
          }
        });
      });
    }
    return wrap;
  }
  function makeSelection(question, response, checked) {
    if (!question.selection) return null;
    var box = document.createElement('fieldset'); box.className = 'choice-box';
    var legend = document.createElement('legend'); legend.textContent = text(question.selection.prompt || 'Choose the apparatus'); box.appendChild(legend);
      var help = make('p', 'choice-help', checked || state.review ? 'Equipment names are shown after checking.' : 'Choose a neutral apparatus label; the name is revealed after checking.'); box.appendChild(help);
    var options = make('div', 'choice-options');
    var apparatus = diagrams && diagrams.apparatus(question.diagram);
    (apparatus || []).forEach(function (item) {
      var label = make('label', 'choice-option');
      var input = document.createElement('input'); input.type = 'radio'; input.name = 'selection-' + text(question.id); input.value = item.id; input.checked = response.selectedId === item.id; input.disabled = checked;
      var caption = make('span', '', checked || state.review ? item.label + ' · ' + item.name : item.label); label.appendChild(input); label.appendChild(caption); options.appendChild(label);
      input.addEventListener('change', function () { response.selectedId = input.value; save(); renderCard(question); });
    });
    box.appendChild(options); return box;
  }
  function makeCorrection(question, response, checked) {
    if (!question.correction) return null;
    var box = make('fieldset', 'correction-box');
    box.setAttribute('aria-label', 'Sample answer to correct');
    var segments = make('div', 'correction-segments');
    (question.correction.segments || []).forEach(function (segment) {
      if (segment.selectable === false || !/[a-z0-9]/i.test(segment.text)) { segments.appendChild(make('span', 'correction-punctuation', text(segment.text))); return; }
      var button = make('button', 'error-segment', text(segment.text)); button.type = 'button'; button.dataset.errorId = text(segment.id);
      button.classList.toggle('is-selected', response.errorId === text(segment.id)); button.disabled = checked;
      button.addEventListener('click', function () {
        response.errorId = button.dataset.errorId;
        save(); renderCard(question);
        els.card.querySelector('#field-replacement').focus();
      }); segments.appendChild(button);
    });
    box.appendChild(segments); return box;
  }
  function makeFields(question, response, checked) {
    var grid = make('div', 'answer-grid');
    (question.fields || []).forEach(function (field, index) {
      if (field.options) {
        var choices = make('fieldset', 'choice-box mcq-field');
        choices.id = 'field-' + field.id;
        choices.appendChild(make('legend', '', field.label));
        var options = make('div', 'mcq-options options-' + field.options.length);
        field.options.forEach(function (option) {
          var label = make('label', 'mcq-option');
          var radio = document.createElement('input');
          radio.type = field.multiselect ? 'checkbox' : 'radio'; radio.name = 'field-' + field.id; radio.value = option;
          var selected = field.multiselect ? (Array.isArray(response.fields[field.id]) && response.fields[field.id].indexOf(option) !== -1) : response.fields[field.id] === option;
          radio.checked = selected; radio.disabled = checked;
          radio.addEventListener('change', function () {
            if (field.multiselect) {
              var selectedValues = Array.isArray(response.fields[field.id]) ? response.fields[field.id].slice() : [];
              if (radio.checked && selectedValues.indexOf(option) === -1) selectedValues.push(option);
              if (!radio.checked) selectedValues = selectedValues.filter(function (value) { return value !== option; });
              response.fields[field.id] = selectedValues;
            } else response.fields[field.id] = option;
            save(); refreshCheckState(question, response);
          });
          append(label, radio, make('span', '', option)); options.appendChild(label);
        });
        choices.appendChild(options); grid.appendChild(choices); return;
      }
      var group = make('div', 'field-set');
      var label = make('label', '', text(field.label || ('Answer ' + (index + 1))));
      var input = document.createElement((field.multiline || text(field.label).length > 100) ? 'textarea' : 'input');
      input.className = input.tagName === 'TEXTAREA' ? 'answer-area' : 'answer-input'; input.rows = 3; input.id = 'field-' + text(field.id); input.name = input.id; input.value = text(response.fields[String(field.id)]); input.disabled = checked; input.setAttribute('aria-label', text(field.label || ('Answer ' + (index + 1))));
      label.htmlFor = input.id; group.appendChild(label); group.appendChild(input);
      input.addEventListener('input', function () { response.fields[String(field.id)] = input.value; save(); refreshCheckState(question, response); });
      input.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.repeat) return;
        event.preventDefault();
        var inputs = Array.from(els.card.querySelectorAll('.answer-grid input, .answer-grid textarea')).filter(function (node) {return !node.disabled;});
        var next = inputs[inputs.indexOf(input) + 1];
        if (next) next.focus();
        else if (questionReady(question, response)) els.card.querySelector('.actions .primary').click();
      });
      grid.appendChild(group);
    });
    return grid;
  }
  function refreshCheckState(question, response) {
    if (!els.card || state.checked[String(question.id)]) return;
    var button = els.card.querySelector('.actions .primary');
    if (button) button.disabled = !questionReady(question, response);
    var multi = (question.fields || []).find(function (field) { return field.multiselect; });
    if (multi) setStatus((response.fields[multi.id] || []).length + ' of ' + multi.selectCount + ' selected. Select exactly ' + multi.selectCount + ' options.', false);
  }
  function questionReady(question, response) {
    var fieldsReady = (question.fields || []).every(function (field) {
      var value = response.fields[String(field.id)];
      return field.multiselect ? Array.isArray(value) && value.length === Number(field.selectCount || (field.answers || []).length || 1) : text(value).trim() !== '';
    });
    return fieldsReady && (!question.selection || response.selectedId) && (!question.correction || response.errorId);
  }
  function makeReview(question) {
    if (!state.review) return null;
    var panel = make('section', 'review-panel');
    panel.appendChild(make('h3', '', 'Teacher check · model answers and marking points'));
    (question.fields || []).forEach(function (field) {
      var answer = make('div', 'review-answer');
      append(answer, make('p', '', 'Model: ' + text(field.model || (field.answers || []).join(' / '))), make('p', '', text(field.feedback || 'Award this point for a chemically accurate response.'))); panel.appendChild(answer);
    });
    if (question.selection) panel.appendChild(make('div', 'review-answer', 'Selection model: ' + displayApparatus(question.diagram, question.selection.correct, true)));
    if (question.correction) {
      var errorSegment = (question.correction.segments || []).find(function (segment) { return String(segment.id) === String(question.correction.errorId); });
      panel.appendChild(make('div', 'review-answer', 'Error model: select “' + text(errorSegment ? errorSegment.text : question.correction.errorId) + '”, then apply the replacement and explanation above.'));
    }
    var teacher = globalThis.ChemistryMode && globalThis.ChemistryMode.get() === 'teacher';
    if (teacher && question.pattern) panel.appendChild(make('div', 'review-answer', 'Pattern: ' + text(question.pattern)));
    if (teacher && question.reviewNote) panel.appendChild(make('div', 'review-answer', 'Review note: ' + text(question.reviewNote)));
    if (teacher && question.sources && question.sources.length) {
      panel.appendChild(make('h3', '', 'Source notes'));
      var sources = make('div', 'review-sources'); question.sources.forEach(function (source) { var row = make('div', 'source-row'); append(row, make('strong', '', text(source.id || 'Source')), document.createTextNode(text(source.summary || ''))); if (source.band) row.appendChild(make('span', '', ' · ' + text(source.band))); sources.appendChild(row); }); panel.appendChild(sources);
    }
    return panel;
  }
  function renderResults(question, response) {
    if (!state.checked[String(question.id)]) return null;
    var result = core.gradeQuestion(question, response);
    var area = make('section', 'results'); area.setAttribute('aria-live', 'polite');
    area.appendChild(make('span', 'score', result.correctCount + '/' + result.total));
    var rows = make('div', 'field-results');
    result.points.forEach(function (point) {
      var row = make('div', 'result-row' + (point.correct ? ' is-correct' : ''));
      var icon = make('span', 'result-icon', point.correct ? '\u2713' : '\u2717');
      icon.setAttribute('aria-label', point.correct ? 'Correct' : 'Incorrect');
      var body = make('div', 'result-text');
      if (point.model) body.appendChild(make('em', '', point.model));
      if (point.feedback && core.normalise(point.feedback) !== core.normalise(point.model)) body.appendChild(make('span', '', point.feedback));
      if (point.overrideable && !point.automaticCorrect) {
        var confirm = make('button', 'override-button', 'My answer means the same'); confirm.type = 'button';
        confirm.setAttribute('aria-pressed', String(response.overrides.indexOf(point.id) !== -1));
        confirm.addEventListener('click', function () {
          if (response.overrides.indexOf(point.id) === -1) response.overrides.push(point.id);
          else response.overrides = response.overrides.filter(function (id) {return id !== point.id;});
          save(); renderCard(question);
        });
        body.appendChild(confirm);
      }
      append(row, icon, body); rows.appendChild(row);
    });
    area.appendChild(rows); return area;
  }
  function questionScore(result) {
    if (progressModel && progressModel.questionScore) return progressModel.questionScore(result.points.map(function (point) { return point.correct; }));
    return result.total ? result.correctCount / result.total : 0;
  }
  function firstResult(question, response, result) {
    if (!response.firstResult) {
      var score = questionScore(result), independent = !response.hinted;
      response.firstResult = { score: score, independent: independent, completedAt: Date.now(),
        evidence: independent ? {score: score, questionId: question.id, marks: result.points.map(function (p) {return p.correct;}), total: result.total} : null };
      response.firstScore = score;
    }
    return response.firstResult;
  }
  function recordMastery(question, response, result) {
    if (test || teacher || !progressModel || !settings) return;
    var outcome = firstResult(question, response, result);
    if (!outcome.independent) return;
    var item = { id: response.attemptId, leafId: settings.leafId, grade: question.band === '9' ? 3 : 2,
      score: outcome.score, completedAt: outcome.completedAt, question: question.id };
    masteryRecords = progressModel.merge(progressModel.read(localStorage), masteryRecords);
    masteryRecords = progressModel.append(masteryRecords, item); response.recorded = true;
    try { localStorage.setItem(progressModel.key, JSON.stringify(masteryRecords)); } catch (_) {}
  }
  function snapshot() {
    if (!test || !currentQuestion()) return null;
    return { version: 1, questionId: currentQuestion().id, level: requestedGrade, review: state.review === true, responses: state.responses,
      checked: state.checked, hinted: currentQuestion() && responseFor(currentQuestion()).hinted === true,
      testCompleted: testCompleted, completedAt: completedAt };
  }
  async function emitTestResult(question, result) {
    if (!test || !testCompleted) return;
    var response = responseFor(question);
    var outcome = firstResult(question, response, result);
    bridge.save(snapshot());
    bridge.result(outcome);
  }
  function renderCard(question) {
    if (!question) { els.empty.hidden = false; els.card.hidden = true; return; }
    els.empty.hidden = true; els.card.hidden = false; els.card.replaceChildren();
    var response = responseFor(question); if (state.review && (!globalThis.ChemistryMode || globalThis.ChemistryMode.get() !== 'teacher')) response.hinted = true; var checked = Boolean(state.checked[String(question.id)]); els.card.className = 'panel question-card';
    var workspace = make('div', 'question-workspace');
    var content = make('div', 'question-content');
    var questionText = make('div', 'question-text');
    if (question.context) questionText.appendChild(make('p', 'context', question.context));
    if (question.prompt) questionText.appendChild(make('p', 'prompt', question.prompt));
    content.appendChild(questionText);
    var diagram = makeDiagram(question, response, checked); if (diagram) content.appendChild(diagram);
    var selection = makeSelection(question, response, checked); if (selection) content.appendChild(selection);
    var correction = makeCorrection(question, response, checked); if (correction) content.appendChild(correction);
    content.appendChild(makeFields(question, response, checked));
    var marking = make('aside', 'marking'); marking.setAttribute('aria-label', 'Marking and feedback');
    marking.appendChild(make('span', 'review-id question-review-id', question.id));
    append(workspace, content, marking); els.card.appendChild(workspace);
    var actions = make('div', 'actions'); var checkButton = make('button', 'button primary', checked ? 'Checked' : 'Check answer'); checkButton.type = 'button'; checkButton.disabled = checked || !questionReady(question, response); checkButton.addEventListener('click', async function () { if (!questionReady(question, response)) { setStatus('Complete every answer box and make any required selection first.', true); return; } state.checked[String(question.id)] = true; response.overrides = []; var result = core.gradeQuestion(question, response); firstResult(question, response, result); if (test && !testCompleted) { testCompleted = true; completedAt = Date.now(); } recordMastery(question, response, result); save(); render(); els.card.querySelector('.next-button').focus({preventScroll:true}); if (test) await emitTestResult(question, result); }); actions.appendChild(checkButton);
    var retry = make('button', 'button secondary', checked ? 'Try again' : 'Reset question'); retry.type = 'button'; retry.addEventListener('click', function () { if (checked) { state.checked[String(question.id)] = false; response.overrides = []; save(); render(); } else { state.responses[String(question.id)] = blankResponse(question, response); save(); render(); } }); actions.appendChild(retry);
    if (checked) { var reset = make('button', 'button secondary', 'Reset question'); reset.type = 'button'; reset.addEventListener('click', function () { state.checked[String(question.id)] = false; state.responses[String(question.id)] = blankResponse(question, response); save(); render(); }); actions.appendChild(reset); }
    var previous = make('button', 'button secondary previous-button', '← Previous'); previous.type = 'button'; previous.disabled = test || visibleQuestions().findIndex(function (q) { return String(q.id) === String(question.id); }) <= 0; previous.addEventListener('click', function () { move(-1); }); actions.appendChild(previous);
    var next = make('button', 'button secondary next-button', test ? 'Next question →' : 'Next →'); next.type = 'button'; next.disabled = test ? !testCompleted : teacher ? visibleQuestions().findIndex(function (q) { return String(q.id) === String(question.id); }) >= visibleQuestions().length - 1 : !response.firstResult; next.addEventListener('click', function () { if (test) bridge.next(); else if (teacher) move(1); else nextPractice(); }); actions.appendChild(next); actions.appendChild(els.reviewToggle); marking.appendChild(actions);
    var results = renderResults(question, response); if (results) marking.appendChild(results);
    var review = makeReview(question); if (review) marking.appendChild(review);

  }
  function practiceBand() {
    if (requestedBand) return requestedBand;
    masteryRecords = progressModel.merge(progressModel.read(localStorage), masteryRecords);
    var grade = settings.availableGrades.find(function (g) { return !progressModel.summarise(masteryRecords, settings.leafId, g).mastered; });
    return grade === 2 ? '7-8' : '9';
  }
  function nextPractice() {
    var previousId = state.currentId;
    state.level = practiceBand();
    var pool = visibleQuestions(), index = pool.findIndex(function (q) {return q.id === previousId;});
    var question = pool[(index + 1) % pool.length];
    state.currentId = question.id; state.review = false;
    state.responses[question.id] = blankResponse(question); state.checked[question.id] = false;
    save(); render();
  }
  function move(delta) { var list = visibleQuestions(); var index = list.findIndex(function (q) { return String(q.id) === String(state.currentId); }); var next = list[index + delta]; if (next) { state.currentId = next.id; save(); render(); } }
  function render() { updateCounts(); renderList(); renderCard(currentQuestion()); document.querySelectorAll('.level-tab').forEach(function (tab) { tab.classList.toggle('is-active', tab.dataset.level === state.level); }); els.reviewToggle.setAttribute('aria-pressed', state.review ? 'true' : 'false'); els.reviewToggle.textContent = state.review ? 'Hide model answers' : 'Review model answers'; }
  function init() {
    els = { list: $('questionList'), card: $('questionCard'), empty: $('emptyState'), reviewToggle: $('reviewToggle') };
    if (test) {
      var restored = test.state || {};
      state.level = requestedBand || state.level;
      state.currentId = testQuestion(restored.questionId).id;
      if (restored.responses && typeof restored.responses === 'object') state.responses = restored.responses;
      if (restored.checked && typeof restored.checked === 'object') state.checked = restored.checked;
      state.review = restored.review === true;
      testCompleted = restored.testCompleted === true;
      completedAt = Number(restored.completedAt) || null;
    } else { readSaved(); if (requestedBand) { state.level = requestedBand; if (!questions.some(function (q) { return String(q.id) === String(state.currentId) && String(q.band) === requestedBand; })) state.currentId = questions.find(function (q) { return String(q.band) === requestedBand; })?.id; } try { masteryRecords = progressModel ? progressModel.read(localStorage) : []; } catch (_) {} }
    if (!test && !teacher) {
      state.level = practiceBand();
      if (!visibleQuestions().some(function (q) {return q.id === state.currentId;})) {state.currentId=visibleQuestions()[0].id; state.review=false;}
      document.documentElement.classList.add('standalone-practice');
    }
    document.querySelectorAll('.level-tab').forEach(function (tab) { tab.addEventListener('click', function () { state.level = tab.dataset.level; var visible = visibleQuestions(); if (!visible.some(function (q) { return String(q.id) === String(state.currentId); })) state.currentId = visible[0] && visible[0].id; document.querySelectorAll('.level-tab').forEach(function (other) { other.classList.toggle('is-active', other === tab); }); save(); render(); }); });
    if (teacher && globalThis.QuestionPrint) document.querySelector('.site-tools').appendChild(QuestionPrint.create(function () {state.review=true; render(); window.print();}));
    els.reviewToggle.addEventListener('click', function () { state.review = !state.review; if (state.review && currentQuestion() && (!globalThis.ChemistryMode || globalThis.ChemistryMode.get() !== 'teacher')) responseFor(currentQuestion()).hinted = true; save(); render(); });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' || event.repeat || event.shiftKey || event.isComposing || event.target.closest('button,input,textarea,select,a')) return;
      if (state.checked[String(state.currentId)]) {event.preventDefault(); els.card.querySelector('.next-button:not(:disabled)')?.click();}
    });
    render();
    save();
    if (test) {
      bridge.save(snapshot());
      var restoredQuestion = currentQuestion();
      if (testCompleted && restoredQuestion && state.checked[String(restoredQuestion.id)] ) {
        emitTestResult(restoredQuestion, core.gradeQuestion(restoredQuestion, responseFor(restoredQuestion)));
      }
    }
  }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
