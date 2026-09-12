(function () {
  "use strict";

  const activities = globalThis.MASTERS_ACTIVITIES || {};
  const years = globalThis.MASTERS_HIERARCHY || [];
  const activityColours = {
    calculation: "#55f6ff",
    "long-answer": "#ff5ecb",
    "short-answer": "#54f5b5",
    unavailable: "#68708a"
  };
  const svgNS = "http://www.w3.org/2000/svg";
  const yearGrid = document.getElementById("yearGrid");
  const activityLink = document.getElementById("activityLink");
  const activityUnavailable = document.getElementById("activityUnavailable");
  const gemsByLeafId = new Map();
  let selectedGem = null;
  let activeGrade = "1";
  const progress = globalThis.MastersProgress;
  let records = [];
  try { records = progress.read(localStorage); activeGrade = localStorage.getItem("masters-igcse-grade") || "1"; } catch (_) {}
  if (!progress.bands[activeGrade]) activeGrade = "1";
  function progressFor(leafId) {
    return progress.achievement(records, leafId);
  }
  function updateDetailProgress(data) {
    const state = progressFor(data.leafId);
    document.getElementById("masteryBand").textContent = progress.bands[state.grade] + " mastery";
    document.getElementById("gemMastery").textContent = state.score === null ? "Not assessed yet" : state.mastered ? "Mastery threshold exceeded" : "Building mastery";
    const meter = document.getElementById("gemMasteryMeter");
    const bar = progress.masteryBar(state.score, progress.bands[state.grade] + ' mastery', state.grade); bar.id = 'gemMasteryMeter'; meter.replaceWith(bar);
    document.getElementById("gemFreshness").textContent = { unreviewed:"No review recorded", fresh:"Bright gleam", steady:"Soft gleam", due:"Review due" }[state.freshness];
    document.getElementById("gemReviewed").textContent = state.days === null ? "" : state.days === 0 ? "Last reviewed today" : "Last reviewed " + state.days + " day" + (state.days === 1 ? "" : "s") + " ago";
  }
  function updatePupilMap() {
    gemsByLeafId.forEach((gem, leafId) => {
      const state = progressFor(leafId);
      gem.dataset.freshness = state.freshness;
      gem.dataset.assessed = String(state.mastery !== null);
      gem.dataset.masteryGrade = String(state.achievedGrade);
      for (const name of ["fresh", "steady", "due", "unstarted"]) gem.classList.toggle(name, name === (state.mastery === null ? "unstarted" : state.freshness));
      const label = ChemistryMode.get() === "teacher" ? gem.gemData.name + ", " + (activities[leafId] ? "choose questions" : "activity coming soon") : gem.gemData.name + ", " + (state.achievedGrade ? progress.bands[state.achievedGrade]+" mastered" : "no level mastered yet") + ", " + (state.mastery === null ? "not assessed" : "mastery recorded") + ", " + (state.days === null ? "no review recorded" : "reviewed " + state.days + " days ago") + ", " + (activities[leafId] ? "activity available" : "activity coming soon");
      gem.setAttribute("aria-label", label); gem.querySelector("title").textContent = label;
    });
  }
  const details = document.getElementById("gemDetails");
  function closeDetails(restoreFocus = true) {
    details.close();
    if (selectedGem) {
      selectedGem.setAttribute("aria-expanded", "false");
      selectedGem.classList.remove("is-selected");
      if (restoreFocus) selectedGem.focus({ preventScroll: true });
    }
    try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
  }
  document.getElementById("closeDetails").addEventListener("click", () => closeDetails());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && details.open) { event.preventDefault(); closeDetails(); }
  });
  document.addEventListener("click", event => {
    if (details.open && !details.contains(event.target) && !event.target.closest(".gem")) closeDetails(false);
  });
  document.querySelectorAll("[data-hub-panel]").forEach(button => {
    button.addEventListener("click", () => {
      const opening = button.getAttribute("aria-expanded") !== "true";
      document.querySelectorAll("[data-hub-panel]").forEach(other => {
        const expanded = other === button && opening;
        other.setAttribute("aria-expanded", String(expanded));
        document.getElementById(other.dataset.hubPanel).hidden = !expanded;
      });
    });
  });
  document.querySelectorAll("[data-close-panel]").forEach(button => {
    button.addEventListener("click", () => {
      const trigger = document.querySelector('[data-hub-panel="' + button.dataset.closePanel + '"]');
      trigger.click(); trigger.focus();
    });
  });
  function makeSvg(tag, attributes = {}, parent) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    if (parent) parent.appendChild(element);
    return element;
  }

  function selectGem(group, data) {
    if (selectedGem) { selectedGem.classList.remove("is-selected"); selectedGem.setAttribute("aria-expanded", "false"); }
    selectedGem = group;
    group.classList.add("is-selected");
    group.setAttribute("aria-expanded", "true");

    updateDetailProgress(data);
    const activity = activities[data.leafId];
    const activityType = activity ? activity.type : "unavailable";
    document.getElementById("detailTopic").textContent = data.topic;
    document.getElementById("detailSubbranch").textContent = data.name;
    document.getElementById("detailPath").textContent = `${data.year} • ${activity ? activity.typeLabel : "No activity"}`;
    document.getElementById("activityType").textContent = activity ? `${activity.typeLabel} activity` : "Activity not available";
    document.getElementById("activityStatus").textContent = activity ? "Ready to use" : "Planned resource";
    document.getElementById("detailGem").style.color = activityColours[activityType];
    document.getElementById("activityTypeCard").dataset.type = activityType;

    activityLink.hidden = !activity;
    const choices=document.getElementById("practiceChoices");
    const pupilChoices=Boolean(activity?.practiceModes && ChemistryMode.get()==="pupil");
    choices.hidden=!pupilChoices;choices.replaceChildren();
    document.querySelector(".gem-progress").hidden=pupilChoices;
    document.getElementById("activityTypeCard").hidden=pupilChoices;
    if(pupilChoices){
      activityLink.hidden=true;
      ["mastery",...(activity.availableGrades || [1,2,3])].forEach(option=>{
        const link=document.createElement("a"),label=document.createElement("strong"),summary=document.createElement("span");
        link.className="practice-choice";link.dataset.practice=option;
        link.href=activity.href+"?mode=pupil&practice="+(option==="mastery"?"mastery":"grade&grade="+option);
        label.textContent=option==="mastery"?"MASTERY":progress.bands[option];
        if(option==="mastery")summary.textContent=activity.availableGrades ? "Build mastery across Grades 5–6 and 7–8 · Grade 9 unavailable" : "Build mastery across all three levels";
        else {const state=progress.summarise(records,data.leafId,option);summary.append(progress.masteryBar(state.score,progress.bands[option]+' mastery',option));}
        link.append(label,summary);choices.appendChild(link);
      });
    }
    activityUnavailable.hidden = Boolean(activity);
    if (activity) {
      activityLink.href = activity.href + "?mode=" + ChemistryMode.get() + (ChemistryMode.get() === "pupil" ? "&grade=" + activeGrade : "");
      activityLink.textContent = ChemistryMode.get() === "teacher" ? "Choose and print questions" : activity.label;
      activityLink.dataset.type = activity.type;
    } else {
      activityLink.removeAttribute("data-type");
    }

    if (!details.open) details.show();
    document.getElementById("closeDetails").focus({ preventScroll: true });
    try {
      history.replaceState(null, "", `#${data.leafId}`);
    } catch (_error) {
      // Some file:// browser policies restrict history changes; navigation still works.
    }
  }

  function addGem(parent, position, data, angle) {
    const activity = activities[data.leafId];
    const activityType = activity ? activity.type : "unavailable";
    const stateLabel = activity ? `${activity.typeLabel} activity available` : "no activity available";
    const group = makeSvg("g", {
      class: `gem ${activity ? `available ${activity.type}` : "unavailable"}`,
      "data-leaf": data.leafId,
      "data-activity-type": activityType,
      transform: `translate(${position.x.toFixed(1)} ${position.y.toFixed(1)}) rotate(${(angle + 90).toFixed(1)})`,
      tabindex: "0",
      role: "button",
      "aria-controls": "gemDetails",
      "aria-expanded": "false",
      "aria-haspopup": "dialog",
      "aria-label": `${data.name}, ${stateLabel}`
    }, parent);
    makeSvg("rect", { x: "-22", y: "-22", width: "44", height: "44", fill: "transparent" }, group);
    const title = makeSvg("title", {}, group);
    title.textContent = `${data.topicNumber}.${data.subNumber} ${data.name} — ${stateLabel}`;
    makeSvg("path", { class: "gem-body", d: "M0 -13 L10.5 -4 L8 7.5 L0 14 L-8 7.5 L-10.5 -4 Z" }, group);

    makeSvg("path", { class: "gem-facet", d: "M0 -13 L0 6 L-8 7.5 L-10.5 -4 Z" }, group);
    makeSvg("path", { class: "gem-facet", d: "M0 6 L8 7.5 L0 14 Z", opacity: ".45" }, group);
    makeSvg("path", { class: "spark spark-a", d: "M-7 -12 L-5.7 -8.7 L-2.5 -7.4 L-5.7 -6.1 L-7 -2.8 L-8.3 -6.1 L-11.5 -7.4 L-8.3 -8.7 Z" }, group);
    makeSvg("path", { class: "spark spark-b", d: "M8 -5 L9 -2.7 L11.3 -1.7 L9 .7 L8 3 L7 .7 L4.7 -1.7 L7 -2.7 Z" }, group);
    group.addEventListener("click", () => selectGem(group, data));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectGem(group, data);
      }
    });
    group.gemData = data;
    gemsByLeafId.set(data.leafId, group);
  }

  years.forEach(year => {
    const card = document.createElement("section");
    card.className = "year-card year-group";
    card.dataset.year = year.key;
    card.style.setProperty("--year-colour", year.colour);
    card.setAttribute("aria-labelledby", "year-" + year.key);
    const header = document.createElement("header");
    header.className = "year-card-heading";
    const heading = document.createElement("h2");
    heading.id = "year-" + year.key;
    heading.textContent = year.name;
    header.appendChild(heading);
    card.appendChild(header);
    year.topics.forEach(([number, name, subBranches]) => {
      const topic = document.createElement("section");
      topic.className = "topic-section";
      topic.setAttribute("aria-labelledby", "topic-" + number);
      const title = document.createElement("h3");
      title.id = "topic-" + number;
      title.textContent = name;
      const trigger = document.createElement('button');
      trigger.type = 'button'; trigger.className = 'topic-trigger'; trigger.textContent = name;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', year.key + '-topic-' + number + '-gems');
      title.replaceChildren(trigger);
      topic.addEventListener('click', event => {
        if (event.target.closest('.gem-entry, .test-topic-all')) return;
        const opening = !topic.classList.contains('expanded');
        card.querySelectorAll('.topic-section').forEach(other => {
          const expanded = other === topic && opening;
          other.classList.toggle('expanded', expanded);
          other.querySelector('.topic-trigger').setAttribute('aria-expanded', String(expanded));
        });
      });
      topic.appendChild(title);
      const row = document.createElement("div");
      row.className = "topic-gems";
      row.id = year.key + '-topic-' + number + '-gems';
      subBranches.forEach((name, index) => {
        const data = { year: year.name, yearKey: year.key, topicNumber: number,
          topic: title.textContent, subNumber: index + 1, name,
          leafId: year.key + "-" + number + "-" + (index + 1) };
        const entry = document.createElement('div'); entry.className = 'gem-entry';
        row.append(entry);
        const svg = makeSvg("svg", { class: "gem-slot", viewBox: "2 2 44 44" }, entry);
        addGem(svg, {x:24, y:24}, data, -90);
        const label = document.createElement('span'); label.className = 'gem-name'; label.textContent = name;
        entry.append(label);
        label.addEventListener('click', () => svg.querySelector('[data-leaf]').dispatchEvent(new MouseEvent('click', {bubbles: true})));
      });
      topic.appendChild(row);
      card.appendChild(topic);
    });
    yearGrid.appendChild(card);
  });

  document.addEventListener("learningmodechange", () => {
    updatePupilMap();
    if (details.open && selectedGem) selectGem(selectedGem, selectedGem.gemData);
  });
  updatePupilMap();
  window.addEventListener("hashchange", () => {
    const gem = gemsByLeafId.get(location.hash.slice(1));
    if (gem) selectGem(gem, gem.gemData);
    else if (details.open) closeDetails(false);
  });
  function resetHomePanels() {
    closeDetails(false);
    document.querySelectorAll(".hub-expansion").forEach(panel => panel.hidden = true);
    document.querySelectorAll("[data-hub-panel]").forEach(button => button.setAttribute("aria-expanded","false"));
  }
  window.addEventListener("pagehide", resetHomePanels);
  window.addEventListener("pageshow", () => {
    resetHomePanels();
    try { records = progress.read(localStorage); } catch (_) { records = []; }
    updatePupilMap();
  });



})();
