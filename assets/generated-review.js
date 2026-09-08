(function(root) {
  'use strict';
  const R = root.QuestionReview;
  function install(core, prefix, fields, resolve) {
    const codec = R.codec(prefix, fields), generate = core.generate;
    core.generateFromReviewId = id => {
      const decoded = codec.decode(id);
      if (prefix === 'CAL') decoded.config.setup = core.examples.find(e=>e.id===decoded.config.example).setup;
      const result = generate(decoded.config, decoded.seed);
      result.reviewId = R.format(prefix, decoded.seed);
      return result;
    };
    core.generate = (config, random) => {
      const provisional = generate(config, random);
      return core.generateFromReviewId(codec.encode(resolve(provisional), random));
    };
  }
  const be = root.BondEnthalpyReviewCore;
  if (be) install(be, 'BE', [
    {key:'reaction', radix:256, values:["hydrogen-chlorine","ethene-hydrogenation","butadiene-bromination","hydrogen-peroxide-decomposition","methanol-synthesis","ethene-hydration","methane-combustion","hydrazine-peroxide","haber-synthesis","ammonia-decomposition","methane-chlorination","ethene-bromination","propene-hydrogenation","propene-bromination","ethanol-combustion","ethane-dehydrogenation"]},
    {key:'difficulty', radix:4, values:[1,2,3]}
  ], r=>({reaction:r.reaction.id, difficulty:r.difficulty}));
  const cal = root.CalorimetryReviewCore;
  if (cal) install(cal, 'CAL', [
    {key:'example', radix:32, values:["hcl-naoh","hno3-koh","hcl-koh","nh4no3","nh4cl","kcl","naoh","zn-cuso4","mg-cuso4","fe-cuso4","mg-hcl","zn-hcl","methanol","ethanol","propanol","butanol"]},
    {key:'difficulty', radix:4, values:[1,2,3]},
    {key:'target', radix:2, values:['q','dh']},
    {key:'temperatureRoute', radix:4, values:['initial-final','delta','thermometers']},
    {key:'massRoute', radix:4, values:['direct','single-volume','sum-volumes','water-solid']},
    {key:'amountRoute', radix:8, values:['given','mass','concentration','limiting','burner-loss','fuel-volume']},
    {key:'structure', radix:8, values:['staged-q','single-q','full-staged','q-n-dh','q-dh','single-dh']}
  ], r=>({...r.config, example:r.example.id, difficulty:r.difficulty, structure:r.structure,
    amountRoute:r.config.target === 'q' ? 'given' : r.config.amountRoute}));
})(globalThis);
