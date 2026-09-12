(function(root){
'use strict';
const C=EnergyCore,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let serial=0;
function svg(m,e={},interactive=false,ghost=null,guides=false){
 const colours={ea:'#ffde59',delta:'#54f5b5'};
 const marker='energy-arrow-'+(++serial),cat=e.type==='catalyst'||e.overlay;
 const act=(a,label)=>interactive?`data-act="${a}" tabindex="0" role="button" aria-label="${esc(label)}"`:'';
 const curve=(n,color,dashed=false)=>`<path d="M100 ${n.r} H210 C250 ${n.r} 255 ${n.peak} 320 ${n.peak} S380 ${n.p} 410 ${n.p} H525" fill="none" stroke="${color}" stroke-width="3" ${dashed?'stroke-dasharray="9 7"':''}/>`;
 const line=(key,x1,x2)=>`<g ${act('level:'+key,(key==='r'?'Left':'Right')+' energy line. Drag vertically or use up and down keys.')}><rect x="${x1}" y="${m[key]-14}" width="${x2-x1}" height="28" fill="transparent"/><line x1="${x1}" x2="${x2}" y1="${m[key]}" y2="${m[key]}" stroke="#55f6ff" stroke-width="3"/></g>`;
 const label=(key,x)=>{const value=m[key],index=e.formula?.indexOf(value);return `<text x="${x}" y="${m[key==='left'?'r':'p']-13}" ${index>=0?act('label:'+index,value+'. Drag to either line.'):''}>${esc(value||'Drop formula')}</text>`;};
 const arrows=Object.entries(m.arrows).map(([name,a])=>{
 const ty=C.endY(m,a.tail),hy=C.endY(m,a.head),text=e.numberArrows?(name==='ea'?'1':'2'):(name==='ea'?'Eₐ':'ΔH');
 return `<g><g ${act('shaft:'+name,text+' arrow. Drag to move; left/right keys reposition; Delete removes.')}><line x1="${a.x}" x2="${a.x}" y1="${ty}" y2="${hy}" stroke="transparent" stroke-width="24"/><line x1="${a.x}" x2="${a.x}" y1="${ty}" y2="${hy}" stroke="${name==='ea'?'#ffde59':'#54f5b5'}" stroke-width="3" marker-end="url(#${marker}-${name})"/><text x="${a.x+10}" y="${(ty+hy)/2-5}" style="fill:${colours[name]}">${text}</text></g>${interactive?['tail','head'].map(end=>`<circle ${act(end+':'+name,text+' '+end+'. Drag or use up/down keys; Enter then select a level to attach.')} cx="${a.x}" cy="${end==='tail'?ty:hy}" r="18" fill="transparent"/>`).join(''):''}</g>`;
 }).join('');
 const description=`Energy diagram. Left: ${m.left||'unlabelled'}; right: ${m.right||'unlabelled'}. Right level ${m.p<m.r?'above':m.p>m.r?'below':'equal to'} left.${e.type==='levels'?'':` Peak ${m.peak<Math.min(m.r,m.p)?'above both end levels':'not above both end levels'}.`} ${Object.entries(m.arrows).map(([n,a])=>`${e.numberArrows?(n==='ea'?'Arrow 1':'Arrow 2'):n==='ea'?'Activation energy':'Delta H'}: ${a.tail.anchor||'free tail'} to ${a.head.anchor||'free head'}.`).join(' ')}`;
 return `<svg class="energy-svg" viewBox="0 0 640 415" ${interactive?'role="group"':'role="img"'} aria-label="${esc(description)}"><title>${esc(description)}</title><defs>${Object.entries(colours).map(([name,colour])=>`<marker id="${marker}-${name}" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${colour}"/></marker>`).join('')}</defs><path d="M65 32V365H605" stroke="#8c9dbc" fill="none" stroke-width="2"/><text transform="translate(24 255) rotate(-90)">${esc(m.vertical||'Axis?')}</text><text x="205" y="404">${esc(m.horizontal||'Axis?')}</text>${cat?curve({r:220,p:300,peak:85},'#b8c4dc',!e.overlay):''}${e.type==='levels'?'':curve(m,'#55f6ff',!!e.overlay)}${line('r',100,210)}${line('p',410,525)}${label('left',100)}${label('right',410)}${e.letters?`<text x="330" y="${m.peak-16}">B</text>`:''}${interactive&&e.type!=='levels'?`<circle ${act('level:peak','Peak. Drag vertically or use up/down keys.')} cx="320" cy="${m.peak}" r="20" fill="transparent"/>`:''}${guides?['r','p',...(e.type==='levels'?[]:['peak'])].map(k=>`<line x1="85" x2="595" y1="${m[k]}" y2="${m[k]}" stroke="#9aa8c1" stroke-width="1" stroke-dasharray="3 7" opacity=".5" pointer-events="none"/>`).join(''):''}${arrows}${cat?`<text x="385" y="35">${e.overlay?'— P':'– – Original'}</text><text x="385" y="62">${e.overlay?'– – Q':'— '+esc(m.pathLabel||'New pathway')}</text>`:''}${ghost?`<text class="drag-ghost" x="${clamp(ghost.x,80,440)}" y="${clamp(ghost.y,45,350)}">${esc(ghost.text)}</text>`:''}</svg>`;
}
function reference(code){
 const m=C.model({polarity:code.startsWith('Y')?'endo':'exo'}),e={letters:true};m.left='A';m.right='C';
 if(code==='Y-arrows'){e.numberArrows=true;m.arrows={ea:{x:280,tail:{anchor:'r'},head:{anchor:'peak'}},delta:{x:560,tail:{anchor:'r'},head:{anchor:'p'}}};}
 if(code==='X-wrong')m.arrows={delta:{x:560,tail:{anchor:'peak'},head:{anchor:'p'}}};
 if(code==='Y-axes'){m.vertical='';m.horizontal='';}
 if(code==='Z'){Object.assign(m,{r:220,p:300,peak:145});e.overlay=true;e.letters=false;}
 return '<div class="diagram-card">'+svg(m,e)+'</div>';
}
function mount(host,q,tools,restoredModel){
 const e=q.editor;let m=restoredModel?clone(restoredModel):C.initial(q),history=[],locked=false,selected='',drag=null,ghost=null;
 tools.innerHTML='<button type="button" class="quiet" data-tool="undo">Undo</button><button type="button" class="quiet" data-tool="reset">Reset</button>';
 host.innerHTML=`<div class="editor-tray" aria-label="Diagram pieces"></div><div class="diagram-card edit-canvas"></div><p class="editor-status small" role="status"></p><div class="editor-fields controls"></div>`;
 const canvas=host.querySelector('.edit-canvas'),tray=host.querySelector('.editor-tray'),status=host.querySelector('.editor-status'),fields=host.querySelector('.editor-fields');
 if(e.axes)fields.innerHTML=['vertical','horizontal'].map(k=>`<div class="control"><label for="axis-${k}">${k==='vertical'?'Vertical':'Horizontal'} axis</label><input id="axis-${k}" data-text="${k}" autocomplete="off"></div>`).join('');
 if(e.pathLabel)fields.innerHTML='<div class="control"><label for="pathLabel">Label the new pathway</label><input id="pathLabel" data-text="pathLabel" autocomplete="off"></div>';
 function render(focus){
  canvas.innerHTML=svg(m,e,!locked,ghost,!!drag&&['head','tail','shaft','new'].includes(drag.act.split(':')[0]));
  tray.innerHTML=(e.arrows||[]).filter(a=>!m.arrows[a]).map(a=>`<button class="piece" data-new="${a}" ${locked?'disabled':''}>${a==='ea'?'Eₐ · Activation energy':'ΔH · Enthalpy change'}</button>`).join('')+(e.formula||[]).map((f,i)=>!['left','right'].some(k=>m[k]===f)?`<button class="piece" data-act="label:${i}" ${locked?'disabled':''}>${esc(f)}</button>`:'').join('');
  tools.querySelector('[data-tool=undo]').disabled=locked||!history.length;tools.querySelector('[data-tool=reset]').disabled=locked;
  if(focus)host.querySelector(`[data-act="${focus}"]`)?.focus({preventScroll:true});
 }
 const remember=()=>{history.push(clone(m));if(history.length>80)history.shift();};
 function point(ev){const rect=canvas.querySelector('svg').getBoundingClientRect();return {x:(ev.clientX-rect.left)*640/rect.width,y:(ev.clientY-rect.top)*415/rect.height};}
 function snap(end,x){if(end.anchor)return end;const tolerance=18*640/canvas.querySelector('svg').getBoundingClientRect().width;const candidates=['r','p',...(e.type==='levels'?[]:['peak'])];const near=candidates.sort((a,b)=>Math.abs(m[a]-end.y)-Math.abs(m[b]-end.y)||Math.abs((a==='r'?150:a==='p'?470:320)-x)-Math.abs((b==='r'?150:b==='p'?470:320)-x))[0];return Math.abs(m[near]-end.y)<=tolerance?{anchor:near}:end;}
 function putLabel(index,target){const f=e.formula[index];for(const k of ['left','right'])if(m[k]===f)m[k]='';if(target)m[target==='r'?'left':'right']=f;}
 function isMovable(k){return !e.fixed&&!(k==='r'&&e.fixedR);}
 function setLevel(k,y){if(!isMovable(k))return;m[k]=clamp(y,70,330);if(e.type==='catalyst'&&k!=='peak'&&Math.abs(m[k]-(k==='r'?220:300))<14)m[k]=k==='r'?220:300;}
 function attach(target){const [part,name]=selected.split(':');if(part==='label'&&target!=='peak'){remember();putLabel(Number(name),target);selected='';render();status.textContent='Formula placed.';return true;}if(['head','tail'].includes(part)&&m.arrows[name]){remember();m.arrows[name][part]={anchor:target};selected='';render();status.textContent='Endpoint attached.';return true;}return false;}
 function newArrow(name){remember();m.arrows[name]={x:name==='ea'?(e.eaX||280):560,tail:{y:255},head:{y:165}};selected='head:'+name;render(selected);status.textContent='Position the arrow ends.';}
 host.addEventListener('pointerdown',down);
 function down(ev){if(locked||ev.button>0)return;const item=ev.target.closest('[data-act],[data-new]');if(!item)return;
  if(item.dataset.new){ev.preventDefault();newArrow(item.dataset.new);const p=point(ev);drag={act:'new:'+item.dataset.new,start:p,base:clone(m),moved:false};return;}
  const action=item.dataset.act,[part,name]=action.split(':');
  if(part==='level'&&selected&&attach(name)){ev.preventDefault();return;}
  if(part==='level'&&!isMovable(name)){status.textContent='This level is supplied and fixed.';return;}
  ev.preventDefault();remember();selected=action;drag={act:action,start:point(ev),base:clone(m),moved:false};
  status.textContent=part==='label'?'Choose a line.':part==='head'||part==='tail'?'Choose a level.':'';
 }
 function move(ev){if(!drag||locked)return;const p=point(ev),dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;if(!drag.moved)return;ev.preventDefault();m=clone(drag.base);const [part,name]=drag.act.split(':');
  if(part==='level')setLevel(name,drag.base[name]+dy);
  if(part==='label')ghost={...p,text:e.formula[Number(name)]};
  if(['head','tail'].includes(part)){const a=m.arrows[name];a.x=clamp(drag.base.arrows[name].x+dx,85,590);a[part]=snap({y:clamp(C.endY(drag.base,drag.base.arrows[name][part])+dy,55,340)},a.x);if(a[part].anchor==='peak'&&Math.abs(a.x-320)<24)a.x=320;}
  if(part==='shaft'){const a=m.arrows[name];a.x=clamp(a.x+dx,85,590);for(const end of ['tail','head'])a[end]={y:clamp(C.endY(drag.base,drag.base.arrows[name][end])+dy,55,340)};}
  if(part==='new'){m.arrows[name]={x:clamp(p.x,85,590),tail:{y:clamp(p.y+40,55,340)},head:{y:clamp(p.y-40,55,340)}};}
  render();
 }
 function up(ev){if(!drag)return;const [part,name]=drag.act.split(':'),p=point(ev),moved=drag.moved;
  if(moved){if(part==='label'){const target=p.x<320?'r':'p';putLabel(Number(name),Math.abs(p.y-m[target])<=50?target:null);}
   if(['head','tail'].includes(part))m.arrows[name][part]=snap(m.arrows[name][part],m.arrows[name].x);
   if(['shaft','new'].includes(part))for(const end of ['tail','head'])m.arrows[name][end]=snap(m.arrows[name][end],m.arrows[name].x);selected='';}
  ghost=null;drag=null;if(moved)status.textContent='';render(!moved&&part!=='new'?part+':'+name:undefined);
 }
 window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
 function cancel(){if(drag){m=drag.base;drag=null;ghost=null;render();}}
 host.addEventListener('keydown',ev=>{
  if(locked)return;const item=ev.target.closest('[data-act],[data-new]');if(!item)return;
  if(item.dataset.new&&['Enter',' '].includes(ev.key)){ev.preventDefault();newArrow(item.dataset.new);return;}
  const action=item.dataset.act;if(!action)return;const [part,name]=action.split(':');
  if(['Enter',' '].includes(ev.key)){ev.preventDefault();if(part==='level'&&selected&&attach(name))return;selected=action;status.textContent='Selected. Focus a target line or peak and press Enter to attach, or use arrow keys to move.';return;}
  if(ev.key==='Escape'){selected='';status.textContent='Selection cleared.';return;}
  if(['Delete','Backspace'].includes(ev.key)){ev.preventDefault();remember();if(part==='label')putLabel(Number(name),null);if(['head','tail','shaft'].includes(part))delete m.arrows[name];render();return;}
  if(!ev.key.startsWith('Arrow'))return;ev.preventDefault();remember();const dy=ev.key==='ArrowUp'?-20:ev.key==='ArrowDown'?20:0,dx=ev.key==='ArrowLeft'?-10:ev.key==='ArrowRight'?10:0;
  if(part==='level')setLevel(name,m[name]+dy);
  if(['head','tail'].includes(part)){const a=m.arrows[name];if(dx)a.x=clamp(a.x+dx,85,590);if(dy){const y=C.endY(m,a[part]);const targets=['r','p',...(e.type==='levels'?[]:['peak'])].filter(k=>dy<0?m[k]<y:m[k]>y).sort((a,b)=>Math.abs(m[a]-y)-Math.abs(m[b]-y));a[part]=targets.length?{anchor:targets[0]}:{y:clamp(y+dy,55,340)};}}
  if(part==='shaft'){const a=m.arrows[name];a.x=clamp(a.x+dx,85,590);if(dy)for(const end of ['tail','head'])a[end]=snap({y:clamp(C.endY(m,a[end])+dy,55,340)});}
  render(action);
 });
 tools.onclick=ev=>{if(locked)return;const tool=ev.target.dataset.tool;if(tool==='undo'&&history.length){m=history.pop();selected='';syncText();render();}if(tool==='reset'){remember();m=C.initial(q);selected='';syncText();render();}};
 function syncText(){fields.querySelectorAll('[data-text]').forEach(input=>input.value=m[input.dataset.text]);}
 fields.addEventListener('change',ev=>{if(!locked&&ev.target.dataset.text){remember();m[ev.target.dataset.text]=ev.target.value;render();}});
 fields.addEventListener('input',ev=>{if(!locked&&ev.target.dataset.text){m[ev.target.dataset.text]=ev.target.value;canvas.innerHTML=svg(m,e,true);}});
 render();return {value:()=>clone(m),lock:()=>{locked=true;selected='';render();fields.querySelectorAll('input').forEach(i=>i.disabled=true);},destroy:()=>{tools.onclick=null;tools.replaceChildren();window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);host.removeEventListener('pointerdown',down);host.replaceChildren();},model:()=>'<div class="diagram-card">'+svg(C.model(q),e)+'</div>'};
}
root.EnergyEditor={mount,reference,svg};
})(globalThis);


