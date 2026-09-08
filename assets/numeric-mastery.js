(function(root){
  "use strict";
  const bands={1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"};
  function parse(value){const text=String(value).trim().replaceAll("−","-");return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)?Number(text):NaN;}
  function mark(value,expected){const v=parse(value),tolerance=expected===0?1e-9:.500001*Math.pow(10,Math.floor(Math.log10(Math.abs(expected)))-2);return Number.isFinite(v)&&Math.abs(v-expected)<=tolerance;}
  function build(adapter){
    const families=adapter.families;
    const available=(ids,grade)=>families.filter(f=>ids.includes(f.id)&&grade<=3&&(!f.levels||f.levels.includes(grade))).map(f=>f.id);
    function rng(s){let x=s.rng>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
    const pick=(s,list)=>list[Math.floor(rng(s)*list.length)];
    function create(ids,seed,options={}){
      const selected=families.filter(f=>ids.includes(f.id)).map(f=>f.id),practice=options.practice==="grade"?"grade":"mastery",grade=practice==="grade"?Number(options.grade):1;
      if(!selected.length||![1,2,3].includes(grade)||!available(selected,grade).length)throw Error("No questions are available for this practice.");
      const s={version:1,id:adapter.id+"-"+Date.now()+"-"+seed,rng:(seed>>>0)||1,selected,practice,grade,queue:available(selected,grade),proof:[],round:"initial",cycle:1,current:null,completed:false,submitted:0,status:{}};
      selected.forEach(id=>s.status[id]={1:"pending",2:"pending",3:"pending"});next(s);return s;
    }
    function next(s, achievedGrade){
      if(s.completed)return null;
      if(s.current&&(!s.current.submitted||s.current.selfCheck==="pending"))throw Error("Finish checking this question before continuing.");
      if(!s.queue.length){
        if(s.practice==="grade"){s.queue=available(s.selected,s.grade);s.proof=[];s.round="cycle";s.cycle=(s.cycle||1)+1;}
        else if(achievedGrade !== undefined){
          if(!Number.isInteger(achievedGrade)||achievedGrade<0||achievedGrade>3)throw Error("Invalid achieved grade.");
          s.grade=achievedGrade+1;s.proof=[];
          if(s.grade>3){s.completed=true;s.current=null;return null;}
          s.queue=available(s.selected,s.grade);s.round="review";
        }
        else if(s.proof.length){s.queue=s.proof.slice();s.proof=[];s.round="proof";}
        else {do{s.grade++;s.queue=available(s.selected,s.grade);}while(s.grade<=3&&!s.queue.length);if(s.grade>3){s.completed=true;s.current=null;return null;}s.round="initial";}
      }
      const familyId=s.queue.shift(),family=families.find(f=>f.id===familyId);
      const generated=adapter.prepare(s,family,{rng:()=>rng(s),pick:list=>pick(s,list)});
      s.current={family:family.id,grade:s.grade,...generated,submitted:false,assisted:false,responses:[],correct:[],eligible:false,scaffoldParts:[],selfCheck:null};return s.current;
    }
    const generate=s=>adapter.generate(s.current);
    function finalise(s){const c=s.current;c.eligible=c.correct.every(Boolean)&&!c.assisted&&c.selfCheck!=="fail";s.status[c.family][s.grade]=c.eligible?"mastered":"due";if(!c.eligible&&!s.proof.includes(c.family))s.proof.push(c.family);}
    function submit(s,values){
      const q=generate(s);
      if(values.length!==q.responses.length||values.some(v=>!String(v).trim()))return {accepted:false,message:"Complete every answer before checking."};
      s.current.responses=values.slice();const correct=q.responses.map((r,i)=>mark(values[i],r.expected)),first=!s.current.submitted;
      if(first){s.current.submitted=true;s.submitted++;s.current.correct=correct;
        if(adapter.selfCheck?.(s.current)){s.current.selfCheck="pending";}else finalise(s);
      }
      return {accepted:true,first,correct,awaitingSelfCheck:s.current.selfCheck==="pending",eligible:first&&s.current.eligible};
    }
    function confirm(s,matches){if(s.current.selfCheck!=="pending")return false;s.current.selfCheck=matches?"pass":"fail";finalise(s);return true;}
    function validate(s){try{
      if(!s||s.version!==1||typeof s.id!=="string"||!Number.isInteger(s.rng)||!Array.isArray(s.selected)||!s.selected.length||new Set(s.selected).size!==s.selected.length||!s.selected.every(id=>families.some(f=>f.id===id))||![1,2,3,4].includes(s.grade))return false;
      if(s.practice!==undefined&&!["mastery","grade"].includes(s.practice))return false;
      if(!Array.isArray(s.queue)||!Array.isArray(s.proof)||![...s.queue,...s.proof].every(id=>available(s.selected,s.grade).includes(id))||!Number.isInteger(s.submitted)||s.submitted<0)return false;
      if(!s.selected.every(id=>[1,2,3].every(g=>["locked","pending","due","mastered"].includes(s.status[id][g]))))return false;
      if(s.completed)return s.grade===4&&s.current===null&&s.practice!=="grade";
      const c=s.current;if(!c||c.grade!==s.grade||!available(s.selected,s.grade).includes(c.family)||!Number.isInteger(c.seed)||!Array.isArray(c.responses)||!Array.isArray(c.scaffoldParts)||!adapter.valid(c))return false;
      const q=generate(s);return q.responses.length>0&&typeof c.submitted==="boolean"&&typeof c.assisted==="boolean"&&typeof c.eligible==="boolean"&&[undefined,null,"pending","pass","fail"].includes(c.selfCheck)&&Array.isArray(c.correct)&&c.correct.every(v=>typeof v==="boolean")&&(!c.submitted||c.correct.length===q.responses.length)&&c.responses.length<=q.responses.length&&c.responses.every(v=>v===null||typeof v==="string")&&c.scaffoldParts.every(i=>Number.isInteger(i)&&i>=0&&i<q.responses.length);
    }catch(_){return false;}}
    return {bands,families,available,create,next,generate,parse,mark,submit,confirm,validate};
  }
  root.NumericMastery={build};
})(globalThis);
