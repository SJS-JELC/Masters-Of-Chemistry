(function(root){
  "use strict";
  const core=root.CalorimetryReviewCore;
  const families=[
    {id:"solution-q",label:"Heat energy · solutions",setup:"solution",target:"q"},
    {id:"combustion-q",label:"Heat energy · combustion",setup:"combustion",target:"q"},
    {id:"solution-dh",label:"Molar enthalpy · solutions",setup:"solution",target:"dh"},
    {id:"combustion-dh",label:"Molar enthalpy · combustion",setup:"combustion",target:"dh"}
  ];
  root.CalorimetryMastery=NumericMastery.build({id:"cal",families,
    prepare(s,f,{pick,rng}){
      const example=pick(core.examples.filter(e=>e.setup===f.setup));
      const massRoute=s.grade===1?"direct":pick(example.massRoutes),amounts=s.grade===1?["given"]:example.amountRoutes.filter(r=>s.grade===3||r!=="limiting");
      return {seed:Math.floor(rng()*4294967296),config:{setup:f.setup,target:f.target,example:example.id,difficulty:s.grade,massRoute,amountRoute:pick(amounts),temperatureRoute:s.grade===1?"initial-final":pick(["initial-final","thermometers","delta"]),structure:f.target==="q"?(s.grade===3?"single-q":"staged-q"):(s.grade===3?"single-dh":"full-staged")}};
    },
    generate:c=>core.generate(c.config,c.seed),
    valid(c){const f=families.find(f=>f.id===c.family);return c.config.setup===f.setup&&c.config.target===f.target&&c.config.difficulty===c.grade;}
  });
})(globalThis);
