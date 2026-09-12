(function(root){
'use strict';
function normalize(s){return String(s).normalize('NFKC').toLowerCase().replace(/δ\s*h/g,'delta h').replace(/−/g,'-').replace(/\s+/g,' ').trim().replace(/\.$/,'').trim();}
function markField(field,value,data){
 const s=normalize(value);if(!s)return 'empty';
 if(field.accept.some(a=>normalize(a)===s))return 'correct';
 if(field.options?.some(option=>normalize(option)===s))return 'incorrect';
 if(/\b(not|or|neither|both)\b/.test(s))return 'incorrect';
 const known=data.questions.flatMap(q=>(q.fields||[]).flatMap(f=>f.accept));
 if(known.some(a=>normalize(a)===s)||['maximum','average','heat','enthalpy','temperature','time','created','destroyed','lost','more bonds','yes','no','absorbs','releases','increase','decrease'].includes(s))return 'incorrect';
 return 'unknown';
}
function endY(m,end){return end.anchor?m[end.anchor]:end.y;}
function attached(anchor){return {anchor};}
function model(q){
 const e=q.editor||{},m={r:220,p:q.polarity==='endo'||e.type==='repair'?155:300,peak:85,left:e.formula?.[0]||'Reactants',right:e.formula?.[1]||'Products',vertical:'Energy',horizontal:'Progress of reaction',pathLabel:'Catalysed',arrows:{}};
 if(e.type==='catalyst')Object.assign(m,{r:220,p:300,peak:140});
 for(const a of e.arrows||[])m.arrows[a]={x:a==='ea'?(e.eaX||285):560,tail:attached('r'),head:attached(a==='ea'?'peak':'p')};
 return m;
}
function initial(q){const m=model(q),e=q.editor;
 if(!e.fixed)m.p=m.r;if(e.type==='profile')m.peak=m.r;
 if(e.type==='catalyst'){m.peak=85;m.pathLabel='';}
 if(e.formula)m.left=m.right='';if(e.axes)m.vertical=m.horizontal='';
 m.arrows={};
 if(e.type==='repair'){m.arrows={delta:{x:560,tail:attached('r'),head:attached('peak')},ea:{x:285,tail:attached('p'),head:attached('peak')}};}
 return m;
}
function check(q,m,data){
 const e=q.editor,expected=model(q);
 const arrow=a=>{const ar=m.arrows[a];return !!ar&&ar.tail.anchor==='r'&&ar.head.anchor===(a==='ea'?'peak':'p')&&(a==='ea'?m.peak<m.r:m.r!==m.p);};
 const accepts=(key,s)=>data.vocab[key].some(a=>normalize(a)===normalize(s));
 const checks={left:m.left===expected.left,right:m.right===expected.right,order:q.polarity==='endo'?m.p<m.r:m.p>m.r,peak:m.peak<Math.min(m.r,m.p),ea:arrow('ea'),delta:arrow('delta'),vertical:accepts('ENERGY_AXIS',m.vertical),horizontal:accepts('PROGRESS_AXIS',m.horizontal),ends:m.r===220&&m.p===300,barrier:m.peak>85&&m.peak<Math.min(m.r,m.p),pathLabel:['catalysed','catalyzed','catalysed pathway','catalyzed pathway'].includes(normalize(m.pathLabel))};
 return q.checks.map(c=>!!checks[c]);
}
function fresh(){return {version:2,attempt:0,records:[],filter:'mixed'};}
function load(raw,data){try{const s=JSON.parse(raw);if(s.version!==2||!Array.isArray(s.records))return fresh();const ids=new Set(data.questions.map(q=>q.id));s.records=s.records.filter(r=>ids.has(r.id)&&Number.isInteger(r.at)&&r.at>0&&typeof r.pass==='boolean'&&typeof r.hinted==='boolean');s.attempt=Math.max(0,...s.records.map(r=>r.at));if(['classify','transfer','activation'].includes(s.filter))s.filter='energy';s.filter=data.strands.some(g=>g.id===s.filter)||['grade1','grade2'].includes(s.filter)?s.filter:'mixed';return s;}catch{return fresh();}}
function status(s,strand,data){
 const rows=s.records.filter(r=>data.questions.find(q=>q.id===r.id).strand===strand);
 // An error reopens the strand: subsequent independent successes rebuild evidence.
 const lastFail=rows.reduce((n,r,i)=>!r.pass||r.hinted?i:n,-1);
 const wins=rows.slice(lastFail+1).filter(r=>r.pass&&!r.hinted);
 const unique=[...new Map(wins.map(r=>[r.id,r])).values()];
 const qs=unique.map(r=>data.questions.find(q=>q.id===r.id));
 const variety=new Set(qs.map(q=>q.family)).size>=2&&(strand!=='energy'||['C','E','A'].every(prefix=>qs.some(q=>q.id.startsWith(prefix))));
 const polarities=!['draw','bonds'].includes(strand)||['exo','endo'].every(p=>qs.some(q=>q.polarity===p&&(strand!=='draw'||q.editor.type==='profile')));
 const reasoning=strand!=='bonds'||['explain','comparison'].every(f=>qs.some(q=>q.family===f));
 const delayed=unique.length>=3&&unique.some(r=>r.at-wins[0].at>=4);
 return {count:Math.min(unique.length,3),mastered:unique.length>=3&&variety&&polarities&&reasoning&&delayed,variety,polarities,delayed};
}
function next(s,data,current){
 let pool=data.questions.filter(q=>s.filter==='mixed'||q.strand===s.filter||s.filter==='grade'+q.grade);
 const incomplete=pool.filter(q=>!status(s,q.strand,data).mastered);
 if(incomplete.length)pool=incomplete;
 if(pool.length>1)pool=pool.filter(q=>q.id!==current);
 const last=q=>s.records.filter(r=>r.id===q.id).at(-1)?.at||0;
 pool.sort((a,b)=>{
  const seenA=last(a),seenB=last(b);
  if(seenA!==seenB)return seenA-seenB;
  const count=id=>s.records.filter(r=>data.questions.find(q=>q.id===r.id).strand===id).length;
  return count(a.strand)-count(b.strand)||data.questions.indexOf(a)-data.questions.indexOf(b);
 });return pool[0];
}
function record(s,q,pass,hinted){s.attempt++;s.records.push({id:q.id,at:s.attempt,pass:!!pass,hinted:!!hinted});}
const api={model,initial,check,normalize,markField,endY,fresh,load,status,next,record};root.EnergyCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);

