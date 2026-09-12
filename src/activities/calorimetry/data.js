(function (root) {
  "use strict";

    const C = 4.20;

    const examples = [
      { id: "hcl-naoh", setup: "solution", group: "neutralisation", name: "hydrochloric acid + sodium hydroxide", equation: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)", sign: 1, nominalDh: -57, basis: "water formed", massRoutes: ["direct", "sum-volumes"], amountRoutes: ["given", "concentration", "limiting"], solutionA: "hydrochloric acid", solutionB: "sodium hydroxide", formulaA: "HCl", formulaB: "NaOH", coeffA: 1, coeffB: 1 },
      { id: "hno3-koh", setup: "solution", group: "neutralisation", name: "nitric acid + potassium hydroxide", equation: "HNO₃(aq) + KOH(aq) → KNO₃(aq) + H₂O(l)", sign: 1, nominalDh: -57, basis: "water formed", massRoutes: ["direct", "sum-volumes"], amountRoutes: ["given", "concentration", "limiting"], solutionA: "nitric acid", solutionB: "potassium hydroxide", formulaA: "HNO₃", formulaB: "KOH", coeffA: 1, coeffB: 1 },
      { id: "hcl-koh", setup: "solution", group: "neutralisation", name: "hydrochloric acid + potassium hydroxide", equation: "HCl(aq) + KOH(aq) → KCl(aq) + H₂O(l)", sign: 1, nominalDh: -57, basis: "water formed", massRoutes: ["direct", "sum-volumes"], amountRoutes: ["given", "concentration", "limiting"], solutionA: "hydrochloric acid", solutionB: "potassium hydroxide", formulaA: "HCl", formulaB: "KOH", coeffA: 1, coeffB: 1 },

      { id: "nh4no3", setup: "solution", group: "dissolving", name: "ammonium nitrate dissolving", equation: "NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)", sign: -1, nominalDh: 25.7, basis: "ammonium nitrate dissolved", massRoutes: ["direct", "water-solid"], amountRoutes: ["given", "mass"], solid: "ammonium nitrate", formula: "NH₄NO₃", mr: 80.0 },
      { id: "nh4cl", setup: "solution", group: "dissolving", name: "ammonium chloride dissolving", equation: "NH₄Cl(s) → NH₄⁺(aq) + Cl⁻(aq)", sign: -1, nominalDh: 14.8, basis: "ammonium chloride dissolved", massRoutes: ["direct", "water-solid"], amountRoutes: ["given", "mass"], solid: "ammonium chloride", formula: "NH₄Cl", mr: 53.5 },
      { id: "kcl", setup: "solution", group: "dissolving", name: "potassium chloride dissolving", equation: "KCl(s) → K⁺(aq) + Cl⁻(aq)", sign: -1, nominalDh: 17.2, basis: "potassium chloride dissolved", massRoutes: ["direct", "water-solid"], amountRoutes: ["given", "mass"], solid: "potassium chloride", formula: "KCl", mr: 74.6 },
      { id: "naoh", setup: "solution", group: "dissolving", name: "sodium hydroxide dissolving", equation: "NaOH(s) → Na⁺(aq) + OH⁻(aq)", sign: 1, nominalDh: -44.5, basis: "sodium hydroxide dissolved", massRoutes: ["direct", "water-solid"], amountRoutes: ["given", "mass"], solid: "sodium hydroxide", formula: "NaOH", mr: 40.0 },

      { id: "zn-cuso4", setup: "solution", group: "displacement", name: "zinc + copper(II) sulfate", equation: "Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s)", sign: 1, nominalDh: -217, basis: "copper(II) sulfate reacting", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "concentration", "limiting"], metal: "zinc", metalFormula: "Zn", metalMr: 65.4, solution: "copper(II) sulfate", solutionFormula: "CuSO₄", solutionCoeff: 1 },
      { id: "mg-cuso4", setup: "solution", group: "displacement", name: "magnesium + copper(II) sulfate", equation: "Mg(s) + CuSO₄(aq) → MgSO₄(aq) + Cu(s)", sign: 1, nominalDh: -530, basis: "copper(II) sulfate reacting", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "concentration", "limiting"], metal: "magnesium", metalFormula: "Mg", metalMr: 24.3, solution: "copper(II) sulfate", solutionFormula: "CuSO₄", solutionCoeff: 1 },
      { id: "fe-cuso4", setup: "solution", group: "displacement", name: "iron + copper(II) sulfate", equation: "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)", sign: 1, nominalDh: -153, basis: "copper(II) sulfate reacting", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "concentration", "limiting"], metal: "iron", metalFormula: "Fe", metalMr: 55.8, solution: "copper(II) sulfate", solutionFormula: "CuSO₄", solutionCoeff: 1 },

      { id: "mg-hcl", setup: "solution", group: "metal-acid", name: "magnesium + hydrochloric acid", equation: "Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)", sign: 1, nominalDh: -466, basis: "magnesium reacting", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "concentration", "limiting"], metal: "magnesium", metalFormula: "Mg", metalMr: 24.3, solution: "hydrochloric acid", solutionFormula: "HCl", solutionCoeff: 2 },
      { id: "zn-hcl", setup: "solution", group: "metal-acid", name: "zinc + hydrochloric acid", equation: "Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)", sign: 1, nominalDh: -153, basis: "zinc reacting", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "concentration", "limiting"], metal: "zinc", metalFormula: "Zn", metalMr: 65.4, solution: "hydrochloric acid", solutionFormula: "HCl", solutionCoeff: 2 },

      { id: "methanol", setup: "combustion", group: "combustion", name: "methanol", formula: "CH₃OH", mr: 32.0, density: 0.792, sign: 1, nominalDh: -500, basis: "methanol burned", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "burner-loss", "fuel-volume"] },
      { id: "ethanol", setup: "combustion", group: "combustion", name: "ethanol", formula: "C₂H₅OH", mr: 46.0, density: 0.789, sign: 1, nominalDh: -850, basis: "ethanol burned", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "burner-loss", "fuel-volume"] },
      { id: "propanol", setup: "combustion", group: "combustion", name: "propan-1-ol", formula: "C₃H₇OH", mr: 60.0, density: 0.803, sign: 1, nominalDh: -1100, basis: "propan-1-ol burned", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "burner-loss", "fuel-volume"] },
      { id: "butanol", setup: "combustion", group: "combustion", name: "butan-1-ol", formula: "C₄H₉OH", mr: 74.0, density: 0.810, sign: 1, nominalDh: -1350, basis: "butan-1-ol burned", massRoutes: ["direct", "single-volume"], amountRoutes: ["given", "mass", "burner-loss", "fuel-volume"] }
    ];

    const labels = {
      groups: { neutralisation: "Neutralisation", dissolving: "Dissolving", displacement: "Displacement", "metal-acid": "Metal + acid" },
      massRoutes: { direct: "Mass supplied directly", "single-volume": "One volume converted using density", "sum-volumes": "Two volumes added, then converted using density", "water-solid": "Mass of water + mass of dissolved solid" },
      amountRoutes: { given: "Moles supplied", mass: "Mass ÷ Mᵣ", concentration: "Concentration × volume", limiting: "Two reactants / limiting reactant", "burner-loss": "Burner mass before and after", "fuel-volume": "Fuel volume × density, then mass ÷ Mᵣ" },
      targets: { q: "Heat energy only", dh: "Molar enthalpy" },
      temperatureRoutes: { "initial-final": "Initial and final temperatures", delta: "Signed ΔT supplied", thermometers: "Thermometer diagrams" },
      structures: { "staged-q": "Two parts: ΔT → q", "single-q": "One part: q", "full-staged": "Fully staged multipart", "q-n-dh": "Three parts: q → moles → ΔH", "q-dh": "Two parts: q → ΔH", "single-dh": "One unstructured ΔH calculation" }
    };

  root.CalorimetryReviewData = { C, examples, labels };
})(typeof globalThis !== "undefined" ? globalThis : window);
