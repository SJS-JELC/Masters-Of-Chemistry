(function(root){
  "use strict";
  const requested = new URLSearchParams(location.search).get("mode");
  let mode = "pupil";
  try { mode = sessionStorage.getItem("masters-igcse-mode") || mode; } catch (_) {}
  if (requested === "teacher" || requested === "pupil") mode = requested;
  if (mode !== "teacher") mode = "pupil";
  document.documentElement.dataset.learningMode = mode;
  function set(next) {
    mode = next === "teacher" ? "teacher" : "pupil";
    document.documentElement.dataset.learningMode = mode;
    try { sessionStorage.setItem("masters-igcse-mode", mode); } catch (_) {}
    const url = new URL(location.href); url.searchParams.set("mode",mode);
    try { history.replaceState(null,"",url.href); } catch (_) {}
    document.querySelectorAll("[data-mode-toggle]").forEach(button => {
      button.setAttribute("aria-pressed",String(mode === "teacher"));
      button.setAttribute("aria-label",mode === "teacher" ? "Switch to pupil practice" : "Switch to teacher question selection");
      button.title = button.getAttribute("aria-label");
    });
    document.querySelectorAll("[data-mode-label]").forEach(label => label.textContent = mode === "teacher" ? "Question selection" : "Pupil practice");
    document.querySelectorAll('a[href]').forEach(link => {
      const target = new URL(link.href);
      if (!decodeURIComponent(target.pathname).endsWith('/Masters of IGCSE Chemistry.html')) return;
      target.searchParams.set("mode",mode); target.hash=""; link.href=target.href;
    });
    document.dispatchEvent(new CustomEvent("learningmodechange",{detail:mode}));
  }
  function bind() {
    document.querySelectorAll("[data-mode-toggle]").forEach(button => button.addEventListener("click",()=>set(mode === "teacher" ? "pupil" : "teacher")));
    set(mode);
  }
  root.ChemistryMode = { get:()=>mode, set };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",bind); else bind();
})(globalThis);
