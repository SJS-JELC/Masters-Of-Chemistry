(function(){
'use strict';
const D=EnergyData,C=EnergyCore,E=EnergyEditor,$=id=>document.getElementById(id),key='sjs-energy-enthalpy-v2';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reviewBank=QuestionReview.bank('EE',D.questions);
const P=MastersProgress,settings=IGCSEMasteryConfig.activities['energy-enthalpy'];
let results=[];
try{results=P.read(localStorage);}catch{}
const params=new URLSearchParams(location.search);
function loadReview(id){start(reviewBank.get(id));}
let state=C.fresh(),q,editor,hinted=false,revealed=false,storageOK=true;
try{state=C.load(localStorage.getItem(key),D);}catch{storageOK=false;}
if(params.get('practice')==='grade'&&[1,2].includes(Number(params.get('grade'))))state.filter='grade'+params.get('grade');
else if(params.get('practice')==='mastery')state.filter='mixed';
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{storageOK=false;}$('saveStatus').textContent=storageOK?'Progress stays in this browser.':'Storage unavailable: progress lasts for this visit.';}
function progress(){
 $('quickMode').value=state.filter;
 const achievement=P.achievement(results,settings.leafId);
 $('strands').innerHTML=D.strands.map(g=>{const rows=results.filter(r=>r.leafId===settings.leafId&&r.strand===g.id),score=P.weightedScore(rows.map(r=>r.score),settings.halfLives[g.grade]);return `<button class="mode" data-strand="${g.id}" aria-pressed="${state.filter===g.id}">${g.name}<span>${P.bands[g.grade]}</span>${P.masteryBar(score,g.name+' mastery',g.grade).outerHTML}</button>`;}).join('');
 $('total').textContent=`${achievement.achievedGrade} / 2 levels`;$('mixed').setAttribute('aria-pressed',state.filter==='mixed');$('session').innerHTML=[1,2].map(grade=>{const p=P.summarise(results,settings.leafId,grade);return `<span>${P.bands[grade]}</span>${P.masteryBar(p.score,P.bands[grade]+' mastery',grade).outerHTML}`;}).join('')+'<span>Grade 9 unavailable</span>';
}
function start(supplied){
 if(editor){editor.destroy();editor=null;}
 q=supplied?.id?supplied:C.next(state,D,q?.id);hinted=false;revealed=false;
 $('prompt').textContent=q.prompt;$('prompt').dataset.question=q.id;
 $('equation').textContent=q.equation||'';$('equation').hidden=!q.equation;
 $('enthalpy').textContent=q.enthalpyText||'';$('enthalpy').hidden=!q.enthalpyText;
 $('strandName').textContent=D.strands.find(g=>g.id===q.strand).name+' · '+P.bands[q.grade];
 const choices=q.fields?.some(f=>f.options),typed=q.fields?.some(f=>!f.options);
 $('format').textContent=`${q.points.length} ${q.points.length===1?'mark':'marks'} · ${q.kind?'Editable diagram':choices?(typed?'Short answers and choices':'Choose answers'):'Short answer'}`;
 $('instruction').textContent=q.kind?'':choices?(typed?'Choose the buttons and fill in the remaining gaps.':'Choose one button for each answer.'):'Fill in each gap with a short answer.';$('instruction').hidden=!!q.kind;
 $('diagram').innerHTML=q.diagram?E.reference(q.diagram):'';$('builder').replaceChildren();
 $('written').innerHTML=(q.fields||[]).map((f,i)=>f.options?
  `<fieldset class="answer-field choice-field" id="field-${i}" aria-describedby="note-${i}"><legend>${esc(f.label)}</legend><input type="hidden" id="answer-${i}" value=""><div class="answer-options">${f.options.map(option=>`<button type="button" class="answer-option" data-field="${i}" data-value="${esc(option)}" aria-pressed="false">${esc(option.charAt(0).toUpperCase()+option.slice(1))}</button>`).join('')}</div><p id="note-${i}" class="field-note small"></p></fieldset>`:
  `<div class="answer-field"><label for="answer-${i}">${esc(f.label)}</label><input id="answer-${i}" class="answer-input" autocomplete="off" spellcheck="false" maxlength="180" aria-describedby="note-${i}"><p id="note-${i}" class="field-note small"></p></div>`).join('');
 if(q.kind){const child=document.createElement('div');$('builder').append(child);editor=E.mount(child,q,$('diagramTools'));}
 $('feedback').hidden=true;$('feedback').replaceChildren();$('next').hidden=true;$('hintText').hidden=true;$('error').textContent='';$('check').disabled=false;$('hint').disabled=false;$('giveUp').hidden=true;
 QuestionReview.mount($('prompt').parentElement,reviewBank.id(q),loadReview);
 progress();save();
}
function mark(force=false){
 if(revealed)return;let result;
 if(q.fields){const values=q.fields.map((f,i)=>$('answer-'+i).value);const states=q.fields.map((f,i)=>C.markField(f,values[i],D));
  if(!force&&states.some(s=>s==='empty'||s==='unknown')){
   states.forEach((s,i)=>{$('note-'+i).textContent=s==='empty'?(q.fields[i].options?'Choose an answer, or choose “Show answer”.':'Enter an answer, or choose “Show answer”.'):s==='unknown'?'Not recognized. Use just the requested word or phrase, or ask your teacher.':'';});
   $('error').textContent='Check the highlighted fields. Your answers are preserved; no attempt has been recorded.';$('giveUp').hidden=false;return;
  }
  result=states.map(s=>s==='correct');
 }else result=C.check(q,editor.value(),D);
 revealed=true;const pass=result.every(Boolean)&&!force;C.record(state,q,pass,hinted||force);
 if(!hinted&&!force&&ChemistryMode.get()!=='teacher'){
  const now=Date.now(),item={id:'energy-'+now+'-'+Math.random().toString(36).slice(2),leafId:settings.leafId,grade:q.grade,strand:q.strand,score:P.questionScore(result),completedAt:now};
  try{results=P.merge(results,P.read(localStorage));results=P.append(results,item);localStorage.setItem(P.key,JSON.stringify(results));}catch{storageOK=false;results=P.append(results,item);}
 }
 save();progress();
 $('check').disabled=true;$('hint').disabled=true;$('giveUp').hidden=true;$('error').textContent='';
 $('written').querySelectorAll('input').forEach((i,n)=>{i.disabled=true;i.setAttribute('aria-invalid',String(!result[n]));$('note-'+n).textContent=result[n]?'Correct.':'Expected: '+q.fields[n].accept[0];});
 $('written').querySelectorAll('.answer-option').forEach(button=>{button.disabled=true;});
 $('written').querySelectorAll('.choice-field').forEach(field=>field.setAttribute('aria-invalid',String(!result[Number(field.id.slice(6))])));
 if(editor)editor.lock();
 $('feedback').innerHTML=`<h3>${result.filter(Boolean).length} / ${result.length} marks</h3><ul class="mark-list">${q.points.map((p,i)=>`<li class="${result[i]?'pass':'fail'}">${result[i]?'✓':'Review:'} ${esc(p)}</li>`).join('')}</ul><p>${esc(q.feedback)}</p><p class="${pass?'pass':'fail'}">${hinted||force?'Recorded as practice; a fresh unhinted answer is needed for mastery.':pass?'All marking points met.':'Review the feedback, then try a fresh question.'}</p>`;
 $('feedback').hidden=false;$('next').hidden=false;$('next').focus({preventScroll:true});
}
function filter(value){state.filter=value;start();$('prompt').focus();}
 $('strands').onclick=e=>{const b=e.target.closest('[data-strand]');if(b)filter(b.dataset.strand);};
 $('mixed').onclick=()=>filter('mixed');$('check').onclick=()=>mark();$('giveUp').onclick=()=>mark(true);
 $('hint').onclick=()=>{hinted=true;$('hintText').textContent=D.hints[q.strand]+' This question will count as practice.';$('hintText').hidden=false;};
 $('written').addEventListener('click',e=>{const button=e.target.closest('.answer-option');if(!button||revealed)return;const index=button.dataset.field;$('answer-'+index).value=button.dataset.value;$('field-'+index).querySelectorAll('.answer-option').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));$('note-'+index).textContent='';});
 $('written').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input:not([type=hidden])')){e.preventDefault();mark();}});
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.repeat&&revealed&&!e.isComposing&&!$('resetDialog').open&&document.querySelector('.workspace').contains(e.target)){e.preventDefault();e.stopPropagation();start();$('prompt').focus();}},true);
 $('next').onclick=()=>{start();$('prompt').focus();};$('reset').onclick=()=>$('resetDialog').showModal();
 $('resetDialog').addEventListener('close',()=>{if($('resetDialog').returnValue==='reset'){state=C.fresh();try{results=P.merge(results,P.read(localStorage)).filter(r=>r.leafId!==settings.leafId);localStorage.setItem(P.key,JSON.stringify(results));}catch{results=results.filter(r=>r.leafId!==settings.leafId);storageOK=false;}start();$('prompt').focus();}});
 $('quickMode').insertAdjacentHTML('beforeend',[1,2].map(grade=>`<option value="grade${grade}">${P.bands[grade]}</option>`).join('')+D.strands.map(g=>`<option value="${g.id}">${esc(g.name)} · ${P.bands[g.grade]}</option>`).join(''));$('quickMode').onchange=e=>filter(e.target.value);
 start();
 QuestionReview.requested(loadReview);
})();
