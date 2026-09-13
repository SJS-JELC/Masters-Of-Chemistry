/* Small, editable SVG diagrams.  Apparatus labels remain neutral until a
 * response has been checked or the answer is being reviewed. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PracticalDiagrams = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var names = {
    cup: 'polystyrene cup', beaker: 'beaker', lid: 'card lid', thermometer: 'thermometer',
    stirrer: 'stirrer', 'measuring-cylinder': 'measuring cylinder', burner: 'spirit burner',
    can: 'metal can', balance: 'balance', ruler: 'ruler'
  };
  var order = {
    cup: ['cup', 'beaker', 'lid', 'thermometer', 'stirrer', 'measuring-cylinder'],
    burner: ['burner', 'can', 'thermometer', 'balance', 'ruler', 'stirrer']
  };
  var letters = {};
  Object.keys(order).forEach(function (kind) { order[kind].forEach(function (id, i) { letters[kind + ':' + id] = String.fromCharCode(65 + i); }); });

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; });
  }
  function props(kind, id, state) {
    var checked = state.checked || state.review;
    var interactive = state.interactive !== false;
    var letter = letters[kind + ':' + id] || '?';
    var label = checked ? names[id] : 'Apparatus ' + letter;
    var selected = state.selected === id ? ' is-selected' : '';
    var marked = state.highlight === id ? ' is-highlighted' : '';
    return 'class="apparatus' + selected + marked + '"' + (interactive ? ' tabindex="0" role="button" data-apparatus="' + esc(id) + '" aria-label="' + esc(label) + '"' : '') + '><title>' + esc(label) + '</title>';
  }
  function badge(x, y, text) { return '<g class="apparatus-badge"><circle cx="' + x + '" cy="' + y + '" r="13"></circle><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle">' + esc(text) + '</text></g>'; }
  function wrap(kind, state, inner) {
    return '<svg class="practical-svg" viewBox="0 0 760 330" role="img" aria-label="' + esc(state.checked || state.review ? (kind === 'cup' ? 'Insulated cup calorimetry apparatus' : 'Heated metal can apparatus') : 'Practical apparatus diagram') + '"><rect class="svg-backdrop" x="0" y="0" width="760" height="330" rx="18"></rect>' + inner + '</svg>';
  }

  function cupDiagram(state) {
    state = state || {};
    var inner = '';
    inner += '<g ' + props('cup', 'beaker', state) + '><path d="M104 96 L118 218 Q190 236 264 218 L278 96" class="glass"></path>' + badge(129, 109, state.highlight === 'beaker' && !state.checked && !state.review ? '?' : (letters['cup:beaker'])) + '</g>';
    inner += '<g ' + props('cup', 'cup', state) + '><path d="M127 117 L144 189 Q190 204 238 189 L255 117" class="foam"></path><path d="M137 145 Q190 157 245 145" class="liquid warm"></path>' + badge(151, 142, state.highlight === 'cup' && !state.checked && !state.review ? '?' : letters['cup:cup']) + '</g>';
    inner += '<g ' + props('cup', 'lid', state) + '><path d="M133 99 Q190 76 249 99 L245 112 Q190 95 137 112Z" class="lid"></path><circle cx="190" cy="93" r="10" class="hole"></circle>' + badge(227, 83, state.highlight === 'lid' && !state.checked && !state.review ? '?' : letters['cup:lid']) + '</g>';
    inner += '<g ' + props('cup', 'thermometer', state) + '><path d="M185 36 L195 36 L196 139 Q196 150 190 150 Q184 150 184 139Z" class="thermo"></path><circle cx="190" cy="153" r="10" class="bulb"></circle><path d="M190 143 L190 55" class="mercury"></path>' + badge(218, 56, state.highlight === 'thermometer' && !state.checked && !state.review ? '?' : letters['cup:thermometer']) + '</g>';
    inner += '<g ' + props('cup', 'stirrer', state) + '><path d="M113 80 L210 169" class="rod"></path><path d="M105 72 L120 86" class="rod-handle"></path>' + badge(112, 74, state.highlight === 'stirrer' && !state.checked && !state.review ? '?' : letters['cup:stirrer']) + '</g>';
    inner += '<g ' + props('cup', 'measuring-cylinder', state) + '><path d="M493 85 L534 85 L530 229 Q514 239 498 229Z" class="cylinder"></path><path d="M498 165 L531 165 L530 228 Q514 237 498 228Z" class="liquid cool"></path><path d="M493 85 L534 85" class="rim"></path><path d="M498 112 L510 112 M498 136 L510 136 M498 160 L510 160" class="ticks"></path><path d="M508 229 L508 246 L486 251 L542 251 L520 246 L520 229Z" class="cylinder-base"></path>' + badge(570, 102, state.highlight === 'measuring-cylinder' && !state.checked && !state.review ? '?' : letters['cup:measuring-cylinder']) + '</g>';
    inner += '<text class="diagram-caption" x="46" y="293">Insulated temperature-change setup</text><text class="diagram-caption" x="444" y="293">Liquid measured before transfer</text>';
    return wrap('cup', state, inner);
  }

  function burnerDiagram(state) {
    state = state || {};
    var inner = '';
    inner += '<g ' + props('burner', 'burner', state) + '><path d="M120 249 L166 249 Q173 249 173 257 L173 270 Q173 278 165 278 L121 278 Q113 278 113 270 L113 257 Q113 249 120 249Z" class="burner"></path><path d="M135 249 L135 239 L151 239 L151 249Z" class="burner-neck"></path><path d="M143 236 C126 230 134 219 143 213 C146 222 155 229 143 236Z" class="flame"></path><path d="M143 239 L143 230" class="wick"></path>' + badge(101, 264, state.highlight === 'burner' && !state.checked && !state.review ? '?' : letters['burner:burner']) + '</g>';
    inner += '<path d="M96 211 L190 211 M110 211 L101 242 M176 211 L185 242" class="stand"></path>';
    inner += '<g ' + props('burner', 'can', state) + '><path d="M98 112 L188 112 L180 198 Q143 211 106 198Z" class="can"></path><path d="M98 112 Q143 99 188 112" class="can-rim"></path><path d="M105 167 Q143 180 182 167" class="can-liquid"></path>' + badge(199, 130, state.highlight === 'can' && !state.checked && !state.review ? '?' : letters['burner:can']) + '</g>';
    inner += '<g ' + props('burner', 'thermometer', state) + '><path d="M139 54 L149 54 L149 171 Q149 180 144 180 Q139 180 139 171Z" class="thermo"></path><circle cx="144" cy="184" r="10" class="bulb"></circle><path d="M144 174 L144 74" class="mercury"></path>' + badge(119, 65, state.highlight === 'thermometer' && !state.checked && !state.review ? '?' : letters['burner:thermometer']) + '</g>';
    inner += '<g ' + props('burner', 'stirrer', state) + '><path d="M111 106 L161 176" class="rod"></path><path d="M103 98 L117 112" class="rod-handle"></path>' + badge(103, 98, state.highlight === 'stirrer' && !state.checked && !state.review ? '?' : letters['burner:stirrer']) + '</g>';
    inner += '<g ' + props('burner', 'balance', state) + '><rect x="435" y="174" width="142" height="65" rx="8" class="balance"></rect><rect x="462" y="143" width="89" height="38" rx="5" class="balance-pan"></rect><path d="M506 174 L506 183" class="balance-line"></path><path d="M467 192 L546 192" class="balance-display"></path>' + badge(594, 175, state.highlight === 'balance' && !state.checked && !state.review ? '?' : letters['burner:balance']) + '</g>';
    inner += '<g ' + props('burner', 'ruler', state) + '><rect x="446" y="91" width="127" height="17" rx="3" class="ruler"></rect><path d="M459 91 L459 108 M475 91 L475 102 M491 91 L491 108 M507 91 L507 102 M523 91 L523 108 M539 91 L539 102 M555 91 L555 108" class="ruler-ticks"></path>' + badge(594, 101, state.highlight === 'ruler' && !state.checked && !state.review ? '?' : letters['burner:ruler']) + '</g>';
    inner += '<text class="diagram-caption" x="47" y="293">Water-heating setup</text><text class="diagram-caption" x="425" y="293">Mass and distance measurements</text>';
    return wrap('burner', state, inner);
  }

  function graphDiagram() {
    return '<svg class="practical-svg graph-svg" viewBox="0 0 760 330" role="img" aria-label="Temperature against volume of acid added graph"><rect class="svg-backdrop" x="0" y="0" width="760" height="330" rx="18"></rect><path d="M106 259 L106 48 M106 259 L697 259" class="axis"></path><path d="M119 234 L464 82 L680 155" class="curve"></path><path d="M464 82 L464 259" class="guide"></path><text x="398" y="309" class="axis-label">volume of acid added</text><text x="30" y="178" class="axis-label" transform="rotate(-90 30 178)">temperature</text><text x="478" y="69" class="graph-note">maximum</text><circle cx="464" cy="82" r="7" class="point"></circle></svg>';
  }

  function render(type, state) {
    state = state || {};
    if (type === 'cup') return cupDiagram(state);
    if (type === 'burner') return burnerDiagram(state);
    if (type === 'graph') return graphDiagram();
    return '';
  }
  function apparatus(kind) { return (order[kind] || []).map(function (id) { return { id: id, label: letters[kind + ':' + id], name: names[id] }; }); }
  return { render: render, apparatus: apparatus, nameFor: function (id) { return names[id] || id; } };
}));
