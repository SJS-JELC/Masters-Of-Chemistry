(function (root) {
  "use strict";

  root.MASTERS_HIERARCHY = Object.freeze([
    {
      key: "fourth", name: "Fourth Form", colour: "#55f6ff", angle: -90,
      topics: [
        [1, "Particles", ["Basics", "States of Matter", "Diffusion", "Dissolving", "Separating Techniques"]],
        [2, "Atomic Structure & Periodic Table", ["Atomic Structure", "Relative Atomic Mass", "Periodic Table", "Group 1", "Group 7"]],
        [3, "Bonding", ["Ionic Bonding", "Covalent Bonding"]],
        [4, "Chemical Tests", ["Gases", "Cations", "Anions", "Combined"]]
      ]
    },
    {
      key: "lower", name: "Lower Fifth", colour: "#54f5b5", angle: 30,
      topics: [
        [5, "Rates", ["Collision Theory", "Graphs", "Practical Work"]],
        [6, "Structure & Bonding", ["Simple Molecular", "Giant Covalent", "Ionic", "Metallic", "Comparisons"]],
        [7, "Calculations", ["Masses", "Empirical Formulae", "Solutions", "Gases", "Reactions"]],
        [8, "Acids, Bases, & Salts", ["Basics", "Indicators and pH", "Reactions", "Solubility", "Making Salts"]],
        [9, "Organic I", ["Basics", "Alkanes", "Alkenes", "Crude Oil", "Cracking"]],
        [10, "Energetics", ["Energy and Enthalpy", "Practical Work", "Calorimetry", "Bond Energies"]]
      ]
    },
    {
      key: "upper", name: "Upper Fifth", colour: "#ff5ecb", angle: 150,
      topics: [
        [11, "Gases", ["Air", "Oxides", "Combustion", "Carbon Dioxide", "Hydrogen and Water"]],
        [12, "Equilibria", ["Reversible Reactions", "Dynamic Equilibrium", "Changing Equilibria"]],
        [13, "Redox & Electrolysis", ["Reactivity", "Redox", "Rusting", "Electrolysis"]],
        [14, "Organic II", ["Alcohols", "Carboxylic Acids", "Esters", "Polymers"]],
        [15, "Practical Chemistry", ["Techniques", "Planning", "Observation", "Data", "Evaluation"]]
      ]
    }
  ]);

  root.MASTERS_ACTIVITIES = Object.freeze({
    "fourth-3-1": Object.freeze({
      id: "dot-and-cross", label: "Build ionic diagrams", type: "diagram",
      typeLabel: "Dot & Cross", href: "activities/dot-and-cross/index.html?category=ionic", diagramGrades: [1, 2]
    }),
    "fourth-3-2": Object.freeze({
      id: "dot-and-cross", label: "Build covalent diagrams", type: "diagram",
      typeLabel: "Dot & Cross", href: "activities/dot-and-cross/index.html?category=covalent", diagramGrades: [1, 2, 3]
    }),
    "lower-10-1": Object.freeze({
      id: "energy-enthalpy",
      practiceModes: true,
      availableGrades: [1, 2],
      label: "Start Energy & Enthalpy",
      type: "short-answer",
      typeLabel: "Short answer",
      href: "activities/energy-enthalpy/index.html"
    }),
    "lower-6-5": Object.freeze({
      id: "structure-and-bonding",
      label: "Start Structure & Bonding",
      type: "long-answer",
      typeLabel: "Long answer",
      href: "activities/structure-and-bonding/index.html"
    }),
    "lower-10-3": Object.freeze({
      id: "calorimetry",
      practiceModes: true,
      label: "Start Calorimetry",
      type: "calculation",
      typeLabel: "Calculation",
      href: "activities/calorimetry/index.html"
    }),
    "lower-10-4": Object.freeze({
      id: "bond-enthalpy",
      practiceModes: true,
      label: "Start Bond Enthalpy",
      type: "calculation",
      typeLabel: "Calculation",
      href: "activities/bond-enthalpy/index.html"
    })
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
