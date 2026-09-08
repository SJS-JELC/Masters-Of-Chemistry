(function(){
  "use strict";
  const mode=ChemistryMode.get(), teacher=mode==="teacher";
  document.addEventListener("learningmodechange",()=>{if(ChemistryMode.get()!==mode)location.reload();});
  const path=location.pathname;
  if(path.includes("structure-and-bonding")){
    const toggle=document.getElementById("teacherMode");
    if(teacher&&toggle.getAttribute("aria-pressed")!=="true")toggle.click();
    toggle.hidden=true;
    if(teacher){
      document.getElementById("responseLevel").closest(".field").hidden=true;
      const print=QuestionPrint.create(()=>window.print());print.classList.add("teacher-print");document.querySelector(".controls").appendChild(print);
    }
  }
  if(path.includes("bond-enthalpy")){
    if(teacher)document.querySelector("h1 span").textContent="question selection";
    document.querySelector(".controls").open=teacher;
    if(!teacher){document.querySelector(".controls").hidden=true;document.getElementById("generate").textContent="Next practice question";}
  }
  if(teacher){
    const support=document.getElementById("difficulty");
    if(support)[...support.options].forEach((option,i)=>option.textContent=["Guided calculation","Mixed information","Independent calculation"][i]||option.textContent);
    document.querySelectorAll(".control-note").forEach(el=>el.textContent=el.textContent.replace(/Grade 5–6/g,"guided practice").replace(/Grade 7–8/g,"mixed practice").replace(/Grade 9/g,"independent practice"));
  }
  if(teacher&&path.includes("energy-enthalpy")){
    document.querySelector(".layout").hidden=true;
    {
      const reviewBank=QuestionReview.bank('EE',EnergyData.questions);
      const items=EnergyData.questions.map(q=>{
        const item=document.createElement('article');item.className='key-item';item.dataset.reviewId=reviewBank.id(q);
        const title=document.createElement('h3');title.textContent=q.prompt;item.appendChild(title);
        if(q.equation){const equation=document.createElement('p');equation.textContent=q.equation;item.appendChild(equation);}
        if(q.enthalpyText){const enthalpy=document.createElement('p');enthalpy.className='question-enthalpy';enthalpy.textContent=q.enthalpyText;item.appendChild(enthalpy);}
        if(q.diagram){const diagram=document.createElement('div');diagram.innerHTML=EnergyEditor.reference(q.diagram);item.appendChild(diagram);}
        if(q.kind){const diagram=document.createElement('div');diagram.className='diagram-card';diagram.innerHTML=EnergyEditor.svg(EnergyCore.initial(q),q.editor);item.appendChild(diagram);}
        (q.fields||[]).forEach(field=>{const line=document.createElement('p');line.textContent=field.label+(field.options?' Choose: '+field.options.join(' / '):'');item.appendChild(line);});
        const answers=document.createElement('ol');answers.setAttribute('aria-label','Mark scheme');
        q.points.forEach(point=>{const li=document.createElement('li');li.textContent=point;answers.appendChild(li);});item.appendChild(answers);
        if(q.kind){const model=document.createElement('div');model.className='diagram-card';model.innerHTML=EnergyEditor.svg(EnergyCore.model(q),q.editor);item.appendChild(model);}
        const feedback=document.createElement('p');feedback.textContent=q.feedback;item.appendChild(feedback);return item;
      });
      const section=document.createElement("section");section.className="panel teacher-bank";
      const heading=document.createElement("h2");heading.textContent="Choose a question";section.appendChild(heading);
      const label=document.createElement("label");label.textContent="Question ";const select=document.createElement("select");select.id="teacherQuestion";label.appendChild(select);section.appendChild(label);
      items.forEach((item,i)=>{const option=document.createElement("option");option.value=i;option.textContent=item.querySelector("h3").textContent;select.appendChild(option);});
      const print=QuestionPrint.create(()=>window.print());print.classList.add("teacher-print");section.appendChild(print);
      const workspace=document.createElement("div");workspace.className="teacher-bank-question";section.appendChild(workspace);
      const loadReview=id=>{const entry=items.findIndex(item=>item.dataset.reviewId===id.trim().toUpperCase());if(entry<0)throw new Error('That review ID is not in this question bank.');select.value=entry;show();};
      const show=()=>{workspace.replaceChildren();if(items[select.value]){const copy=items[select.value].cloneNode(true);workspace.appendChild(copy);QuestionReview.mount(workspace,items[select.value].dataset.reviewId,loadReview);}};select.addEventListener("change",show);show();
      document.querySelector(".page").appendChild(section);QuestionReview.requested(loadReview);
    }
  }
})();
