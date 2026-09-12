(function (root) {
    "use strict";

    const { generationMetadata, reactions } = root.BondEnthalpyData;

    const sourceLabels = { past: "Pearson past-paper family", familiar: "Familiar IGCSE reaction" };

    function mulberry32(seed) {
      let state = seed >>> 0;
      return function () {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]);
    }

    function normaliseDifficulty(value) { return Math.max(1, Math.min(3, Math.round(Number(value) || 1))); }
    function allowsScaffold(difficulty) { return [1, 2, 3].includes(normaliseDifficulty(difficulty)); }
    function eligibleReactions(difficulty) {
      const level = normaliseDifficulty(difficulty);
      return reactions.filter((reaction) => reaction.allowedLevels.includes(level));
    }

    function enteredNumber(value) {
      const match = String(value).replace(/,/g, "").replace(/−/g, "-").match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
      return match ? Number(match[0]) : NaN;
    }

    function numberTolerance(token) {
      const normalised = String(token).replace(/[+−]/g, "");
      const decimalPlaces = normalised.includes(".") ? normalised.split(".")[1].length : 0;
      return 0.5 * (10 ** -decimalPlaces) + Number.EPSILON;
    }

    function markNumber(value, expected, tolerance) {
      const entered = enteredNumber(value);
      return Number.isFinite(entered) && Math.abs(entered - Number(expected)) <= Number(tolerance);
    }

    function sumBlock(role, rows, total) {
      const bondExpression = rows.map((row) => `${row.bond} × ${row.count}`).join(" + ");
      const valueExpression = rows.map((row) => `${row.energy} × ${row.count}`).join(" + ");
      return {
        type: "math",
        role,
        rows: [
          [role === "broken" ? "Energy to break bonds" : "Energy released when making bonds", bondExpression],
          ["", valueExpression],
          ["", `${total} kJ`]
        ]
      };
    }

    function deltaBlock(reaction) {
      return {
        type: "math",
        role: "delta-h",
        rows: [
          ["ΔH", "Energy to break bonds − energy released when making bonds"],
          ["", `${reaction.brokenTotal} − ${reaction.madeTotal}`],
          ["", `${String(reaction.deltaH).replace("-", "−")} kJ/mol`]
        ]
      };
    }

    function unknownSumBlock(role, rows, total, unknown) {
      const bondExpression = rows.map((row) => `${row.bond} × ${row.count}`).join(" + ");
      const valueExpression = rows.map((row) => row.bond === unknown.bond ? `x × ${row.count}` : `${row.energy} × ${row.count}`).join(" + ");
      return {
        type: "math",
        role,
        rows: [
          [role === "broken" ? "Energy to break bonds" : "Energy released when making bonds", bondExpression],
          ["", valueExpression]
        ]
      };
    }

    function unknownBondBlock(reaction, unknown) {
      const unknownOnBrokenSide = unknown.side === "broken";
      const knownBroken = reaction.brokenTotal - (unknownOnBrokenSide ? unknown.count * unknown.energy : 0);
      const knownMade = reaction.madeTotal - (unknownOnBrokenSide ? 0 : unknown.count * unknown.energy);
      const signedDelta = String(reaction.deltaH).replace("-", "−");
      const substitution = unknownOnBrokenSide
        ? `(${knownBroken} + x × ${unknown.count}) − ${reaction.madeTotal}`
        : `${reaction.brokenTotal} − (${knownMade} + x × ${unknown.count})`;
      const rearranged = unknownOnBrokenSide
        ? `(${signedDelta} + ${reaction.madeTotal} − ${knownBroken}) ÷ ${unknown.count}`
        : `(${reaction.brokenTotal} − ${knownMade} − (${signedDelta})) ÷ ${unknown.count}`;
      return {
        type: "math",
        role: "unknown-bond",
        rows: [
          ["ΔH", "Energy to break bonds − energy released when making bonds"],
          [signedDelta, substitution],
          ["x", rearranged],
          [`${unknown.bond} bond enthalpy`, `${unknown.energy} kJ/mol`]
        ]
      };
    }

    function generate(config, seed) {
      const difficulty = normaliseDifficulty(config.difficulty);
      const candidates = eligibleReactions(difficulty);
      if (!candidates.length) throw new Error(`No reactions are available for ${({1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"})[difficulty] || "Extension"}`);
      const rng = mulberry32(seed);
      let reaction;
      if (!config.reaction || config.reaction === "random") {
        reaction = candidates[Math.floor(rng() * candidates.length)];
      } else {
        reaction = candidates.find((item) => item.id === config.reaction);
        if (!reaction) throw new Error(`Reaction ${config.reaction} is not available at ${({1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"})[difficulty] || "Extension"}`);
      }

      const brokenBlock = sumBlock("broken", reaction.broken, reaction.brokenTotal);
      const madeBlock = sumBlock("made", reaction.made, reaction.madeTotal);
      const dhBlock = deltaBlock(reaction);
      const asksForUnknownBond = difficulty >= 2 && rng() < 0.5;
      let unknownBond = null;
      if (asksForUnknownBond) {
        const candidates = reaction.bondTable.filter((row) => {
          if (!row.required) return false;
          const onBrokenSide = reaction.broken.some((item) => item.bond === row.bond);
          const onMadeSide = reaction.made.some((item) => item.bond === row.bond);
          return onBrokenSide !== onMadeSide;
        });
        const selected = candidates[Math.floor(rng() * candidates.length)];
        const side = reaction.broken.some((row) => row.bond === selected.bond) ? "broken" : "made";
        const inventory = side === "broken" ? reaction.broken : reaction.made;
        const source = inventory.find((row) => row.bond === selected.bond);
        unknownBond = { bond: source.bond, count: source.count, energy: source.energy, side };
      }
      let parts;
      let responses;
      let answerParts;

      if (difficulty === 1) {
        parts = [
          "Calculate the energy to break all the bonds in the reactants.",
          "Calculate the energy released when making all the bonds in the products.",
          "Calculate the enthalpy change, ΔH, for the reaction. Include a sign in your answer."
        ];
        responses = [
          { key: "broken", symbol: "Energy to break bonds =", unit: "kJ", expected: reaction.brokenTotal, accessibleLabel: "Energy to break bonds in kilojoules" },
          { key: "made", symbol: "Energy released when making bonds =", unit: "kJ", expected: reaction.madeTotal, accessibleLabel: "Energy released when making bonds in kilojoules" },
          { key: "dh", symbol: "ΔH =", unit: "kJ/mol", expected: reaction.deltaH, accessibleLabel: "Enthalpy change in kilojoules per mole" }
        ];
        answerParts = [[brokenBlock], [madeBlock], [dhBlock]];
      } else if (asksForUnknownBond) {
        const suppliedDelta = String(reaction.deltaH).replace("-", "−");
        const equationSupport = difficulty === 2 ? "Use the displayed equation" : "Draw displayed formulae for every reactant and product, then use them";
        parts = [`The enthalpy change for this reaction is ${suppliedDelta} kJ/mol. ${equationSupport} and the other bond enthalpies to calculate the average ${unknownBond.bond} bond enthalpy. The missing value is shown as ? in the table.`];
        responses = [{ key: "unknown-bond", symbol: `${unknownBond.bond} bond enthalpy =`, unit: "kJ/mol", expected: unknownBond.energy, accessibleLabel: `Average ${unknownBond.bond} bond enthalpy in kilojoules per mole` }];
        const unknownBrokenBlock = unknownBond.side === "broken" ? unknownSumBlock("broken", reaction.broken, reaction.brokenTotal, unknownBond) : brokenBlock;
        const unknownMadeBlock = unknownBond.side === "made" ? unknownSumBlock("made", reaction.made, reaction.madeTotal, unknownBond) : madeBlock;
        answerParts = [[unknownBrokenBlock, unknownMadeBlock, unknownBondBlock(reaction, unknownBond)]];
      } else {
        parts = [difficulty === 2
          ? "Use the displayed equation and bond enthalpies to calculate the enthalpy change, ΔH. Include a sign in your answer."
          : "Draw displayed formulae for every reactant and product, then use them and the bond enthalpies to calculate ΔH. Include a sign in your answer."];
        responses = [{ key: "dh", symbol: "ΔH =", unit: "kJ/mol", expected: reaction.deltaH, accessibleLabel: "Enthalpy change in kilojoules per mole" }];
        answerParts = [[brokenBlock, madeBlock, dhBlock]];
      }

      return {
        seed,
        difficulty,
        reaction,
        questionType: asksForUnknownBond ? "unknown-bond" : "enthalpy-change",
        unknownBond,
        bondTable: reaction.bondTable.map((row) => ({ ...row, energy: unknownBond?.bond === row.bond ? null : row.energy })),
        parts,
        responses,
        answerParts,
        labels: {
          difficulty: `${({1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"})[difficulty] || "Extension"}`,
          family: reaction.family,
          source: sourceLabels[reaction.source],
          structure: difficulty === 1 ? "Three-part calculation" : difficulty === 2 ? "Displayed equation" : "Draw before calculating",
          task: asksForUnknownBond ? "Find a bond enthalpy" : "Find ΔH"
        }
      };
    }

    root.BondEnthalpyReviewCore = {
      generationMetadata,
      reactions,
      sourceLabels,
      normaliseDifficulty,
      allowsScaffold,
      eligibleReactions,
      enteredNumber,
      numberTolerance,
      markNumber,
      generate,
      escapeHtml
    };
  })(typeof globalThis !== "undefined" ? globalThis : window);
