(function(root){
  "use strict";
  const byId=id=>document.getElementById(id);
  let active;
  function mountStandalone({mastery,renderQuestion,slug,leafId,title}){
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
      refreshRecords();byId("bandProgress").replaceChildren(...[1,2,3].map(g=>{const state=progressModel.summarise(records,leafId,g);const box=document.createElement("div");box.dataset.grade=g;box.dataset.mastered=state.mastered;box.className="band-score";const label=document.createElement("span");label.textContent=mastery.bands[g];box.append(label,progressModel.masteryBar(state.score,mastery.bands[g]+' mastery',g));return box;}));
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
      if(session.completed){byId("questionPanel").innerHTML='<h2>Mastery complete</h2><p>You have achieved mastery at all three grade bands.</p><a class="site-back-link" href="../../index.html?mode=pupil">Return to the activity map</a>';byId("answerPanel").hidden=true;return;}
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

  // Test mode deliberately uses the same NumericMastery adapter as pupil
  // practice.  Only persistence, result reporting and question advancement
  // are owned by the test bridge.
  function snapshotValue(value) {
    if (value == null) return null;
    let candidate = value;
    if (typeof candidate === "string") {
      try { candidate = JSON.parse(candidate); } catch (_) { return null; }
    }
    if (candidate && typeof candidate === "object") {
      if (candidate.snapshot && typeof candidate.snapshot === "object") candidate = candidate.snapshot;
      if (candidate.session && typeof candidate.session === "object") candidate = candidate.session;
    }
    return candidate && typeof candidate === "object" ? candidate : null;
  }

  function copySnapshot(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return null; }
  }

  function randomSeed() {
    if (root.crypto?.getRandomValues) return root.crypto.getRandomValues(new Uint32Array(1))[0];
    return Math.floor(Math.random() * 4294967296);
  }

  async function mountTest({mastery,renderQuestion,slug,leafId,title}, test) {
    const params = new URLSearchParams(location.search);
    const requestedGrade = Number(test.level ?? params.get("grade"));
    const grade = [1, 2, 3].includes(requestedGrade) ? requestedGrade : 1;
    const ids = mastery.families.map(f => f.id);
    const validTestSession = value => {
      const session = snapshotValue(value);
      return session && (session.practice === undefined || session.practice === "grade") && session.grade === grade &&
        session.selected?.length === ids.length && mastery.validate(session);
    };
    let session = validTestSession(test.state) ? snapshotValue(test.state) : null;
    const previous = validTestSession(test.previous) ? snapshotValue(test.previous) : null;
    // The previous snapshot is the seed for the next question. Calling the
    // fixed-grade core here rotates the queued family without changing level.
    if (!session) {
      if (previous) {
        session = previous;
        try { mastery.next(session); } catch (_) { session = null; }
      }
      if (!session) session = mastery.create(ids, randomSeed(), {practice: "grade", grade});
    }
    session.practice = "grade";
    session.grade = grade;
    session.testSessionId = test.sessionId ?? params.get("testSession") ?? null;
    session.testAttemptId = test.attemptId ?? params.get("testAttempt") ?? null;
    const bridge = root.TestModeBridge;
    let resultInFlight = false;
    let question;

    function save() {
      const saved = copySnapshot(session);
      if (!saved || typeof bridge.save !== "function") return;
      try { return Promise.resolve(bridge.save(saved)); } catch (_) { return Promise.resolve(); }
    }

    function resultPayload() {
      const c = session.current;
      const points = c.correct.slice();
      if (c.selfCheck === "pass" || c.selfCheck === "fail") points.push(c.selfCheck === "pass");
      const score = points.length ? (points.every(Boolean) ? 1 : points.some(Boolean) ? 0.5 : 0) : 0;
      const existing = c.testResult;
      if (existing && [0, 0.5, 1].includes(existing.score)) return existing;
      const payload = {
        score,
        independent: !c.assisted,
        completedAt: Date.now(),
        evidence: { score, family: c.family, grade: c.grade, questionId: question?.reviewId ?? null,
          correct: c.correct.slice(), selfCheck: c.selfCheck ?? null, assisted: !!c.assisted }
      };
      c.testResult = payload;
      return payload;
    }

    async function emitResult() {
      if (!session.current?.submitted || session.current.selfCheck === "pending" ||
          typeof bridge.result !== "function" || resultInFlight) return;
      resultInFlight = true;
      const payload = resultPayload();
      // The snapshot is durable before the scheduler receives the result. A
      // restored submitted question can therefore safely re-emit this payload.
      await save();
      try { await bridge.result(payload); } catch (_) { /* the bridge may retry on restore */ }
      resultInFlight = false;
    }

    function setFeedback(value) {
      session.current.testFeedback = String(value ?? "");
      const feedback = byId("pupilFeedback");
      if (feedback) feedback.textContent = session.current.testFeedback;
    }

    function markInputs(correct) {
      correct.forEach((ok, index) => {
        const input = byId("response-" + index);
        if (!input) return;
        input.classList.toggle("pupil-correct", ok);
        input.classList.toggle("pupil-incorrect", !ok);
        input.setAttribute("aria-invalid", String(!ok));
      });
    }

    function help(index) {
      const c = session.current;
      if (!c) return;
      let changed = false;
      if (Number.isInteger(index) && !c.scaffoldParts.includes(index)) { c.scaffoldParts.push(index); changed = true; }
      if (!c.submitted && !c.assisted) { c.assisted = true; changed = true; }
      if (changed) save();
    }

    function drawingCheck(currentQuestion) {
      const panel = byId("drawingCheck");
      if (!panel) return;
      panel.hidden = session.current.selfCheck !== "pending";
      if (panel.hidden) return;
      panel.innerHTML = '<p>Check your drawing: every atom, bond and balancing coefficient should match. Your drawing is self-checked.</p><div class="reaction-diagram">' + currentQuestion.reaction.svg + '</div><div class="pupil-answer-actions"><button type="button" data-drawing="yes">My drawing matches</button><button type="button" data-drawing="no">My drawing needs work</button></div>';
      panel.querySelectorAll("[data-drawing]").forEach(button => button.addEventListener("click", async () => {
        if (!mastery.confirm(session, button.dataset.drawing === "yes")) return;
        setFeedback(session.current.correct.every(Boolean) && button.dataset.drawing === "yes" ? "Correct. Your first attempt has been recorded." : "Your first attempt has been recorded. Review the worked answer before continuing.");
        await emitResult();
        await save();
        panel.hidden = true;
        const next = byId("nextPupilQuestion");
        if (next) next.hidden = false;
      }));
    }

    function restoreScaffoldValues(panel) {
      const values = session.current.workingValues || {};
      panel.querySelectorAll(".working-input").forEach(input => {
        if (Object.prototype.hasOwnProperty.call(values, input.id)) input.value = values[input.id];
      });
    }

    async function showQuestion() {
      question = mastery.generate(session);
      renderQuestion(question);
      const panel = byId("questionPanel");
      panel.insertAdjacentHTML("beforeend", '<div class="pupil-answer-actions"><button id="checkPupilAnswer" type="button">Check answers</button><button id="nextPupilQuestion" type="button" hidden>Next question</button></div><p id="pupilFeedback" role="status"></p><section id="drawingCheck" hidden></section>');
      const c = session.current;
      question.responses.forEach((_, index) => { const input = byId("response-" + index); if (input) input.value = c.responses[index] || ""; });
      c.scaffoldParts.slice().forEach(index => panel.querySelector('[data-scaffold-toggle="' + index + '"]')?.click());
      restoreScaffoldValues(panel);
      panel.querySelectorAll(".response-input").forEach((input, index) => input.addEventListener("input", () => {
        c.responses[index] = input.value;
        input.classList.remove("pupil-correct", "pupil-incorrect"); input.removeAttribute("aria-invalid");
        save();
      }));
      panel.querySelectorAll(".working-input").forEach(input => input.addEventListener("input", () => {
        c.workingValues = c.workingValues || {}; c.workingValues[input.id] = input.value; save();
      }));
      panel.addEventListener("click", event => {
        const scaffold = event.target.closest?.("[data-scaffold-toggle]");
        const diagram = event.target.closest?.("[data-show-diagram]");
        if (scaffold) help(Number(scaffold.dataset.scaffoldToggle));
        if (diagram) help();
      }, true);
      const check = byId("checkPupilAnswer");
      check.addEventListener("click", async () => {
        const outcome = mastery.submit(session, question.responses.map((_, index) => byId("response-" + index)?.value || ""));
        if (!outcome.accepted) { setFeedback(outcome.message); await save(); return; }
        markInputs(outcome.correct);
        check.textContent = "Check again";
        byId("answerPanel").hidden = false;
        if (outcome.first && !outcome.correct.every(Boolean)) byId("answerPanel").open = true;
        const feedback = outcome.first || outcome.awaitingSelfCheck
          ? (outcome.awaitingSelfCheck ? "Compare your displayed equation with the model below before continuing." : outcome.correct.every(Boolean) ? "Correct. Your first attempt has been recorded." : "Your first attempt has been recorded. Review the worked answer before continuing.")
          : outcome.correct.every(Boolean) ? "All answers are now correct. Your recorded first attempt is unchanged." : "Keep checking your values. Your recorded first attempt is unchanged.";
        setFeedback(feedback);
        drawingCheck(question);
        const next = byId("nextPupilQuestion");
        if (next) next.hidden = !!outcome.awaitingSelfCheck;
        await save();
        if (outcome.first && !outcome.awaitingSelfCheck) await emitResult();
      });
      byId("nextPupilQuestion").addEventListener("click", async () => {
        byId("nextPupilQuestion").disabled = true;
        if (typeof bridge.next === "function") { try { await bridge.next(); } catch (error) { setFeedback(error?.message || "Unable to continue yet."); byId("nextPupilQuestion").disabled = false; } }
      });
      if (c.submitted) {
        markInputs(c.correct);
        check.textContent = "Check again";
        byId("answerPanel").hidden = false;
        byId("nextPupilQuestion").hidden = c.selfCheck === "pending";
        setFeedback(c.testFeedback || (c.selfCheck === "pending" ? "Compare your displayed equation with the model below before continuing." : c.correct.every(Boolean) ? "Correct. Your first attempt has been recorded." : "Your first attempt has been recorded. Review the worked answer before continuing."));
        drawingCheck(question);
        // Result reporting is idempotent in the bridge and intentionally
        // repeated after restoring a completed snapshot.
        if (c.selfCheck !== "pending") await emitResult();
      } else byId("answerPanel").hidden = true;
      await save();
    }

    const stack = byId("questionPanel").parentElement;
    document.querySelector(".layout")?.classList.add("pupil-practice-layout", "test-mode-embedded");
    document.documentElement.classList.add("test-mode-embedded");
    const lede = document.querySelector(".lede"); if (lede) lede.textContent = title;
    active = {help};
    await showQuestion();
  }

  async function mount(options) {
    let test = null;
    try { test = await root.TestModeBridge?.connect(); } catch (_) { test = null; }
    if (test) return mountTest(options, test);
    return mountStandalone(options);
  }

  root.NumericPractice={mount,useScaffold:index=>active?.help(index)};
})(globalThis);
