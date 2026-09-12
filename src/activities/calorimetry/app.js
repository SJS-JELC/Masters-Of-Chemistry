(function () {
    "use strict";
    const requestedGrade = new URLSearchParams(location.search).get("grade");
    if (["1", "2", "3"].includes(requestedGrade)) document.getElementById("difficulty").value = requestedGrade;
    const core = globalThis.CalorimetryReviewCore;
    const elements = Object.fromEntries(["setup", "example", "target", "difficulty", "temperatureRoute", "massRoute", "amountRoute", "amountField", "structure", "generate", "questionMeta", "questionPanel", "answerPanel", "answerContent"].map((id) => [id, document.getElementById(id)]));

    function fillSelect(select, options, previousValue) {
      select.replaceChildren(...options.map(({ value, label }) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        return option;
      }));
      if (options.some((option) => option.value === previousValue)) select.value = previousValue;
    }

    function routeOptions(routeKey, labelKey) {
      let routes = core.routeIntersection(elements.example.value, elements.setup.value, routeKey);
      if (routeKey === "amountRoutes" && Number(elements.difficulty.value) < 3) routes = routes.filter((route) => route !== "limiting");
      return routes.map((value) => ({ value, label: core.labels[labelKey][value] }));
    }

    function refreshStructures() {
      const oldStructure = elements.structure.value;
      fillSelect(elements.structure, core.structureOptions(elements.target.value, elements.amountRoute.value, Number(elements.difficulty.value)), oldStructure);
    }

    function refreshRoutes() {
      const oldMass = elements.massRoute.value;
      const oldAmount = elements.amountRoute.value;
      fillSelect(elements.massRoute, routeOptions("massRoutes", "massRoutes"), oldMass);
      fillSelect(elements.amountRoute, routeOptions("amountRoutes", "amountRoutes"), oldAmount);
      elements.amountField.hidden = elements.target.value !== "dh";
      refreshStructures();
    }

    function refreshExamples() {
      const oldExample = elements.example.value;
      fillSelect(elements.example, core.exampleOptions(elements.setup.value), oldExample);
      refreshRoutes();
    }

    function randomSeed() {
      if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
      return Math.floor(Math.random() * 4294967296);
    }

    function renderTable(rows) {
      return `<table class="data-table"><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${core.escapeHtml(label)}</th><td>${core.escapeHtml(value)}</td></tr>`).join("")}</tbody></table>`;
    }

    function renderQuestionParts(parts, responses, answerParts, scaffoldsEnabled) {
      return `<div class="exam-parts">${parts.map((part, index) => {
        const response = responses[index];
        const letter = String.fromCharCode(97 + index);
        const scaffold = scaffoldsEnabled ? renderScaffold(answerParts[index], index, letter) : { html: "", count: 0 };
        return `<section class="exam-part">
          <p class="exam-part-question"><span class="exam-part-label">(${letter})</span><span>${core.escapeHtml(part)}</span>${scaffold.count ? `<button class="scaffold-toggle" type="button" data-scaffold-toggle="${index}" aria-expanded="false" aria-controls="scaffold-${index}" aria-label="Show working framework for part ${letter}" title="Show working framework">?</button>` : ""}</p>
          ${scaffold.count ? `<div class="working-scaffold" id="scaffold-${index}" hidden>
            ${scaffold.html}
            <div class="scaffold-actions">
              <button type="button" data-check-scaffold="${index}">Check working</button>
              <p class="scaffold-feedback" id="scaffold-feedback-${index}" aria-live="polite"></p>
            </div>
          </div>` : ""}
          <label class="response-row" for="response-${index}">
            <span class="response-symbol">${core.escapeHtml(response.symbol)}</span>
            <input class="response-input" id="response-${index}" name="${core.escapeHtml(response.key)}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${core.escapeHtml(response.accessibleLabel)}">
            <span class="response-unit">${core.escapeHtml(response.unit)}</span>
          </label>
        </section>`;
      }).join("")}</div>`;
    }

    function renderMathValue(value) {
      if (value && typeof value === "object" && value.fraction) {
        return `<span class="fraction"><span class="fraction-top">${renderMathText(value.fraction[0])}</span><span class="fraction-bottom">${renderMathText(value.fraction[1])}</span></span>`;
      }
      return renderMathText(value);
    }

    function renderMathText(value) {
      return core.escapeHtml(value)
        .replaceAll("T(final)", "T<sub>final</sub>")
        .replaceAll("T(initial)", "T<sub>initial</sub>");
    }

    function workingRowGroups(block) {
      if (block.type !== "text") return [block.rows];
      return block.text.split(/;\s*|\.\s+(?=[A-ZΔn])/).filter(Boolean).map((fragment) => {
        const pieces = fragment.split(/\s=\s/);
        if (pieces.length === 1) return [["", fragment]];
        return [[pieces[0], pieces[1]], ...pieces.slice(2).map((piece) => ["", piece])];
      });
    }

    function scaffoldNumericMatches(value) {
      const source = String(value);
      return [...source.matchAll(/[+−-]?(?:\d+(?:\.\d*)?|\.\d+)/g)].filter((match) => {
        const before = source[match.index - 1] || "";
        const after = source[match.index + match[0].length] || "";
        return !/[A-Za-z]/.test(before) && !/[A-Za-z]/.test(after) && before !== "-" && after !== "-";
      });
    }

    function scaffoldText(value, partIndex, fieldState) {
      const source = String(value);
      let cursor = 0;
      let html = "";
      for (const match of scaffoldNumericMatches(source)) {
        html += renderMathText(source.slice(cursor, match.index));
        const token = match[0];
        const expected = core.enteredNumber(token);
        const tolerance = core.numberTolerance(token);
        const fieldNumber = ++fieldState.count;
        html += fieldNumber === fieldState.total
          ? `<span class="scaffold-final-slot" data-final-slot="${partIndex}" data-expected="${expected}" data-tolerance="${tolerance}"><span class="working-marker" aria-hidden="true"></span></span>`
          : `<span class="working-entry"><input class="working-input" id="working-${partIndex}-${fieldNumber}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-expected="${expected}" data-tolerance="${tolerance}" aria-label="Working number ${fieldNumber} for part ${String.fromCharCode(97 + partIndex)}"><span class="working-marker" aria-hidden="true"></span></span>`;
        cursor = match.index + token.length;
      }
      return html + renderMathText(source.slice(cursor));
    }

    function scaffoldMathValue(value, partIndex, fieldState) {
      if (value && typeof value === "object" && value.fraction) {
        return `<span class="fraction"><span class="fraction-top">${scaffoldText(value.fraction[0], partIndex, fieldState)}</span><span class="fraction-bottom">${scaffoldText(value.fraction[1], partIndex, fieldState)}</span></span>`;
      }
      return scaffoldText(value, partIndex, fieldState);
    }

    function scaffoldNumberCount(value) {
      if (value && typeof value === "object" && value.fraction) return scaffoldNumberCount(value.fraction[0]) + scaffoldNumberCount(value.fraction[1]);
      return scaffoldNumericMatches(value).length;
    }

    function renderScaffold(blocks, partIndex) {
      const rowGroups = blocks.map(workingRowGroups);
      const total = rowGroups.flat(2).reduce((sum, row) => sum + scaffoldNumberCount(row[1]), 0);
      const fieldState = { count: 0, total };
      const html = rowGroups.map((groups) => groups.map((rows) => `<div class="math-block scaffold-block">${rows.map(([left, right]) => `<span class="math-lhs">${core.escapeHtml(left)}</span><span class="math-equals">=</span><span class="math-rhs">${scaffoldMathValue(right, partIndex, fieldState)}</span>`).join("")}</div>`).join("")).join("");
      return { html, count: fieldState.count };
    }

    function renderWorkingBlock(block) {
      if (block.type === "text") {
        return block.text.split(/;\s*|\.\s+(?=[A-ZΔn])/).filter(Boolean).map((fragment) => {
          const pieces = fragment.split(/\s=\s/);
          if (pieces.length === 1) return `<p class="working-note">${core.escapeHtml(fragment)}</p>`;
          const rows = [[pieces[0], pieces[1]], ...pieces.slice(2).map((piece) => ["", piece])];
          return `<div class="math-block">${rows.map(([left, right]) => `<span class="math-lhs">${core.escapeHtml(left)}</span><span class="math-equals">=</span><span class="math-rhs">${core.escapeHtml(right)}</span>`).join("")}</div>`;
        }).join("");
      }
      return `<div class="math-block">${block.rows.map(([left, right]) => `<span class="math-lhs">${core.escapeHtml(left)}</span><span class="math-equals">=</span><span class="math-rhs">${renderMathValue(right)}</span>`).join("")}</div>`;
    }

    function renderAnswers(answerParts) {
      return `<ol type="a">${answerParts.map((part) => `<li class="answer-part">${part.map(renderWorkingBlock).join("")}</li>`).join("")}</ol>`;
    }

    function toggleScaffold(button) {
      const scaffold = document.getElementById(button.getAttribute("aria-controls"));
      if (!scaffold.hidden) return;
      globalThis.CalorimetryPupil?.useScaffold(Number(button.dataset.scaffoldToggle));
      const responseRow = button.closest(".exam-part").querySelector(".response-row");
      const finalInput = responseRow.querySelector(".response-input");
      const finalSlot = scaffold.querySelector(".scaffold-final-slot");
      if (finalSlot && finalInput) {
        finalInput.dataset.expected = finalSlot.dataset.expected;
        finalInput.dataset.tolerance = finalSlot.dataset.tolerance;
        finalInput.classList.add("working-input", "scaffold-final-input");
        finalSlot.insertBefore(finalInput, finalSlot.querySelector(".working-marker"));
        responseRow.hidden = true;
      }
      scaffold.hidden = false;
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", `Working framework open for part ${String.fromCharCode(97 + Number(button.dataset.scaffoldToggle))}`);
      button.title = "Working framework open";
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
          input.removeAttribute("aria-invalid");
          return;
        }
        const isCorrect = core.markNumber(input.value, input.dataset.expected, input.dataset.tolerance);
        input.classList.add(isCorrect ? "correct" : "incorrect");
        marker.classList.add(isCorrect ? "correct" : "incorrect");
        marker.textContent = isCorrect ? "✓" : "×";
        if (isCorrect) {
          correct += 1;
          input.removeAttribute("aria-invalid");
        } else {
          input.setAttribute("aria-invalid", "true");
        }
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

    function loadReview(id) {
      const result = core.generateFromReviewId(id);
      elements.setup.value=result.config.setup;
      elements.difficulty.value=result.difficulty;
      elements.target.value=result.config.target;
      refreshExamples();elements.example.value=result.example.id;refreshRoutes();
      for(const key of ['temperatureRoute','massRoute','amountRoute'])elements[key].value=result.config[key];
      refreshStructures();elements.structure.value=result.structure;
      generate(result);
      document.getElementById("lessonLayout").hidden = false;
      document.getElementById("pupilSetup").hidden = true;
      document.getElementById("pupilFinish").hidden = true;
      document.getElementById("pupilGauge").hidden = true;
    }

    function generate(suppliedResult) {
      const config = {
        setup: elements.setup.value,
        example: elements.example.value,
        target: elements.target.value,
        difficulty: Number(elements.difficulty.value),
        temperatureRoute: elements.temperatureRoute.value,
        massRoute: elements.massRoute.value,
        amountRoute: elements.amountRoute.value,
        structure: elements.structure.value
      };
      const result = suppliedResult?.responses ? suppliedResult : core.generate(config, randomSeed());
      const reviewId = result.reviewId;
      const tags = [ChemistryMode.get() === "teacher" ? ({1:"Guided",2:"Mixed information",3:"Independent"})[result.difficulty] : result.labels.difficulty, result.labels.setup, result.labels.group, result.labels.target, result.labels.structure, result.labels.temperature, result.labels.mass, result.labels.amount].filter(Boolean);
      elements.questionMeta.innerHTML = `${tags.map((tag) => `<span class="tag">${core.escapeHtml(tag)}</span>`).join("")}`;
      elements.questionPanel.innerHTML = `
        <div class="question-heading">
          <h2 data-question-title>Calorimetry calculation</h2>
          <span class="print-question-id print-only">Question ${reviewId}</span>
          ${QuestionPrint.markup()}
        </div>
        ${core.allowsScaffold(result.difficulty) ? `<p class="scaffold-key"><span aria-hidden="true">?</span>Open a working framework beside any calculation part if you need one.</p>` : ""}
        <p>${core.escapeHtml(result.intro)}</p>
        ${result.example.equation ? `<p class="equation">${core.escapeHtml(result.example.equation)}</p>` : ""}
        ${renderTable(result.rows)}
        ${result.diagram}
        <p class="rounding-note">Give numerical answers to 3 significant figures. Use unrounded calculator values in subsequent parts.</p>
        ${renderQuestionParts(result.parts, result.responses, result.answerParts, core.allowsScaffold(result.difficulty))}`;
      elements.answerContent.innerHTML = `<div class="print-mark-scheme-heading print-only"><h2><span data-mark-scheme-title>Calorimetry calculation</span> — mark scheme</h2><p>Question ${reviewId}</p></div>${renderAnswers(result.answerParts)}<p class="assumption">Sign convention: ΔT and Q describe the water or solution. The reaction enthalpy has the opposite sign. Reported answers are shown to 3 significant figures; unrounded calculator values are used in subsequent parts.</p>`;
      elements.answerPanel.hidden = ChemistryMode.get() !== "teacher";
      elements.answerPanel.open = false;
      QuestionReview.mount(elements.questionPanel, reviewId, loadReview);
    }

    elements.setup.addEventListener("change", refreshExamples);
    elements.example.addEventListener("change", refreshRoutes);
    elements.target.addEventListener("change", refreshRoutes);
    elements.difficulty.addEventListener("change", refreshRoutes);
    elements.amountRoute.addEventListener("change", refreshStructures);
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
      const toggle = event.target.closest("[data-scaffold-toggle]");
      if (toggle) toggleScaffold(toggle);
      const checker = event.target.closest("[data-check-scaffold]");
      if (checker) checkScaffold(checker);
    });
    elements.questionPanel.addEventListener("input", (event) => {
      if (!event.target.classList.contains("working-input")) return;
      event.target.classList.remove("correct", "incorrect", "unanswered");
      event.target.removeAttribute("aria-invalid");
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
    refreshExamples();
    const initialMode = ChemistryMode.get();
    document.addEventListener("learningmodechange", () => { if (ChemistryMode.get() !== initialMode) location.reload(); });
    if (initialMode === "teacher") {
      document.getElementById("activityModeTitle").textContent = "question selection";
      document.getElementById("activityModeDescription").textContent = "Choose the calculation details, then print the question and checked mark scheme.";
      document.querySelector(".controls").open = true;
      generate();
    } else CalorimetryPupil.init(generate);
    QuestionReview.requested(loadReview);
  })();
