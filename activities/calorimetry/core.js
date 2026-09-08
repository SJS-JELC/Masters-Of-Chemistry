(function (root) {
    "use strict";

    const { C, examples, labels } = root.CalorimetryReviewData;    function mulberry32(seed) {
      let state = seed >>> 0;
      return function () {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    }

    function pick(rng, values) { return values[Math.floor(rng() * values.length)]; }
    function between(rng, minimum, maximum) { return minimum + rng() * (maximum - minimum); }
    function round(value, places) { const scale = 10 ** places; return Math.round((value + Number.EPSILON) * scale) / scale; }
    function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
    function signed(value, places = 1) { return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(places)}`; }
    function sf(value, figures = 3) { return Number(value.toPrecision(figures)); }
    function display(value, figures = 3) { return String(sf(value, figures)).replace("-", "−"); }
    function escapeHtml(value) { return String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]); }

    function numberTolerance(token) {
      const normalised = String(token).replace(/[+−]/g, "");
      const decimalPlaces = normalised.includes(".") ? normalised.split(".")[1].length : 0;
      return 0.5 * (10 ** -decimalPlaces) + Number.EPSILON;
    }

    function enteredNumber(value) {
      const match = String(value).replace(/,/g, "").replace(/−/g, "-").match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
      return match ? Number(match[0]) : NaN;
    }

    function markNumber(value, expected, tolerance) {
      const entered = enteredNumber(value);
      return Number.isFinite(entered) && Math.abs(entered - Number(expected)) <= Number(tolerance);
    }

    function normaliseDifficulty(value) {
      return clamp(Math.round(Number(value) || 2), 1, 3);
    }

    function allowsScaffold(difficulty) {
      return [1, 2, 3].includes(normaliseDifficulty(difficulty));
    }

    function candidates(selection, setup) {
      let result = examples.filter((example) => example.setup === setup);
      if (!selection || selection === "any") return result;
      if (selection.startsWith("group:")) return result.filter((example) => example.group === selection.slice(6));
      return result.filter((example) => example.id === selection);
    }

    function routeIntersection(selection, setup, routeKey) {
      const values = new Set();
      candidates(selection, setup).forEach((example) => example[routeKey].forEach((route) => values.add(route)));
      return [...values];
    }

    function structureOptions(target, amountRoute, difficulty) {
      const options = [{ value: "auto", label: "Automatic for difficulty" }];
      if (target === "q") {
        options.push({ value: "staged-q", label: labels.structures["staged-q"] });
        options.push({ value: "single-q", label: labels.structures["single-q"] });
        return options;
      }
      options.push({ value: "full-staged", label: labels.structures["full-staged"] });
      if (amountRoute !== "given") options.push({ value: "q-n-dh", label: labels.structures["q-n-dh"] });
      options.push({ value: "q-dh", label: labels.structures["q-dh"] });
      if (normaliseDifficulty(difficulty) === 3) options.push({ value: "single-dh", label: labels.structures["single-dh"] });
      return options;
    }

    function weightedPick(rng, weightedValues) {
      const total = weightedValues.reduce((sum, entry) => sum + entry.weight, 0);
      let cursor = rng() * total;
      for (const entry of weightedValues) {
        cursor -= entry.weight;
        if (cursor < 0) return entry.value;
      }
      return weightedValues[weightedValues.length - 1].value;
    }

    function resolveStructure(rng, target, amountRoute, difficulty, requested) {
      const allowed = structureOptions(target, amountRoute, difficulty).map((option) => option.value).filter((value) => value !== "auto");
      if (requested && requested !== "auto") {
        if (!allowed.includes(requested)) throw new Error(`Question structure ${requested} is not available for this combination`);
        return requested;
      }
      const level = normaliseDifficulty(difficulty);
      if (target === "q") {
        const stagedWeight = ({ 1: 85, 2: 75, 3: 37.5 })[level] ?? 75;
        return weightedPick(rng, [{ value: "staged-q", weight: stagedWeight }, { value: "single-q", weight: 100 - stagedWeight }]);
      }
      const derivedMoles = amountRoute !== "given";
      const weightSets = {
        1: derivedMoles
          ? [{ value: "full-staged", weight: 50 }, { value: "q-n-dh", weight: 45 }, { value: "q-dh", weight: 5 }]
          : [{ value: "full-staged", weight: 75 }, { value: "q-dh", weight: 25 }],
        2: derivedMoles
          ? [{ value: "full-staged", weight: 35 }, { value: "q-n-dh", weight: 45 }, { value: "q-dh", weight: 20 }]
          : [{ value: "full-staged", weight: 60 }, { value: "q-dh", weight: 40 }],
        3: derivedMoles
          ? [{ value: "full-staged", weight: 15 }, { value: "q-n-dh", weight: 30 }, { value: "q-dh", weight: 35 }, { value: "single-dh", weight: 20 }]
          : [{ value: "full-staged", weight: 30 }, { value: "q-dh", weight: 50 }, { value: "single-dh", weight: 20 }]
      };
      return weightedPick(rng, weightSets[level] || weightSets[2]);
    }

    function exampleOptions(setup) {
      if (setup === "combustion") {
        return [{ value: "any", label: "Random alcohol" }, ...examples.filter((item) => item.setup === setup).map((item) => ({ value: item.id, label: item.name }))];
      }
      const options = [{ value: "any", label: "Random solution-phase reaction" }];
      Object.entries(labels.groups).forEach(([value, label]) => options.push({ value: `group:${value}`, label: `Random ${label.toLowerCase()} example` }));
      examples.filter((item) => item.setup === setup).forEach((item) => options.push({ value: item.id, label: item.name }));
      return options;
    }

    function preliminaryMass(rng, example, route) {
      if (route === "direct") {
        const mass = pick(rng, example.setup === "combustion" ? [75, 100, 120, 150, 200] : [40, 50, 60, 75, 80, 100, 120]);
        return { route, mass, rows: [[example.setup === "combustion" ? "Mass of water" : "Mass of reaction mixture", `${mass.toFixed(1)} g`]], working: `m = ${mass.toFixed(1)} g` };
      }
      if (route === "single-volume") {
        const volume = pick(rng, example.setup === "combustion" ? [75, 100, 125, 150, 200] : [25, 40, 50, 60, 75, 100]);
        const label = example.setup === "combustion" ? "water" : (example.solution || "solution");
        return { route, mass: volume, volume, density: 1.00, rows: [[`Volume of ${label}`, `${volume.toFixed(1)} cm³`], [`Density of ${label}`, "1.00 g/cm³"]], working: `m = ${volume.toFixed(1)} × 1.00 = ${volume.toFixed(1)} g` };
      }
      if (route === "sum-volumes") {
        const volumeA = pick(rng, [20, 25, 30, 40, 50]);
        const volumeB = pick(rng, [20, 25, 30, 40, 50]);
        const mass = volumeA + volumeB;
        return { route, mass, volumeA, volumeB, density: 1.00, rows: [[`Volume of ${example.solutionA}`, `${volumeA.toFixed(1)} cm³`], [`Volume of ${example.solutionB}`, `${volumeB.toFixed(1)} cm³`], ["Density of both solutions", "1.00 g/cm³"]], working: `m = (${volumeA.toFixed(1)} + ${volumeB.toFixed(1)}) × 1.00 = ${mass.toFixed(1)} g` };
      }
      const waterMass = pick(rng, [50, 75, 80, 90, 100, 120]);
      return { route, waterMass, rows: [["Mass of water", `${waterMass.toFixed(1)} g`]] };
    }

    function targetMoles(rng, example) {
      if (example.setup === "combustion") return pick(rng, [0.006, 0.008, 0.010, 0.012, 0.015]);
      if (example.group === "dissolving") return pick(rng, [0.040, 0.050, 0.060, 0.075, 0.080, 0.100]);
      if (Math.abs(example.nominalDh) > 300) return pick(rng, [0.005, 0.006, 0.008, 0.010, 0.012]);
      return pick(rng, [0.010, 0.015, 0.020, 0.025, 0.030, 0.040]);
    }

    function amountFromGiven(rng, example) {
      const n = targetMoles(rng, example);
      const shown = n.toFixed(n < 0.01 ? 4 : 3);
      return { n, rows: [[`Amount of ${example.basis}`, `${shown} mol`]], working: `n = ${shown} mol`, workingRows: [[`Moles of ${example.basis}`, `${shown} mol (given)`]], solidMass: example.group === "dissolving" ? round(n * example.mr, 2) : null };
    }

    function amountFromMass(rng, example) {
      const wanted = targetMoles(rng, example);
      const substance = example.setup === "combustion" || example.group === "dissolving" ? example.name.replace(" dissolving", "") : example.metal;
      const formula = example.setup === "combustion" || example.group === "dissolving" ? example.formula : example.metalFormula;
      const mr = example.setup === "combustion" || example.group === "dissolving" ? example.mr : example.metalMr;
      const mass = round(wanted * mr, example.setup === "combustion" ? 3 : 2);
      const n = mass / mr;
      const rows = [[`Mass of ${substance}`, `${mass.toFixed(example.setup === "combustion" ? 3 : 2)} g`], [`Mᵣ of ${formula}`, mr.toFixed(1)]];
      if (example.metal) rows.push([`${example.solution[0].toUpperCase() + example.solution.slice(1)} solution`, "excess"]);
      const shownMass = mass.toFixed(example.setup === "combustion" ? 3 : 2);
      return {
        n,
        basis: example.metal ? `${example.metal} reacting` : example.basis,
        rows,
        working: `n(${formula}) = ${shownMass} ÷ ${mr.toFixed(1)} = ${display(n)} mol`,
        workingRows: [
          [`Moles of ${substance}`, { fraction: [`mass of ${substance}`, `Mᵣ of ${formula}`] }],
          ["", { fraction: [`${shownMass} g`, mr.toFixed(1)] }],
          ["", `${display(n)} mol`]
        ],
        solidMass: example.group === "dissolving" ? mass : null
      };
    }

    function amountFromConcentration(rng, example, massInfo) {
      const coefficient = example.group === "neutralisation" ? example.coeffA : example.solutionCoeff;
      const solutionName = example.group === "neutralisation" ? example.solutionA : example.solution;
      const formula = example.group === "neutralisation" ? example.formulaA : example.solutionFormula;
      const volume = example.group === "neutralisation" && massInfo.volumeA ? massInfo.volumeA : (massInfo.volume || pick(rng, [20, 25, 30, 40, 50, 60]));
      const concentration = pick(rng, [0.200, 0.250, 0.400, 0.500, 0.800, 1.00]);
      const solutionMoles = concentration * volume / 1000;
      const n = solutionMoles / coefficient;
      const excessName = example.group === "neutralisation" ? example.solutionB : example.metal;
      const shownConcentration = concentration.toFixed(concentration === 1 ? 2 : 3);
      const volumeDm3 = volume / 1000;
      const workingRows = [
        [`Moles of ${formula}`, `concentration of ${formula} × volume of ${formula} in dm³`],
        [`Volume of ${formula} in dm³`, { fraction: [`volume of ${formula} in cm³`, "1000"] }],
        ["", { fraction: [`${volume.toFixed(1)} cm³`, "1000"] }],
        ["", `${display(volumeDm3)} dm³`],
        [`Moles of ${formula}`, `${shownConcentration} × ${display(volumeDm3)}`],
        ["", `${display(solutionMoles)} mol`]
      ];
      if (coefficient !== 1) {
        workingRows.push(["Moles reacting", { fraction: [`moles of ${formula}`, `coefficient of ${formula}`] }]);
        workingRows.push(["", { fraction: [display(solutionMoles), String(coefficient)] }]);
        workingRows.push(["", `${display(n)} mol`]);
      }
      return { n, rows: [[`Volume of ${solutionName}`, `${volume.toFixed(1)} cm³`], [`Concentration of ${formula}`, `${shownConcentration} mol/dm³`], [excessName[0].toUpperCase() + excessName.slice(1), "excess"]], working: `n(${formula}) = ${shownConcentration} × ${volume.toFixed(1)} ÷ 1000 = ${display(solutionMoles)} mol${coefficient === 1 ? "" : `; n reacting = ${display(solutionMoles)} ÷ ${coefficient} = ${display(n)} mol`}`, workingRows };
    }

    function amountFromLimiting(rng, example, massInfo) {
      if (example.group === "neutralisation") {
        const volumeA = massInfo.volumeA || pick(rng, [20, 25, 30, 40, 50]);
        const volumeB = massInfo.volumeB || pick(rng, [20, 25, 30, 40, 50]);
        const concentrationA = pick(rng, [0.400, 0.500, 0.800, 1.00]);
        let concentrationB = pick(rng, [0.250, 0.400, 0.500, 0.800, 1.00]);
        if (Math.abs(concentrationA * volumeA - concentrationB * volumeB) < 0.5) concentrationB = concentrationB === 1 ? 0.8 : 1.0;
        const extentA = concentrationA * volumeA / 1000 / example.coeffA;
        const extentB = concentrationB * volumeB / 1000 / example.coeffB;
        const n = Math.min(extentA, extentB);
        const limiting = extentA < extentB ? example.formulaA : example.formulaB;
        const molesA = concentrationA * volumeA / 1000;
        const molesB = concentrationB * volumeB / 1000;
        const volumeADm3 = volumeA / 1000;
        const volumeBDm3 = volumeB / 1000;
        return {
          n,
          rows: [[example.formulaA, `${volumeA.toFixed(1)} cm³ of ${concentrationA.toFixed(2)} mol/dm³`], [example.formulaB, `${volumeB.toFixed(1)} cm³ of ${concentrationB.toFixed(2)} mol/dm³`]],
          working: `n(${example.formulaA}) = ${display(molesA)} mol; n(${example.formulaB}) = ${display(molesB)} mol. ${limiting} is limiting, so n(${example.basis}) = ${display(n)} mol`,
          workingRows: [
            [`Moles of ${example.formulaA}`, `concentration of ${example.formulaA} × volume of ${example.formulaA} in dm³`],
            [`Volume of ${example.formulaA} in dm³`, { fraction: [`volume of ${example.formulaA} in cm³`, "1000"] }],
            ["", { fraction: [`${volumeA.toFixed(1)} cm³`, "1000"] }],
            ["", `${display(volumeADm3)} dm³`],
            [`Moles of ${example.formulaA}`, `${concentrationA.toFixed(2)} × ${display(volumeADm3)}`],
            ["", `${display(molesA)} mol`],
            [`Moles of ${example.formulaB}`, `concentration of ${example.formulaB} × volume of ${example.formulaB} in dm³`],
            [`Volume of ${example.formulaB} in dm³`, { fraction: [`volume of ${example.formulaB} in cm³`, "1000"] }],
            ["", { fraction: [`${volumeB.toFixed(1)} cm³`, "1000"] }],
            ["", `${display(volumeBDm3)} dm³`],
            [`Moles of ${example.formulaB}`, `${concentrationB.toFixed(2)} × ${display(volumeBDm3)}`],
            ["", `${display(molesB)} mol`],
            ["Limiting reactant", limiting],
            [`Moles of ${example.basis}`, `${display(n)} mol`]
          ]
        };
      }
      const solutionVolume = massInfo.volume || pick(rng, [25, 40, 50, 60]);
      const concentration = pick(rng, [0.200, 0.250, 0.400, 0.500, 0.800, 1.00]);
      const solutionMoles = concentration * solutionVolume / 1000;
      const solutionExtent = solutionMoles / example.solutionCoeff;
      const metalExtent = solutionExtent * pick(rng, [0.70, 0.80, 1.20, 1.35]);
      const metalMass = round(metalExtent * example.metalMr, 3);
      const actualMetalExtent = metalMass / example.metalMr;
      const n = Math.min(actualMetalExtent, solutionExtent);
      const limiting = actualMetalExtent < solutionExtent ? example.metalFormula : example.solutionFormula;
      const basis = example.group === "displacement"
        ? (actualMetalExtent < solutionExtent ? `${example.metal} reacting` : `${example.solution} reacting`)
        : example.basis;
      const shownConcentration = concentration.toFixed(concentration === 1 ? 2 : 3);
      const solutionVolumeDm3 = solutionVolume / 1000;
      return {
        n,
        basis,
        rows: [[`Mass of ${example.metal}`, `${metalMass.toFixed(3)} g`], [`Mᵣ of ${example.metalFormula}`, example.metalMr.toFixed(1)], [`Volume of ${example.solution}`, `${solutionVolume.toFixed(1)} cm³`], [`Concentration of ${example.solutionFormula}`, `${shownConcentration} mol/dm³`]],
        working: `n(${example.metalFormula}) = ${metalMass.toFixed(3)} ÷ ${example.metalMr.toFixed(1)} = ${display(actualMetalExtent)} mol; reaction amount from ${example.solutionFormula} = ${display(solutionMoles)} ÷ ${example.solutionCoeff} = ${display(solutionExtent)} mol. ${limiting} is limiting, so n reacting = ${display(n)} mol`,
        workingRows: [
          [`Moles of ${example.metalFormula}`, { fraction: [`mass of ${example.metalFormula}`, `Mᵣ of ${example.metalFormula}`] }],
          ["", { fraction: [`${metalMass.toFixed(3)} g`, example.metalMr.toFixed(1)] }],
          ["", `${display(actualMetalExtent)} mol`],
          [`Moles of ${example.solutionFormula}`, `concentration of ${example.solutionFormula} × volume of ${example.solutionFormula} in dm³`],
          [`Volume of ${example.solutionFormula} in dm³`, { fraction: [`volume of ${example.solutionFormula} in cm³`, "1000"] }],
          ["", { fraction: [`${solutionVolume.toFixed(1)} cm³`, "1000"] }],
          ["", `${display(solutionVolumeDm3)} dm³`],
          [`Moles of ${example.solutionFormula}`, `${shownConcentration} × ${display(solutionVolumeDm3)}`],
          ["", `${display(solutionMoles)} mol`],
          [`Reaction amount from ${example.solutionFormula}`, { fraction: [`moles of ${example.solutionFormula}`, `coefficient of ${example.solutionFormula}`] }],
          ["", { fraction: [display(solutionMoles), String(example.solutionCoeff)] }],
          ["", `${display(solutionExtent)} mol`],
          ["Limiting reactant", limiting],
          ["Moles reacting", `${display(n)} mol`]
        ]
      };
    }

    function amountFromBurnerLoss(rng, example) {
      const wanted = targetMoles(rng, example);
      const burned = round(wanted * example.mr, 2);
      const initial = round(between(rng, 70, 110), 2);
      const final = round(initial - burned, 2);
      const actualBurned = round(initial - final, 2);
      const n = actualBurned / example.mr;
      return {
        n,
        rows: [["Initial mass of burner and fuel", `${initial.toFixed(2)} g`], ["Final mass of burner and fuel", `${final.toFixed(2)} g`], [`Mᵣ of ${example.formula}`, example.mr.toFixed(1)]],
        working: `mass burned = ${initial.toFixed(2)} − ${final.toFixed(2)} = ${actualBurned.toFixed(2)} g; n(${example.formula}) = ${actualBurned.toFixed(2)} ÷ ${example.mr.toFixed(1)} = ${display(n)} mol`,
        workingRows: [
          [`Moles of ${example.name}`, { fraction: [`mass of ${example.name} burned`, `Mᵣ of ${example.formula}`] }],
          ["Mass burned", "initial burner mass − final burner mass"],
          ["", `${initial.toFixed(2)} − ${final.toFixed(2)}`],
          ["", `${actualBurned.toFixed(2)} g`],
          [`Moles of ${example.name}`, { fraction: [`${actualBurned.toFixed(2)} g`, example.mr.toFixed(1)] }],
          ["", `${display(n)} mol`]
        ]
      };
    }

    function amountFromFuelVolume(rng, example) {
      const volume = pick(rng, [0.40, 0.50, 0.60, 0.75, 0.80, 1.00, 1.20]);
      const mass = volume * example.density;
      const n = mass / example.mr;
      return {
        n,
        rows: [[`Volume of ${example.name} burned`, `${volume.toFixed(2)} cm³`], [`Density of ${example.name}`, `${example.density.toFixed(3)} g/cm³`], [`Mᵣ of ${example.formula}`, example.mr.toFixed(1)]],
        working: `mass burned = ${volume.toFixed(2)} × ${example.density.toFixed(3)} = ${display(mass)} g; n(${example.formula}) = ${display(mass)} ÷ ${example.mr.toFixed(1)} = ${display(n)} mol`,
        workingRows: [
          [`Moles of ${example.name}`, { fraction: [`mass of ${example.name} burned`, `Mᵣ of ${example.formula}`] }],
          [`Mass of ${example.name}`, `volume of ${example.name} × density of ${example.name}`],
          ["", `${volume.toFixed(2)} × ${example.density.toFixed(3)}`],
          ["", `${display(mass)} g`],
          [`Moles of ${example.name}`, { fraction: [`${display(mass)} g`, example.mr.toFixed(1)] }],
          ["", `${display(n)} mol`]
        ]
      };
    }

    function buildAmount(rng, example, route, massInfo) {
      if (route === "given") return amountFromGiven(rng, example);
      if (route === "mass") return amountFromMass(rng, example);
      if (route === "concentration") return amountFromConcentration(rng, example, massInfo);
      if (route === "limiting") return amountFromLimiting(rng, example, massInfo);
      if (route === "burner-loss") return amountFromBurnerLoss(rng, example);
      if (route === "fuel-volume") return amountFromFuelVolume(rng, example);
      throw new Error(`Unknown amount route: ${route}`);
    }

    function finishMass(rng, example, massInfo, amountInfo) {
      if (massInfo.route !== "water-solid") return massInfo;
      const solidMass = amountInfo?.solidMass || round(between(rng, 2.0, 8.0), 2);
      const mass = massInfo.waterMass + solidMass;
      return { ...massInfo, mass, solidMass, rows: [...massInfo.rows, [`Mass of ${example.solid}`, `${solidMass.toFixed(2)} g`]], working: `m = ${massInfo.waterMass.toFixed(1)} + ${solidMass.toFixed(2)} = ${mass.toFixed(2)} g` };
    }

    function dedupeRows(rows) {
      const seen = new Set();
      return rows.filter(([label, value]) => {
        const key = `${label}|${value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function thermometerSvg(initial, final) {
      const top = 54;
      const bottom = 294;

      function panel(offset, value, label) {
        const lower = Math.floor((value - 4) / 5) * 5;
        const upper = lower + 10;
        const thermometerX = offset + 92;
        const scaleX = offset + 112;
        const y = (temperature) => bottom - (temperature - lower) / (upper - lower) * (bottom - top);
        const ticks = [];
        for (let temperature = lower; temperature <= upper; temperature += 1) {
          const tickY = y(temperature);
          const labelled = temperature % 5 === 0;
          ticks.push(`<line x1="${scaleX}" y1="${tickY}" x2="${scaleX + (labelled ? 25 : 14)}" y2="${tickY}" stroke="#17212b" stroke-width="${labelled ? 2 : 1.4}"/>`);
          if (labelled) ticks.push(`<text x="${scaleX + 34}" y="${tickY + 6}" font-size="17" font-weight="700" fill="#17212b">${temperature}</text>`);
        }
        const mercuryY = y(value);
        return `<g>
          <rect x="${offset + 14}" y="34" width="272" height="302" rx="10" fill="#fff" stroke="#d7e0e7" stroke-width="2"/>
          <text x="${offset + 150}" y="27" text-anchor="middle" font-size="19" font-weight="700" fill="#17212b">${label}</text>
          <rect x="${thermometerX - 8}" y="${top}" width="16" height="${bottom - top}" rx="8" fill="#fff" stroke="#17212b" stroke-width="2.5"/>
          <circle cx="${thermometerX}" cy="${bottom + 14}" r="21" fill="#fff" stroke="#17212b" stroke-width="2.5"/>
          <rect x="${thermometerX - 5}" y="${mercuryY}" width="10" height="${bottom + 14 - mercuryY}" fill="#c5322f"/>
          <circle cx="${thermometerX}" cy="${bottom + 14}" r="15" fill="#c5322f"/>
          ${ticks.join("")}
        </g>`;
      }

      return `<div class="thermometer-wrap"><svg viewBox="0 0 640 365" role="img" aria-label="Initial and final thermometer readings"><title>Initial and final thermometer readings</title><text x="320" y="358" text-anchor="middle" font-size="16" fill="#53606c">Each small division represents 1 °C</text>${panel(10, initial, "Initial temperature")}${panel(330, final, "Final temperature")}</svg></div>`;
    }

    function generate(config, seed) {
      const rng = mulberry32(seed);
      const difficulty = normaliseDifficulty(config.difficulty);
      if (config.target === "dh" && config.amountRoute === "limiting" && difficulty < 3) {
        throw new Error("Limiting-reactant calculations are restricted to Levels 3 and 4");
      }
      const possible = candidates(config.example, config.setup).filter((example) => example.massRoutes.includes(config.massRoute) && (config.target === "q" || example.amountRoutes.includes(config.amountRoute)));
      if (!possible.length) throw new Error("No example supports this combination");
      const example = pick(rng, possible);
      let massInfo = preliminaryMass(rng, example, config.massRoute);
      const amountInfo = config.target === "dh" ? buildAmount(rng, example, config.amountRoute, massInfo) : null;
      massInfo = finishMass(rng, example, massInfo, amountInfo);

      let deltaMagnitude;
      if (amountInfo) {
        const targetDh = Math.abs(example.nominalDh) * between(rng, 0.94, 1.04);
        deltaMagnitude = targetDh * 1000 * amountInfo.n / (massInfo.mass * C);
        deltaMagnitude = clamp(deltaMagnitude, example.setup === "combustion" ? 8 : 1.5, example.setup === "combustion" ? 55 : 24);
      } else {
        deltaMagnitude = example.setup === "combustion" ? between(rng, 12, 38) : (example.sign > 0 ? between(rng, 4, 16) : between(rng, 2, 8));
      }
      deltaMagnitude = config.temperatureRoute === "thermometers" ? Math.max(1, Math.round(deltaMagnitude)) : round(deltaMagnitude, 1);
      const deltaT = example.sign * deltaMagnitude;
      let initial = config.temperatureRoute === "thermometers" ? Math.round(between(rng, 18, 23)) : round(between(rng, 18, 22.5), 1);
      if (deltaT < 0 && initial + deltaT < 8) initial = config.temperatureRoute === "thermometers" ? 22 : 22.0;
      const final = round(initial + deltaT, config.temperatureRoute === "thermometers" ? 0 : 1);
      const q = massInfo.mass * C * deltaT;
      const qReported = sf(q, 3);
      const qInKj = q / 1000;
      const dh = amountInfo ? -qInKj / amountInfo.n : null;
      const nReported = amountInfo ? sf(amountInfo.n, 3) : null;
      const dhReported = amountInfo ? sf(dh, 3) : null;

      const temperatureRows = config.temperatureRoute === "delta"
        ? [["Temperature change, ΔT", `${signed(deltaT)} °C`]]
        : config.temperatureRoute === "initial-final"
          ? [["Initial temperature", `${initial.toFixed(1)} °C`], ["Final temperature", `${final.toFixed(1)} °C`]]
          : [];
      const rows = dedupeRows([...massInfo.rows, ...(amountInfo?.rows || []), ...temperatureRows, ["Specific heat capacity of water/solution", `${C.toFixed(2)} J/g/°C`]]);
      const diagram = config.temperatureRoute === "thermometers" ? thermometerSvg(initial, final) : "";
      const intro = example.setup === "combustion"
        ? `${example.name[0].toUpperCase() + example.name.slice(1)} is burned in a spirit burner to heat water.`
        : example.group === "dissolving"
          ? `${example.solid[0].toUpperCase() + example.solid.slice(1)} is dissolved in water in an insulated cup.`
          : `${example.name[0].toUpperCase() + example.name.slice(1)} react in an insulated cup.`;
      const tempWorking = config.temperatureRoute === "delta"
        ? `ΔT = ${signed(deltaT)} °C (given)`
        : `ΔT = ${final.toFixed(config.temperatureRoute === "thermometers" ? 0 : 1)} − ${initial.toFixed(config.temperatureRoute === "thermometers" ? 0 : 1)} = ${signed(deltaT)} °C`;
      const qWorking = `Q = m × c × ΔT; = ${display(massInfo.mass)} × ${C.toFixed(2)} × (${signed(deltaT)}); = ${q >= 0 ? "+" : "−"}${display(Math.abs(q))} J`;
      const conversionWorking = amountInfo ? `Q in kJ = Q in J ÷ 1000; = ${q >= 0 ? "+" : "−"}${display(Math.abs(q), 8)} ÷ 1000 (using unrounded Q); = ${qInKj >= 0 ? "+" : "−"}${display(Math.abs(qInKj), 8)} kJ` : null;
      const dhWorking = amountInfo ? `ΔH = −Q ÷ n; = −(${qInKj >= 0 ? "+" : "−"}${display(Math.abs(qInKj), 8)}) ÷ ${display(amountInfo.n, 8)} (using unrounded values); = ${dh >= 0 ? "+" : "−"}${display(Math.abs(dh))} kJ/mol` : null;

      const resolvedStructure = resolveStructure(rng, config.target, config.amountRoute, difficulty, config.structure || "auto");
      const deltaPrompt = "Calculate the temperature change, ΔT, in °C. Include a sign in your answer.";
      const qPrompt = example.setup === "combustion"
        ? "Calculate the heat energy change of the water, in J. Include a sign in your answer."
        : "Calculate the heat energy change of the solution, in J. Include a sign in your answer.";
      const calculationBasis = amountInfo?.basis || example.basis;
      const molePrompt = `Calculate the amount, in moles, of ${calculationBasis}.`;
      const dhPrompt = `Calculate the molar enthalpy change for the ${calculationBasis}, in kJ/mol. Include a sign and give your answer to 3 significant figures.`;
      const responseDefinitions = {
        deltaT: { key: "deltaT", symbol: "ΔT =", unit: "°C", expected: deltaT, accessibleLabel: "Temperature change in degrees Celsius" },
        q: { key: "q", symbol: "Q =", unit: "J", expected: qReported, accessibleLabel: "Heat energy change in joules" },
        n: { key: "n", symbol: "n =", unit: "mol", expected: nReported, accessibleLabel: `Amount in moles of ${calculationBasis}` },
        dh: { key: "dh", symbol: "ΔH =", unit: "kJ/mol", expected: dhReported, accessibleLabel: "Molar enthalpy change in kilojoules per mole" }
      };
      const temperatureBlock = config.temperatureRoute === "delta"
        ? { type: "math", rows: [["ΔT", `${signed(deltaT)} °C (given)`]] }
        : { type: "math", rows: [["ΔT", "T(final) − T(initial)"], ["", `${final.toFixed(config.temperatureRoute === "thermometers" ? 0 : 1)} − ${initial.toFixed(config.temperatureRoute === "thermometers" ? 0 : 1)}`], ["", `${signed(deltaT)} °C`]] };
      const massBlock = { type: "text", text: massInfo.working };
      const qBlock = { type: "math", rows: [["Q", "m × c × ΔT"], ["", `${display(massInfo.mass)} × ${C.toFixed(2)} × (${signed(deltaT)})`], ["", `${q >= 0 ? "+" : "−"}${display(Math.abs(q))} J`]] };
      const moleBlock = amountInfo ? { type: "math", role: "moles", rows: amountInfo.workingRows } : null;
      const conversionBlock = amountInfo ? { type: "math", role: "unit-conversion", rows: [["Q in kJ", "Q in J ÷ 1000"], ["", `${q >= 0 ? "+" : "−"}${display(Math.abs(q), 8)} ÷ 1000 (using unrounded Q)`], ["", `${qInKj >= 0 ? "+" : "−"}${display(Math.abs(qInKj), 8)} kJ`]] } : null;
      const dhBlock = amountInfo ? { type: "math", rows: [["ΔH", { fraction: ["−Q", "n"] }], ["", { fraction: [`−(${qInKj >= 0 ? "+" : "−"}${display(Math.abs(qInKj), 8)} kJ)`, `${display(amountInfo.n, 8)} mol`] }], ["", `${dh >= 0 ? "+" : "−"}${display(Math.abs(dh))} kJ/mol`]] } : null;

      let parts;
      let answerParts;
      let responseKeys;
      if (resolvedStructure === "staged-q") {
        parts = [deltaPrompt, qPrompt];
        answerParts = [[temperatureBlock], [massBlock, qBlock]];
        responseKeys = ["deltaT", "q"];
      } else if (resolvedStructure === "single-q") {
        parts = [qPrompt];
        answerParts = [[temperatureBlock, massBlock, qBlock]];
        responseKeys = ["q"];
      } else if (resolvedStructure === "full-staged") {
        if (config.amountRoute === "given") {
          parts = [deltaPrompt, qPrompt, dhPrompt];
          answerParts = [[temperatureBlock], [massBlock, qBlock], [moleBlock, conversionBlock, dhBlock]];
          responseKeys = ["deltaT", "q", "dh"];
        } else {
          parts = [deltaPrompt, qPrompt, molePrompt, dhPrompt];
          answerParts = [[temperatureBlock], [massBlock, qBlock], [moleBlock], [conversionBlock, dhBlock]];
          responseKeys = ["deltaT", "q", "n", "dh"];
        }
      } else if (resolvedStructure === "q-n-dh") {
        parts = [qPrompt, molePrompt, dhPrompt];
        answerParts = [[temperatureBlock, massBlock, qBlock], [moleBlock], [conversionBlock, dhBlock]];
        responseKeys = ["q", "n", "dh"];
      } else if (resolvedStructure === "q-dh") {
        parts = [qPrompt, dhPrompt];
        answerParts = [[temperatureBlock, massBlock, qBlock], [moleBlock, conversionBlock, dhBlock]];
        responseKeys = ["q", "dh"];
      } else {
        parts = [dhPrompt];
        answerParts = [[temperatureBlock, massBlock, qBlock, moleBlock, conversionBlock, dhBlock]];
        responseKeys = ["dh"];
      }
      answerParts = answerParts.map((part) => part.filter(Boolean));
      const responses = responseKeys.map((key) => responseDefinitions[key]);
      const prompt = parts.join(" ");
      const answerLines = [tempWorking, massInfo.working, qWorking, ...(amountInfo ? [amountInfo.working, conversionWorking, dhWorking] : [])];

      return {
        seed,
        difficulty,
        example,
        config,
        rows,
        diagram,
        intro,
        prompt,
        parts,
        responses,
        answerParts,
        structure: resolvedStructure,
        answerLines,
        values: { mass: massInfo.mass, initial, final, deltaT, q, qReported, qInKj, n: amountInfo?.n ?? null, nReported, dh, dhReported },
        labels: {
          setup: example.setup === "combustion" ? "Combustion" : "Solution phase",
          group: example.setup === "combustion" ? example.name : labels.groups[example.group],
          target: labels.targets[config.target],
          temperature: labels.temperatureRoutes[config.temperatureRoute],
          mass: labels.massRoutes[config.massRoute],
          amount: config.target === "dh" ? labels.amountRoutes[config.amountRoute] : null,
          difficulty: `${({1:"Grade 5–6",2:"Grade 7–8",3:"Grade 9"})[difficulty] || "Extension"}`,
          structure: labels.structures[resolvedStructure]
        }
      };
    }

    root.CalorimetryReviewCore = { examples, labels, exampleOptions, routeIntersection, structureOptions, resolveStructure, candidates, generate, display, escapeHtml, numberTolerance, enteredNumber, markNumber, normaliseDifficulty, allowsScaffold };
  })(typeof globalThis !== "undefined" ? globalThis : window);
