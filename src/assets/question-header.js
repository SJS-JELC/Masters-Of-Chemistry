(function () {
  'use strict';
  function mount() {
    const eyebrow = document.querySelector('main > header .eyebrow');
    if (!eyebrow) return;
    document.documentElement.classList.add('question-code-header');
    eyebrow.classList.add('question-code-line');
    const title = document.createElement('span'); title.textContent = 'SJS // MASTERY';
    const pill = document.createElement('span'); pill.className = 'header-question-code'; pill.hidden = true;
    pill.setAttribute('aria-label', 'Question code'); eyebrow.replaceChildren(title, pill);
    function update() {
      const source = document.querySelector('.review-id, .question-review-id, #printedReviewId');
      const code = source?.textContent.match(/\b[A-Z]{2,3}-[A-Z0-9]{6}\b/)?.[0] || '';
      if (pill.textContent !== code) pill.textContent = code;
      pill.hidden = !code;
    }
    new MutationObserver(update).observe(document.body, {childList:true, subtree:true, characterData:true});
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
