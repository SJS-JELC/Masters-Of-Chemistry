/* Pure marking functions for the energetics practical review.  This file is
 * usable in the browser and with Node (node core.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PracticalCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalise(value) {
    return String(value == null ? '' : value)
      .toLocaleLowerCase('en-GB')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘]/g, "'")
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function answerMatches(text, alternatives) {
    var candidate = normalise(text);
    if (!candidate || !Array.isArray(alternatives)) return false;
    return alternatives.some(function (answer) { return candidate === normalise(answer); });
  }

  function selectionMatches(values, alternatives) {
    if (!Array.isArray(values) || !Array.isArray(alternatives) || values.length !== alternatives.length) return false;
    var chosen = values.map(normalise);
    var expected = alternatives.map(normalise);
    return chosen.every(function (value, index) { return value && chosen.indexOf(value) === index && expected.indexOf(value) !== -1; });
  }

  function safeResponse(response) {
    var source = response && typeof response === 'object' ? response : {};
    return {
      fields: source.fields && typeof source.fields === 'object' ? source.fields : {},
      selectedId: source.selectedId == null ? '' : String(source.selectedId),
      errorId: source.errorId == null ? '' : String(source.errorId),
      overrides: Array.isArray(source.overrides) ? source.overrides.map(String) : []
    };
  }

  function point(id, correct, automaticCorrect, overrideable, model, feedback) {
    return { id: id, correct: Boolean(correct), automaticCorrect: Boolean(automaticCorrect),
      overrideable: Boolean(overrideable), model: model || '', feedback: feedback || '' };
  }

  function gradeQuestion(question, response) {
    question = question && typeof question === 'object' ? question : {};
    var answer = safeResponse(response);
    var points = [];
    var fields = Array.isArray(question.fields) ? question.fields : [];
    var correction = question.correction && typeof question.correction === 'object' ? question.correction : null;
    var errorGate = !correction || answer.errorId === String(correction.errorId || '');

    if (question.selection && typeof question.selection === 'object') {
      var selectionCorrect = answer.selectedId !== '' && answer.selectedId === String(question.selection.correct || '');
      points.push(point('selection', selectionCorrect, selectionCorrect, false,
        String(question.selection.correct || ''), 'Select the equipment label that matches the practical requirement.'));
    }
    if (correction) {
      var errorCorrect = answer.errorId !== '' && answer.errorId === String(correction.errorId || '');
      var errorSegment = Array.isArray(correction.segments) && correction.segments.find(function (segment) { return String(segment.id) === String(correction.errorId || ''); });
      points.push(point('error', errorCorrect, errorCorrect, false,
        errorSegment && errorSegment.text ? String(errorSegment.text) : String(correction.errorId || ''), 'Identify the highlighted erroneous phrase before replacing it.'));
    }

    fields.forEach(function (field, index) {
      var id = String(field && field.id != null ? field.id : 'field-' + (index + 1));
      var raw = answer.fields[id];
      var multi = field.multiselect === true;
      var text = multi ? (Array.isArray(raw) ? raw.join(' / ') : '') : (raw == null ? '' : String(raw));
      var nonempty = multi ? Array.isArray(raw) && raw.length > 0 : normalise(text) !== '';
      var automaticCorrect = nonempty && (multi ? selectionMatches(raw, field.answers || []) : answerMatches(text, field.answers || []));
      var gated = !correction || errorGate;
      /* In a correction task the replacement is gated by the error choice;
       * a separate explanation field can still earn its own point. */
      var gateForField = correction && index === 0 ? gated : true;
      var canOverride = !field.options && !multi && nonempty && !automaticCorrect && gateForField;
      var override = canOverride && answer.overrides.indexOf(id) !== -1;
      var feedback = field.feedback || '';
      if (correction && index === 0 && !errorGate) feedback = 'Identify the error first; this response cannot earn the correction mark yet.';
      points.push(point(id, gateForField && (automaticCorrect || override), gateForField && automaticCorrect, canOverride,
        field.model || (Array.isArray(field.answers) ? field.answers[0] : ''), feedback));
    });

    return {
      points: points,
      correctCount: points.filter(function (item) { return item.correct; }).length,
      total: points.length
    };
  }

  return { normalise: normalise, normalize: normalise, answerMatches: answerMatches, gradeQuestion: gradeQuestion };
}));
