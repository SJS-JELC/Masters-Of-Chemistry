(function(root){
  "use strict";
  const core=root.BondEnthalpyReviewCore;
  const families=[{id:"enthalpy-change",label:"Calculate the enthalpy change",levels:[1,2,3]},{id:"unknown-bond",label:"Find an average bond enthalpy",levels:[2,3]}];
  root.BondEnthalpyMastery=NumericMastery.build({id:"bond",families,
    prepare(s,f,{pick,rng}){
      s.previousReactions=s.previousReactions||{};const key=s.grade+"-"+f.id;
      const reactions=core.eligibleReactions(s.grade),varied=reactions.filter(r=>r.id!==s.previousReactions[key]);
      const reaction=pick(varied.length?varied:reactions),config={difficulty:s.grade,reaction:reaction.id};
      // Use the existing seeded generator so every question retains its reproducible review ID.
      let seed;for(let attempt=0;attempt<100;attempt++){seed=Math.floor(rng()*4294967296);if(core.generate(config,seed).questionType===f.id){s.previousReactions[key]=reaction.id;return {seed,config};}}
      throw Error("Could not prepare the next bond-enthalpy question.");
    },
    generate:c=>core.generate(c.config,c.seed),
    valid:c=>c.config.difficulty===c.grade&&core.generate(c.config,c.seed).questionType===c.family,
    selfCheck:c=>c.grade===3
  });
})(globalThis);
