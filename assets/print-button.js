(function(root){
  "use strict";
  function markup(){return '<button class="print-question" type="button" data-print-question aria-label="Print this question and mark scheme" title="Print question and mark scheme"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/><path d="M18 12h.01"/></svg><span>Print</span></button>';}
  function create(handler){const template=document.createElement("template");template.innerHTML=markup();const button=template.content.firstElementChild;button.addEventListener("click",handler);return button;}
  root.QuestionPrint={markup,create};
})(globalThis);
