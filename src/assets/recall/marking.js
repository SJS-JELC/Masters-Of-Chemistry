(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RecallMarking = api;
})(globalThis, function () {
  'use strict';
  function ascii(value) {
    return String(value).replace(/[₀-₉]/g, c => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)))
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)))
      .replace(/⁺/g, '+').replace(/[⁻−–—]/g, '-').replace(/ₙ/g, 'n').replace(/₊/g, '+');
  }
  function normalise(value) {
    const protectedFormulae = [];
    let text = ascii(value).trim().replace(/\b(?:CnH2n(?:\+2)?|(?:[A-Z][a-z]?\d*){2,}|Zn|Ag)\b/g, token => {
      // Capitalisation matters for formulae, including CO versus Co.
      if (!/\d/.test(token) && !['CO', 'Co', 'NO', 'NaOH', 'HCl', 'OH', 'Zn', 'Ag'].includes(token)) return token;
      protectedFormulae.push(token); return ` zzformula${protectedFormulae.length - 1}zz `;
    }).toLowerCase();
    text = text.replace(/sulph/g, 'sulf').replace(/colour/g, 'color').replace(/\bgrey\b/g, 'gray')
      .replace(/\bppt\b/g, 'precipitate').replace(/\bpercent\b/g, '%')
      .replace(/\bdegrees?\s*(?:celsius|c)\b/g, '°c').replace(/°\s*c/g, '°c')
      .replace(/\batmospheres?\b/g, 'atm').replace(/\bapproximately\b|\babout\b/g, '')
      .replace(/\b(\d+)\s*([+-])(?=\s|$|[;,])/g, '$2$1')
      .replace(/\bpositive one\b/g, '+1').replace(/\bnegative one\b/g, '-1')
      .replace(/\b(?:turns|turning)\b/g, 'turn').replace(/\bforms\b/g, 'form')
      .replace(/\b(?:a|an|the|is|are|it)\b/g, '')
      .replace(/\s+%/g, '%').replace(/(\d)\s*-\s*(\d)/g, '$1-$2')
      .replace(/[(),;:!?]/g, ' ').replace(/\.(?!\d)/g, ' ').replace(/\s+/g, ' ').trim();
    return text.replace(/zzformula(\d+)zz/g, (_, index) => `formula:${protectedFormulae[Number(index)]}`);
  }
  function occurrences(text, phrase) {
    const results = []; if (!phrase) return results;
    for (let start = text.indexOf(phrase); start >= 0; start = text.indexOf(phrase, start + 1)) {
      const end = start + phrase.length;
      if ((start === 0 || /\s/.test(text[start - 1])) && (end === text.length || /\s/.test(text[end]))) results.push({start, end});
    }
    return results;
  }
  function combinedIon(q, value) {
    if (!q.ion) return value;
    const raw = ascii(value).trim().replace(/\s/g, '').replace(/[\[\]]/g, '').replace(/\^/g, '');
    const suffixes = [q.ion.charge, q.ion.charge.slice(1) + q.ion.charge[0]];
    if (q.ion.charge.slice(1) === '1') suffixes.push(q.ion.charge[0]);
    return suffixes.some(s => raw === q.ion.formula + s) ? `${q.ion.formula}; ${q.ion.charge}` : value;
  }
  function evaluateSet(set, text) {
    const parts = set.parts.map(part => {
      const hits = part.accepted.flatMap(alias => occurrences(text, normalise(alias)));
      return {...part, hits, matched: hits.length > 0};
    });
    const matched = parts.filter(p => p.matched), required = set.required;
    let ordered = true, position = -1;
    if (set.mode === 'ordered') for (const part of parts) {
      const next = part.hits.find(h => h.start >= position);
      if (!next) { ordered = false; break; } position = next.end;
    }
    const covered = Array(text.length).fill(false);
    for (const part of parts) for (const hit of part.hits) for (let i = hit.start; i < hit.end; i++) covered[i] = true;
    const remainder = text.split('').map((c, i) => covered[i] ? ' ' : c).join('')
      .replace(/\b(?:and|then|to|with|plus|followed by)\b/g, '').replace(/\s+/g, ' ').trim();
    return {correct: matched.length >= required && ordered && !remainder, matched: matched.length, required, ordered, remainder,
      missing: parts.filter(p => !p.matched).map(p => p.label), setId: set.id};
  }
  function mark(q, value) {
    const text = normalise(combinedIon(q, value));
    if (!text) return {correct: false, empty: true, message: 'Type an answer first.'};
    const results = q.sets.map(set => evaluateSet(set, text));
    const best = results.find(r => r.correct) || results.sort((a, b) => b.matched / b.required - a.matched / a.required)[0];
    let message = 'Complete answer — boost earned.';
    if (!best.correct) {
      if (!best.ordered && best.matched >= best.required) message = 'The parts are present, but the order needs correcting.';
      else if (best.matched >= best.required && best.remainder) message = 'Check the extra wording or conflicting claim against the reviewed answer.';
      else message = `${best.matched} of ${best.required} required parts recognised. ${best.missing.length ? 'Check: ' + best.missing.join('; ') + '.' : ''}`;
    }
    return {...best, message};
  }
  return {ascii, normalise, mark};
});
