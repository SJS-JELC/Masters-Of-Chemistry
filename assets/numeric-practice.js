(function(root){
  "use strict";
  const byId=id=>document.getElementById(id);
  let active;
  function mount({mastery,renderQuestion,slug,leafId,title}){
    const params=new URLSearchParams(location.search),grade=[1,2,3].includes(Number(params.get("grade")))?Number(params.get("grade")):1;
    const practice=params.get("practice")==="grade"||(!params.has("practice")&&params.has("grade"))?"grade":"mastery";
    const key=practice==="mastery"?slug+"-mastery-v1":slug+"-practice-grade-"+grade+"-v1";
    const progressModel=root.MastersProgress,recordsKey=progressModel.key;
    let records=[];try{records=progressModel.read(localStorage);}catch(_){}
    const ids=mastery.families.map(f=>f.id);
    function read(k,fallback){try{return JSON.parse(localStorage.getItem(k))||fallback;}catch(_){return fallback;}}
    let session=read(key,null);
    if(!mastery.validate(session)||session.completed||(session.practice||"mastery")!==practice||(practice==="grade"&&session.grade!==grade)||session.selected.length!==ids.length)session=mastery.create(ids,crypto.getRandomValues(new Uint32Array(1))[0],{practice,grade});
    const stack=byId("questionPanel").parentElement;
    const progress=document.createElement("section");progress.className="panel practice-progress";progress.setAttribute("aria-label","Practice progress");
    progress.innerHTML='<div class="practice-heading"><strong id="practiceTitle"></strong><span id="practiceBand"></span></div><div id="bandProgress" class="band-progress"></div><p id="practicePosition"></p><p id="storageWarning" class="storage-warning" role="status" hidden></p>';
    stack.prepend(progress);
    document.querySelector(".layout").classList.add("pupil-practice-layout");
    document.querySelector("h1").textContent=title;
    const lede=document.querySelector(".lede");if(lede)lede.textContent=practice==="mastery"?"Practise each question type and build mastery across all three levels.":"Keep practising this grade band. Each level has its own mastery record.";
    function warn(){byId("storageWarning").hidden=false;byId("storageWarning").textContent="This browser cannot save progress. You can still practise in this tab.";}
    function save(){try{localStorage.setItem(key,JSON.stringify(session));}catch(_){warn();}}
    function refreshRecords(){try{records=progressModel.merge(progressModel.read(localStorage),records);}catch(_){}}
    function record(){
      const c=session.current,points=c.correct.slice();
      if(c.selfCheck==="pass"||c.selfCheck==="fail")points.push(c.selfCheck==="pass");
      const result={id:session.id+"-"+session.submitted,leafId,grade:c.grade,score:progressModel.questionScore(points),completedAt:Date.now(),family:c.family,assisted:c.assisted};
      refreshRecords();records=progressModel.append(records,result);
      try{localStorage.setItem(recordsKey,JSON.stringify(records));}catch(_){warn();}
    }
    function gauge(){
      byId("practiceTitle").textContent=practice==="mastery"?"MASTERY":mastery.bands[grade]+" practice";
      byId("practiceBand").textContent=session.completed?"Complete":mastery.bands[session.grade];
      refreshRecords();byId("bandProgress").replaceChildren(...[1,2,3].map(g=>{const state=progressModel.summarise(records,leafId,g),text=state.mastery===null?"Not assessed":Math.round(state.mastery)+"%";const box=document.createElement("div");box.dataset.grade=g;box.dataset.mastered=state.mastered;box.className="band-score";box.setAttribute("aria-label",mastery.bands[g]+": "+text+(state.mastered?", mastered":", not yet mastered"));const label=document.createElement("span"),value=document.createElement("strong");label.textContent=mastery.bands[g];value.textContent=text;box.append(label,value);return box;}));
      const family=session.current&&mastery.families.find(f=>f.id===session.current.family).label;
      byId("practicePosition").textContent=session.completed?"Mastery achieved at every grade band.":family+" · "+(practice==="grade"?"Cycle "+(session.cycle||1):session.round==="review"?"Mastery review":"One of each");
    }
    function message(){const c=session.current;if(c.selfCheck==="pending")return "Compare your displayed equation with the model below before continuing.";return c.correct.every(Boolean)&&c.selfCheck!=="fail"?"Correct. Your first attempt has been recorded.":"Your first attempt has been recorded. Review the worked answer before continuing.";}
    function markInputs(correct){correct.forEach((ok,i)=>{const input=byId("response-"+i);input.classList.toggle("pupil-correct",ok);input.classList.toggle("pupil-incorrect",!ok);input.setAttribute("aria-invalid",String(!ok));});}
    function help(index){const c=session.current;if(!c)return;if(Number.isInteger(index)&&!c.scaffoldParts.includes(index))c.scaffoldParts.push(index);if(!c.submitted)c.assisted=true;save();}
    function selfCheck(question){
      const panel=byId("drawingCheck");panel.hidden=session.current.selfCheck!=="pending";
      if(panel.hidden)return;
      panel.innerHTML='<p>Check your drawing: every atom, bond and balancing coefficient should match. Your drawing is self-checked.</p><div class="reaction-diagram">'+question.reaction.svg+'</div><div class="pupil-answer-actions"><button type="button" data-drawing="yes">My drawing matches</button><button type="button" data-drawing="no">My drawing needs work</button></div>';
      panel.querySelectorAll("[data-drawing]").forEach(button=>button.addEventListener("click",()=>{if(!mastery.confirm(session,button.dataset.drawing==="yes"))return;record();save();gauge();panel.hidden=true;byId("nextPupilQuestion").hidden=false;byId("pupilFeedback").textContent=message();}));
    }
    function showQuestion(){
      gauge();save();
      if(session.completed){byId("questionPanel").innerHTML='<h2>Mastery complete</h2><p>You have achieved mastery at all three grade bands.</p><a class="site-back-link" href="../../Masters%20of%20IGCSE%20Chemistry.html?mode=pupil">Return to the activity map</a>';byId("answerPanel").hidden=true;return;}
      const question=mastery.generate(session);renderQuestion(question);
      const panel=byId("questionPanel");
      panel.insertAdjacentHTML("beforeend",'<div class="pupil-answer-actions"><button id="checkPupilAnswer" type="button">Check answers</button><button id="nextPupilQuestion" type="button" hidden>Next question</button></div><p id="pupilFeedback" role="status"></p><section id="drawingCheck" hidden></section>');
      question.responses.forEach((_,i)=>{byId("response-"+i).value=session.current.responses[i]||"";});
      session.current.scaffoldParts.slice().forEach(index=>panel.querySelector('[data-scaffold-toggle="'+index+'"]')?.click());
      panel.querySelectorAll(".response-input").forEach((input,i)=>input.addEventListener("input",()=>{session.current.responses[i]=input.value;input.classList.remove("pupil-correct","pupil-incorrect");input.removeAttribute("aria-invalid");save();}));
      byId("checkPupilAnswer").addEventListener("click",()=>{
        const outcome=mastery.submit(session,question.responses.map((_,i)=>byId("response-"+i).value));
        if(!outcome.accepted){byId("pupilFeedback").textContent=outcome.message;return;}
        markInputs(outcome.correct);byId("nextPupilQuestion").hidden=outcome.awaitingSelfCheck;byId("checkPupilAnswer").textContent="Check again";
        byId("pupilFeedback").textContent=outcome.first||outcome.awaitingSelfCheck?message():outcome.correct.every(Boolean)?"All answers are now correct. Your recorded first attempt is unchanged.":"Keep checking your values. Your recorded first attempt is unchanged.";
        byId("answerPanel").hidden=false;if(outcome.first&&!outcome.correct.every(Boolean))byId("answerPanel").open=true;
        if(outcome.first&&!outcome.awaitingSelfCheck)record();selfCheck(question);gauge();save();
      });
      byId("nextPupilQuestion").addEventListener("click",()=>{refreshRecords();mastery.next(session,progressModel.achievement(records,leafId).achievedGrade);showQuestion();byId("questionPanel").scrollIntoView({block:"start"});});
      if(session.current.submitted){markInputs(question.responses.map((r,i)=>mastery.mark(session.current.responses[i]||"",r.expected)));byId("nextPupilQuestion").hidden=session.current.selfCheck==="pending";byId("checkPupilAnswer").textContent="Check again";byId("pupilFeedback").textContent=message();byId("answerPanel").hidden=false;selfCheck(question);}
      else byId("answerPanel").hidden=true;
      save();
    }
    byId("questionPanel").addEventListener("click",event=>{const scaffold=event.target.closest("[data-scaffold-toggle]"),diagram=event.target.closest("[data-show-diagram]");if(scaffold)help(Number(scaffold.dataset.scaffoldToggle));if(diagram)help();},true);
    active={help};showQuestion();
  }
  root.NumericPractice={mount,useScaffold:index=>active?.help(index)};
})(globalThis);
