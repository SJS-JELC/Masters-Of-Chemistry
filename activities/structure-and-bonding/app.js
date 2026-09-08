(function () {
    "use strict";
    const requestedGrade = new URLSearchParams(location.search).get("grade");
    if (["1", "2", "3"].includes(requestedGrade)) document.getElementById("responseLevel").value = requestedGrade;

    const core = globalThis.StructureBondingComparisonCore;
    const focus = document.getElementById("focus");
    const responseLevel = document.getElementById("responseLevel");
    const generateButton = document.getElementById("generate");
    const teacherModeButton = document.getElementById("teacherMode");
    const controlNote = document.getElementById("controlNote");
    const panel = document.getElementById("questionPanel");
    const controlMeta = document.getElementById("controlMeta");

    let current = null;
    let lockedText = "";
    let judgements = [];
    let activePoint = null;
    let awaitingEvidence = false;
    let finished = false;
    let teacherMode = false;
    let attemptId = crypto.randomUUID(), recorded = false, masteryRecords = [];
    const progressModel = globalThis.MastersProgress;
    try { masteryRecords = progressModel.read(localStorage); } catch (_) {}
    function recordMastery(correct) {
      if (recorded || teacherMode || globalThis.ChemistryMode?.get() === "teacher") return;
      const result = { id: attemptId, leafId: "lower-6-5", grade: Number(responseLevel.value),
        score: progressModel.questionScore(correct), completedAt: Date.now(),
        question: current.id, selfAssessed: Number(responseLevel.value) > 1 };
      try { masteryRecords = progressModel.merge(progressModel.read(localStorage), masteryRecords); } catch (_) {}
      masteryRecords = progressModel.append(masteryRecords, result); recorded = true;
      try { localStorage.setItem(progressModel.key, JSON.stringify(masteryRecords)); }
      catch (_) { controlNote.textContent += " This browser cannot save mastery progress."; }
    }

    const reviewBank = QuestionReview.bank('SBC', core.questions.flatMap(question=>[1,2,3].map(level=>({question,level,id:question.id+':'+level}))));
    function loadReview(id) {
      const entry = reviewBank.get(id); current = entry.question; responseLevel.value = entry.level;
      focus.value = 'any'; clearResponseState(); renderQuestion();
    }
    function mountReview(id) { QuestionReview.mount(panel, id, loadReview); }


    function schemeHtml(title = "Mark scheme") {
      return `<section class="review-card teacher-scheme" aria-labelledby="scheme-title">
        <h3 id="scheme-title">${core.escapeHtml(title)}</h3>
        <p class="scheme-intro">Award one mark for each independent point. Apply any exclusion shown beneath that point.</p>
        <ol class="scheme-list">
          ${current.points.map((point, index) => `
            <li class="scheme-point point-${Math.min(index + 1, 6)}">
              <div class="point-main"><span class="point-number">${index + 1}</span><p class="point-text">${core.escapeHtml(point.text)}</p></div>
              ${point.reject ? `<p class="exclusion">NO MARK: ${core.escapeHtml(point.reject.replace(/^Do not award(?: if)?\s*/i, ""))}</p>` : ""}
            </li>`).join("")}
        </ol>
      </section>`;
    }

    function levelOneHtml() {
      const rows = core.getLevelOneTable(current);
      return `<div class="response-form" id="levelOneForm">
        <p class="level-intro">Complete both sides of the comparison. Each menu contains scientifically plausible choices; use the question to decide which belongs in each cell.</p>
        <div class="comparison-table-wrap">
          <table class="comparison-table">
            <thead><tr><th scope="col">Compare</th><th scope="col">${core.escapeHtml(current.left.name)}</th><th scope="col">${core.escapeHtml(current.right.name)}</th></tr></thead>
            <tbody>
              ${rows.map((row, rowIndex) => `<tr>
                <th scope="row">${core.escapeHtml(row.label)}</th>
                ${["left", "right"].map((side) => `<td>
                  <select class="table-choice" id="table-${rowIndex}-${side}" data-answer="${core.escapeHtml(row[side])}" aria-label="${core.escapeHtml(`${row.label} for ${current[side].name}`)}" required>
                    <option value="" disabled selected>Choose…</option>
                    ${row.options.map((option) => `<option value="${core.escapeHtml(option)}">${core.escapeHtml(option)}</option>`).join("")}
                  </select>
                  <span class="cell-feedback" aria-live="polite"></span>
                </td>`).join("")}
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div class="response-actions"><button id="checkTable" type="button">Check comparison table</button></div>
        <p class="validation" id="validation" aria-live="polite"></p>
        <div id="levelOneOutcome" aria-live="polite"></div>
      </div>`;
    }

    function levelTwoHtml() {
      const sections = core.levelTwoSections(current);
      const comparison = sections.find((section) => section.side === "comparison");
      return `<div class="response-form">
        <p class="level-intro">Build the explanation one part at a time. Identify the bonding and structure, link each substance to its property, then bring both sides together in the comparison box.</p>
        <div class="guided-comparison-grid">
          ${["left", "right"].map((side) => `<section class="guided-substance" aria-labelledby="guided-${side}-title">
            <h3 id="guided-${side}-title">${core.escapeHtml(current[side].name)}</h3>
            <div class="scaffold-sections">
              ${sections.filter((section) => section.side === side).map((section, index) => `<section class="scaffold-section ${section.kind === "short" ? "compact" : ""}">
                <label for="guided-${side}-${index}">${core.escapeHtml(section.title)}</label>
                ${section.kind === "short"
                  ? `<input class="student-response short-response" id="guided-${side}-${index}" type="text" spellcheck="true">`
                  : `<p>${core.escapeHtml(section.help)}</p><textarea class="student-response" id="guided-${side}-${index}" spellcheck="true" placeholder="Write one or more complete sentences…"></textarea>`}
              </section>`).join("")}
            </div>
          </section>`).join("")}
        </div>
        <section class="scaffold-section comparison-writing">
          <label for="guided-comparison">${core.escapeHtml(comparison.title)}</label>
          <p>${core.escapeHtml(comparison.help)}</p>
          <textarea class="student-response" id="guided-comparison" spellcheck="true" placeholder="Write your comparison in complete sentences…"></textarea>
        </section>
        <div class="response-actions"><button id="lockAnswer" type="button">Lock sentences and reveal mark scheme</button></div>
        <p class="validation" id="validation" aria-live="polite"></p>
      </div>`;
    }

    function levelThreeHtml() {
      return `<div class="response-form">
        <label for="studentResponse">Your explanation</label>
        <textarea class="student-response" id="studentResponse" spellcheck="true" placeholder="Use structure and bonding to explain the comparison..."></textarea>
        <div class="response-actions"><button id="lockAnswer" type="button">Lock answer and reveal mark scheme</button></div>
        <p class="validation" id="validation" aria-live="polite"></p>
      </div>`;
    }

    function renderQuestion() {
      const marks = current.points.length;
      const level = Number(responseLevel.value);
      const reviewId = reviewBank.id({id:current.id+':'+level});
      controlMeta.innerHTML = `
        <span class="tag">Sub-branch // 6.5 Comparisons</span>
        <span class="tag">${({1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"})[level]}</span>
        <span class="tag">${core.escapeHtml(focus.options[focus.selectedIndex].text)}</span>
        `;
      if (teacherMode) {
        panel.innerHTML = `
          <div class="question-topline"><span>Teacher view</span><span class="target-key">Structure // bonding</span></div>
          <p class="prompt">${core.escapeHtml(current.prompt)} <span class="marks">[${marks}]</span></p>
          ${schemeHtml()}`;
        mountReview(reviewId);
        return;
      }

      panel.innerHTML = `
        <div class="question-topline"><span>${({1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"})[level]} // ${level === 1 ? "Comparison table" : level === 2 ? "Guided paragraphs" : "Open response"}</span><span class="target-key">Structure // bonding</span></div>
        <p class="prompt">${core.escapeHtml(current.prompt)} <span class="marks">[${marks}]</span></p>
        ${level === 1 ? levelOneHtml() : level === 2 ? levelTwoHtml() : levelThreeHtml()}`;
      mountReview(reviewId);
    }

    function renderHighlightedAnswer() {
      const ranges = judgements
        .map((judgement, index) => judgement.status === "met" && judgement.evidence ? { ...judgement.evidence, point: index + 1 } : null)
        .filter(Boolean);

      if (!ranges.length) return core.escapeHtml(lockedText);
      const boundaries = new Set([0, lockedText.length]);
      ranges.forEach((range) => { boundaries.add(range.start); boundaries.add(range.end); });
      const ordered = [...boundaries].sort((a, b) => a - b);
      let html = "";
      for (let index = 0; index < ordered.length - 1; index += 1) {
        const start = ordered[index];
        const end = ordered[index + 1];
        const text = core.escapeHtml(lockedText.slice(start, end));
        const owners = ranges.filter((range) => range.start <= start && range.end >= end).map((range) => range.point);
        const colourClasses = owners.map((owner) => `point-${Math.min(owner, 6)}`).join(" ");
        html += owners.length ? `<mark class="evidence ${colourClasses}" title="Evidence for point${owners.length > 1 ? "s" : ""} ${owners.join(", ")}">${text}</mark>` : text;
      }
      return html;
    }

    function renderReview() {
      const judged = judgements.filter((item) => item.status === "met" || item.status === "not-met").length;
      const score = judgements.filter((item) => item.status === "met").length;
      const pointNumber = activePoint === null ? null : activePoint + 1;
      const instruction = finished
        ? "Marking complete. Each awarded point uses the same colour in the mark scheme and your answer."
        : activePoint === null
          ? "All marking points are judged. Check the colour-coded evidence, then finish marking."
          : awaitingEvidence
            ? `Mark ${pointNumber} is ticked. Now highlight the exact words in your locked answer that earn this mark. It will save automatically and ${pointNumber === current.points.length ? "complete the sequence" : `move to Mark ${pointNumber + 1}`}.`
            : `Mark ${pointNumber} is highlighted below. Decide: choose × if it is missing, or ✓ if it is present in your answer.`;
      const instructionClass = activePoint === null ? "complete" : awaitingEvidence ? `awaiting point-${Math.min(pointNumber, 6)}` : `point-${Math.min(pointNumber, 6)}`;

      const reviewMount = panel.querySelector(".response-form, .review-grid");
      reviewMount.outerHTML = `
        <div class="review-grid">
          <section class="review-card" aria-labelledby="locked-title">
            <h3 id="locked-title">Your locked answer</h3>
            <p class="small-note">Work through the marking points in order. A tick must be supported by highlighted evidence.</p>
            <div class="instruction ${instructionClass}" id="instruction">${core.escapeHtml(instruction)}</div>
            <div class="locked-answer" id="lockedAnswer" tabindex="0">${renderHighlightedAnswer()}</div>
            ${awaitingEvidence ? `<p class="auto-note">Release the mouse or lift your finger to save the highlight and continue automatically.</p>` : ""}
          </section>
          <section class="review-card" aria-labelledby="scheme-title">
            <h3 id="scheme-title">Mark scheme</h3>
            <p class="scheme-intro">Start with the brightly highlighted box. A cross moves on immediately; a tick asks you to highlight evidence before the next box opens.</p>
            <ol class="scheme-list">
              ${current.points.map((point, index) => {
                const judgement = judgements[index];
                const isActive = activePoint === index;
                const isFuture = activePoint !== null && index > activePoint && !judgement.status;
                const classes = ["scheme-point", `point-${Math.min(index + 1, 6)}`, judgement.status || "", isActive ? "active" : "", isFuture ? "future" : ""].filter(Boolean).join(" ");
                return `<li class="${classes}" data-point="${index}">
                  ${isActive ? `<span class="next-label">${awaitingEvidence ? "NOW HIGHLIGHT YOUR ANSWER" : "DO THIS NEXT"}</span>` : ""}
                  <div class="point-main"><span class="point-number">${index + 1}</span><p class="point-text">${core.escapeHtml(point.text)}</p></div>
                  ${point.reject ? `<p class="exclusion">NO MARK: ${core.escapeHtml(point.reject.replace(/^Do not award(?: if)?\s*/i, ""))}</p>` : ""}
                  ${judgement.evidence ? `<p class="evidence-quote">“${core.escapeHtml(judgement.evidence.text)}”</p>` : ""}
                  <div class="decision-row">
                    <button class="decision no ${judgement.status === "not-met" ? "selected" : ""}" type="button" data-decision="not-met" data-index="${index}" ${finished || !isActive || awaitingEvidence ? "disabled" : ""}>× Not met</button>
                    <button class="decision yes ${judgement.status === "met" ? "selected" : ""}" type="button" data-decision="met" data-index="${index}" ${finished || !isActive || awaitingEvidence ? "disabled" : ""}>✓ Met</button>
                  </div>
                </li>`;
              }).join("")}
            </ol>
            <div class="mark-footer">
              <span class="progress">${judged} of ${current.points.length} points judged</span>
              <button id="finishMarking" type="button" ${judged !== current.points.length || activePoint !== null || finished ? "disabled" : ""}>Finish marking</button>
            </div>
            ${finished ? `<div class="result"><strong>Self-assessed score: ${score}/${current.points.length}</strong><p>${score === current.points.length ? "Every marking point has linked evidence." : `${current.points.length - score} marking point${current.points.length - score === 1 ? " is" : "s are"} missing from this response.`}</p></div>` : ""}
          </section>
        </div>`;
    }

    function selectionInside(container) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) return null;
      const prefix = range.cloneRange();
      prefix.selectNodeContents(container);
      prefix.setEnd(range.startContainer, range.startOffset);
      const start = prefix.toString().length;
      const text = range.toString();
      if (!text.trim()) return null;
      return { start, end: start + text.length, text };
    }

    function captureSelection() {
      if (activePoint === null || !awaitingEvidence || finished) return;
      const answer = document.getElementById("lockedAnswer");
      if (!answer) return;
      const evidence = selectionInside(answer);
      if (!evidence) return;
      judgements[activePoint] = { status: "met", evidence };
      activePoint = judgements.findIndex((item) => item.status !== "met" && item.status !== "not-met");
      if (activePoint === -1) activePoint = null;
      awaitingEvidence = false;
      window.getSelection()?.removeAllRanges();
      renderReview();
    }

    function checkLevelOneTable() {
      const choices = [...panel.querySelectorAll(".table-choice")];
      const validation = document.getElementById("validation");
      if (choices.some((choice) => !choice.value)) {
        validation.textContent = "Complete every cell before checking the table.";
        choices.find((choice) => !choice.value)?.focus();
        return;
      }

      let correct = 0;
      choices.forEach((choice) => {
        const isCorrect = choice.value === choice.dataset.answer;
        const feedback = choice.parentElement.querySelector(".cell-feedback");
        correct += Number(isCorrect);
        choice.classList.add(isCorrect ? "correct" : "incorrect");
        choice.disabled = true;
        feedback.classList.add(isCorrect ? "correct" : "incorrect");
        feedback.textContent = isCorrect ? "✓ Correct" : `Correct answer: ${choice.dataset.answer}`;
      });

      validation.textContent = "";
      document.getElementById("checkTable").disabled = true;
      recordMastery(choices.map(choice => choice.value === choice.dataset.answer));
      document.getElementById("levelOneOutcome").innerHTML = `
        <div class="table-result">
          <strong>${correct}/${choices.length} table choices correct</strong>
          <p>This checks the scaffold, not the exam-mark total. Read across each completed row and use the table to build your explanation.</p>
        </div>`;
    }

    function lockAnswer() {
      const responseFields = [...panel.querySelectorAll(".student-response")];
      const validation = document.getElementById("validation");
      const values = responseFields.map((field) => field.value.trim());
      const value = values.join("\n\n");
      if (Number(responseLevel.value) === 2 && values.some((section) => section.length < 5)) {
        validation.textContent = "Complete every Grade 7–8 box before locking your response.";
        responseFields.find((field) => field.value.trim().length < 5)?.focus();
        return;
      }
      if (value.length < 20) {
        validation.textContent = "Write a fuller explanation before locking your answer.";
        responseFields[0]?.focus();
        return;
      }
      lockedText = value;
      judgements = current.points.map(() => ({ status: null, evidence: null }));
      activePoint = 0;
      awaitingEvidence = false;
      finished = false;
      renderReview();
    }

    function chooseDecision(index, decision) {
      if (finished || awaitingEvidence || index !== activePoint) return;
      if (decision === "not-met") {
        judgements[index] = { status: "not-met", evidence: null };
        activePoint = judgements.findIndex((item) => item.status !== "met" && item.status !== "not-met");
        if (activePoint === -1) activePoint = null;
      } else {
        awaitingEvidence = true;
      }
      renderReview();
      if (awaitingEvidence) document.getElementById("lockedAnswer").focus();
    }

    function finishMarking() {
      if (judgements.some((item) => item.status !== "met" && item.status !== "not-met") || activePoint !== null) return;
      finished = true;
      recordMastery(judgements.map(item => item.status === "met"));
      renderReview();
    }

    function studentControlNote() {
      const notes = {
        1: "Grade 5–6 builds the comparison from dropdown choices and checks each table entry.",
        2: "Grade 7–8 separates bonding, structure and property links for each substance, then finishes with a comparison box before self-marking.",
        3: "Grade 9 is a fully open response followed by evidence-linked self-marking."
      };
      return notes[Number(responseLevel.value)];
    }

    function clearResponseState() {
      attemptId = crypto.randomUUID(); recorded = false;
      lockedText = "";
      judgements = [];
      activePoint = null;
      awaitingEvidence = false;
      finished = false;
    }

    function generate() {
      if (teacherMode) {
        const candidates = core.eligible(focus.value);
        const currentIndex = candidates.findIndex((question) => question.id === current?.id);
        current = candidates[(currentIndex + 1) % candidates.length];
      } else {
        current = core.choose(focus.value, Math.random(), current?.id);
      }
      clearResponseState();
      renderQuestion();
    }

    function toggleTeacherMode() {
      teacherMode = !teacherMode;
      teacherModeButton.setAttribute("aria-pressed", String(teacherMode));
      teacherModeButton.textContent = `Teacher mode: ${teacherMode ? "On" : "Off"}`;
      generateButton.textContent = teacherMode ? "Next question" : "Generate question";
      controlNote.textContent = teacherMode
        ? "Teacher mode shows each complete mark scheme. Next question cycles through the selected comparison focus in order."
        : studentControlNote();
      clearResponseState();
      renderQuestion();
    }

    generateButton.addEventListener("click", generate);
    focus.addEventListener("change", generate);
    responseLevel.addEventListener("change", () => {
      clearResponseState();
      if (!teacherMode) controlNote.textContent = studentControlNote();
      renderQuestion();
    });
    teacherModeButton.addEventListener("click", toggleTeacherMode);

    panel.addEventListener("click", (event) => {
      if (event.target.id === "checkTable") checkLevelOneTable();
      if (event.target.id === "lockAnswer") lockAnswer();
      if (event.target.id === "finishMarking") finishMarking();
      const decision = event.target.closest("[data-decision]");
      if (decision) chooseDecision(Number(decision.dataset.index), decision.dataset.decision);
    });

    panel.addEventListener("mouseup", (event) => {
      if (event.target.closest("#lockedAnswer")) setTimeout(captureSelection, 0);
    });
    panel.addEventListener("touchend", (event) => {
      if (event.target.closest("#lockedAnswer")) setTimeout(captureSelection, 0);
    });
    panel.addEventListener("keyup", (event) => {
      if (event.target.closest("#lockedAnswer")) captureSelection();
    });

    controlNote.textContent = studentControlNote();
    generate();
    QuestionReview.requested(loadReview);
  }());
