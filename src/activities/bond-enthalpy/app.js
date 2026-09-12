(function () {
    "use strict";
    const requestedGrade = new URLSearchParams(location.search).get("grade");
    if (["1", "2", "3"].includes(requestedGrade)) document.getElementById("difficulty").value = requestedGrade;
    const core = globalThis.BondEnthalpyReviewCore;
    const elements = Object.fromEntries(["reaction", "difficulty", "generate", "questionMeta", "questionPanel", "answerPanel", "answerContent"].map((id) => [id, document.getElementById(id)]));

    function randomSeed() {
      if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
      return Math.floor(Math.random() * 4294967296);
    }

    function refreshReactionOptions() {
      const previous = elements.reaction.value;
      const eligible = core.eligibleReactions(elements.difficulty.value);
      const random = document.createElement("option");
      random.value = "random";
      random.textContent = "Random compatible reaction";
      const groups = [
        ["past", "Pearson past-paper families"],
        ["familiar", "Additional familiar reactions"]
      ].map(([source, label]) => {
        const group = document.createElement("optgroup");
        group.label = label;
        eligible.filter((reaction) => reaction.source === source).forEach((reaction) => {
          const option = document.createElement("option");
          option.value = reaction.id;
          option.textContent = reaction.name;
          group.append(option);
        });
        return group;
      });
      elements.reaction.replaceChildren(random, ...groups);
      elements.reaction.value = eligible.some((reaction) => reaction.id === previous) ? previous : "random";
    }

    function renderBondTable(result) {
      const rows = result.bondTable;
      const groups = rows.length > 5
        ? [rows.slice(0, Math.ceil(rows.length / 2)), rows.slice(Math.ceil(rows.length / 2))]
        : [rows];
      const tables = groups.map((group, index) => {
        const label = groups.length > 1 ? `Average bond enthalpies, part ${index + 1} of ${groups.length}` : "Average bond enthalpies";
        return `<table class="data-table" aria-label="${label}"><thead><tr><th>Bond</th><th>Average bond enthalpy / kJ/mol</th></tr></thead><tbody>${group.map((row) => `<tr><td>${core.escapeHtml(row.bond)}</td><td>${row.energy === null ? "?" : row.energy}</td></tr>`).join("")}</tbody></table>`;
      }).join("");
      return `<div class="bond-table-grid${groups.length > 1 ? " split" : ""}">${tables}</div>`;
    }

    function renderQuestionParts(parts, responses, answerParts) {
      return `<div class="exam-parts">${parts.map((part, index) => {
        const response = responses[index];
        const letter = String.fromCharCode(97 + index);
        const scaffold = renderScaffold(answerParts[index], index);
        return `<section class="exam-part">
          <p class="exam-part-question"><span>(${letter})</span><span>${core.escapeHtml(part)}</span><button class="scaffold-toggle" type="button" data-scaffold-toggle="${index}" aria-expanded="false" aria-controls="scaffold-${index}" aria-label="Show working framework for part ${letter}" title="Show working framework">?</button></p>
          <div class="working-scaffold" id="scaffold-${index}" hidden>
            ${scaffold.html}
            <div class="scaffold-actions"><button type="button" data-check-scaffold="${index}">Check working</button><p class="scaffold-feedback" aria-live="polite"></p></div>
          </div>
          <label class="response-row" for="response-${index}">
            <span class="response-symbol">${core.escapeHtml(response.symbol)}</span>
            <input class="response-input" id="response-${index}" name="${core.escapeHtml(response.key)}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${core.escapeHtml(response.accessibleLabel)}">
            <span class="response-unit">${core.escapeHtml(response.unit)}</span>
          </label>
        </section>`;
      }).join("")}</div>`;
    }

    function scaffoldNumericMatches(value) {
      const source = String(value);
      return [...source.matchAll(/[+−-]?(?:\d+(?:\.\d*)?|\.\d+)/g)].filter((match) => {
        const before = source[match.index - 1] || "";
        const after = source[match.index + match[0].length] || "";
        return !/[A-Za-z]/.test(before) && !/[A-Za-z]/.test(after) && before !== "-" && after !== "-";
      });
    }

    function scaffoldText(value, partIndex, state) {
      const source = String(value);
      let cursor = 0;
      let html = "";
      for (const match of scaffoldNumericMatches(source)) {
        html += core.escapeHtml(source.slice(cursor, match.index));
        const token = match[0];
        const expected = core.enteredNumber(token);
        const tolerance = core.numberTolerance(token);
        const number = ++state.count;
        html += number === state.total
          ? `<span class="scaffold-final-slot" data-final-slot="${partIndex}" data-expected="${expected}" data-tolerance="${tolerance}"><span class="working-marker" aria-hidden="true"></span></span>`
          : `<span class="working-entry"><input class="working-input" id="working-${partIndex}-${number}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-expected="${expected}" data-tolerance="${tolerance}" aria-label="Working number ${number} for part ${String.fromCharCode(97 + partIndex)}"><span class="working-marker" aria-hidden="true"></span></span>`;
        cursor = match.index + token.length;
      }
      return html + core.escapeHtml(source.slice(cursor));
    }

    function renderScaffold(blocks, partIndex) {
      const total = blocks.flatMap((block) => block.rows).reduce((sum, row) => sum + scaffoldNumericMatches(row[1]).length, 0);
      const state = { count: 0, total };
      const html = blocks.map((block) => `<div class="math-block scaffold-block">${block.rows.map(([left, right]) => `<span class="math-lhs">${core.escapeHtml(left)}</span><span class="math-equals">=</span><span class="math-rhs">${scaffoldText(right, partIndex, state)}</span>`).join("")}</div>`).join("");
      return { html, count: state.count };
    }

    function renderWorkingBlock(block) {
      return `<div class="math-block">${block.rows.map(([left, right]) => `<span class="math-lhs">${core.escapeHtml(left)}</span><span class="math-equals">=</span><span class="math-rhs">${core.escapeHtml(right)}</span>`).join("")}</div>`;
    }

    function renderAnswers(result) {
      const sign = result.reaction.deltaH < 0 ? "negative, so the reaction is exothermic" : "positive, so the reaction is endothermic";
      const conclusion = result.questionType === "unknown-bond"
        ? `The average ${core.escapeHtml(result.unknownBond.bond)} bond enthalpy is ${result.unknownBond.energy} kJ/mol.`
        : `ΔH is ${sign}.`;
      return `<div class="reaction-diagram">${result.reaction.svg}</div><ol type="a">${result.answerParts.map((part) => `<li class="answer-part">${part.map(renderWorkingBlock).join("")}</li>`).join("")}</ol><p class="answer-conclusion">${conclusion}</p><p class="assumption">Average bond enthalpies estimate the enthalpy change for gaseous covalent species. The value applies to the balanced equation as written.</p>`;
    }

    function toggleScaffold(button) {
      const scaffold = document.getElementById(button.getAttribute("aria-controls"));
      if (!scaffold.hidden) return;
      const responseRow = button.closest(".exam-part").querySelector(".response-row");
      const finalInput = responseRow.querySelector(".response-input");
      const finalSlot = scaffold.querySelector(".scaffold-final-slot");
      if (finalSlot && finalInput) {
        finalInput.dataset.expected = finalSlot.dataset.expected;
        finalInput.dataset.tolerance = finalSlot.dataset.tolerance;
        finalInput.classList.add("working-input");
        finalSlot.insertBefore(finalInput, finalSlot.querySelector(".working-marker"));
        responseRow.hidden = true;
      }
      scaffold.hidden = false;
      button.setAttribute("aria-expanded", "true");
      button.disabled = true;
      scaffold.querySelector(".working-input")?.focus();
    }

    function checkScaffold(button) {
      const scaffold = document.getElementById(`scaffold-${button.dataset.checkScaffold}`);
      const inputs = [...scaffold.querySelectorAll(".working-input")];
      let correct = 0;
      let unanswered = 0;
      inputs.forEach((input) => {
        const marker = input.nextElementSibling;
        input.classList.remove("correct", "incorrect", "unanswered");
        marker.classList.remove("correct", "incorrect");
        if (!input.value.trim()) {
          unanswered += 1;
          input.classList.add("unanswered");
          marker.textContent = "";
          return;
        }
        const isCorrect = core.markNumber(input.value, input.dataset.expected, input.dataset.tolerance);
        input.classList.add(isCorrect ? "correct" : "incorrect");
        marker.classList.add(isCorrect ? "correct" : "incorrect");
        marker.textContent = isCorrect ? "✓" : "×";
        if (isCorrect) correct += 1;
      });
      const feedback = scaffold.querySelector(".scaffold-feedback");
      feedback.classList.remove("all-correct", "has-errors");
      if (correct === inputs.length) {
        feedback.textContent = `All ${inputs.length} numbers are correct.`;
        feedback.classList.add("all-correct");
      } else {
        const wrong = inputs.length - correct - unanswered;
        feedback.textContent = `${correct}/${inputs.length} correct${wrong ? `; ${wrong} to fix` : ""}${unanswered ? `; ${unanswered} still blank` : ""}.`;
        feedback.classList.add("has-errors");
      }
    }

    function showDiagramHint(button) {
      const diagram = document.getElementById(button.getAttribute("aria-controls"));
      diagram.hidden = false;
      button.disabled = true;
      button.setAttribute("aria-expanded", "true");
      button.textContent = "Displayed formulae shown";
    }

    function loadReview(id) {
      const result = core.generateFromReviewId(id);
      elements.difficulty.value = result.difficulty;
      refreshReactionOptions();
      elements.reaction.value = result.reaction.id;
      generate(result);
    }

    function generate(suppliedResult) {
      const result = suppliedResult?.responses ? suppliedResult : core.generate({ reaction: elements.reaction.value, difficulty: elements.difficulty.value }, randomSeed());
      const reviewId = result.reviewId;
      const tags = [result.labels.difficulty, result.labels.family, result.labels.source, result.labels.structure, result.labels.task];
      elements.questionMeta.innerHTML = `${tags.map((tag) => `<span class="tag">${core.escapeHtml(tag)}</span>`).join("")}`;
      const levelThreeLead = result.difficulty === 3
        ? `<p class="formula-equation">${core.escapeHtml(result.reaction.equation)}</p><p class="draw-instruction">Draw the balanced displayed equation on paper or a whiteboard before counting bonds.</p><div class="diagram-help"><button class="diagram-hint" type="button" data-show-diagram aria-expanded="false" aria-controls="revealed-diagram">Show displayed formulae</button><div class="reaction-diagram revealed-diagram" id="revealed-diagram" hidden>${result.reaction.svg}</div></div>`
        : `<div class="reaction-diagram">${result.reaction.svg}</div>`;
      elements.questionPanel.innerHTML = `
        <div class="question-heading">
          <h2 data-question-title>Average bond-enthalpy calculation</h2>
          <span class="print-question-id print-only">Question ${reviewId}</span>
          ${QuestionPrint.markup()}
        </div>
        <p class="scaffold-key"><span aria-hidden="true">?</span>Open a fill-in working framework beside any calculation part if you need one.</p>
        ${levelThreeLead}
        ${renderBondTable(result)}
        ${renderQuestionParts(result.parts, result.responses, result.answerParts)}`;
      elements.answerContent.innerHTML = `<div class="print-mark-scheme-heading print-only"><h2><span data-mark-scheme-title>Average bond-enthalpy calculation</span> — mark scheme</h2><p>Question ${reviewId}</p></div>${renderAnswers(result)}`;
      elements.answerPanel.hidden = false;
      elements.answerPanel.open = false;
      QuestionReview.mount(elements.questionPanel, reviewId, loadReview);
    }

    elements.difficulty.addEventListener("change", refreshReactionOptions);
    elements.generate.addEventListener("click", generate);
    let titleBeforePrint = null;
    elements.questionPanel.addEventListener("click", (event) => {
      const printButton = event.target.closest("[data-print-question]");
      if (printButton) {
        const questionTitle = elements.questionPanel.querySelector("[data-question-title]");
        const defaultTitle = questionTitle.textContent.trim();
        const requestedTitle = globalThis.prompt("Title for the printed sheet:", defaultTitle);
        if (requestedTitle === null) return;
        const printTitle = requestedTitle.replace(/\s+/g, " ").trim() || defaultTitle;
        titleBeforePrint = defaultTitle;
        questionTitle.textContent = printTitle;
        elements.answerContent.querySelector("[data-mark-scheme-title]").textContent = printTitle;
        globalThis.print();
        return;
      }
      const scaffoldToggle = event.target.closest("[data-scaffold-toggle]");
      if (scaffoldToggle) toggleScaffold(scaffoldToggle);
      const checker = event.target.closest("[data-check-scaffold]");
      if (checker) checkScaffold(checker);
      const diagramHint = event.target.closest("[data-show-diagram]");
      if (diagramHint) showDiagramHint(diagramHint);
    });
    elements.questionPanel.addEventListener("input", (event) => {
      if (!event.target.classList.contains("working-input")) return;
      event.target.classList.remove("correct", "incorrect", "unanswered");
      const marker = event.target.nextElementSibling;
      marker.textContent = "";
      marker.classList.remove("correct", "incorrect");
    });

    let answerWasOpenBeforePrint = false;
    globalThis.addEventListener("beforeprint", () => {
      answerWasOpenBeforePrint = elements.answerPanel.open;
      elements.answerPanel.open = true;
    });
    globalThis.addEventListener("afterprint", () => {
      elements.answerPanel.open = answerWasOpenBeforePrint;
      if (titleBeforePrint !== null) {
        elements.questionPanel.querySelector("[data-question-title]").textContent = titleBeforePrint;
        elements.answerContent.querySelector("[data-mark-scheme-title]").textContent = titleBeforePrint;
        titleBeforePrint = null;
      }
    });

    refreshReactionOptions();
    if(ChemistryMode.get()==="teacher")generate();
    else NumericPractice.mount({mastery:BondEnthalpyMastery,renderQuestion:generate,slug:"bond-enthalpy",leafId:"lower-10-4",title:"Average bond enthalpy practice"});
    QuestionReview.requested(loadReview);
  })();
