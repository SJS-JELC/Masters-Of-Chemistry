(function (root) {
    "use strict";

    const { questions, levelOneTables } = root.StructureBondingComparisonData;    function levelTwoSections(question) {
      const propertyLabel = question.focus === "melting-boiling"
        ? "melting or boiling point"
        : question.focus === "conductivity"
          ? "electrical conductivity"
          : "hardness or softness";
      const propertyHelp = question.focus === "melting-boiling"
        ? `Describe the forces or bonds that must be overcome, then link the energy needed to the ${propertyLabel}.`
        : question.focus === "conductivity"
          ? `State which charged particles can or cannot move, then link this to the ${propertyLabel}.`
          : `Describe the relevant forces, bonds or movement in the structure, then link this to the ${propertyLabel}.`;
      return [
        ...["left", "right"].flatMap((side) => [
          { side, kind: "short", title: "Type of bonding" },
          { side, kind: "short", title: "Type of structure" },
          { side, kind: "long", title: `Link to property: ${question[side].property}`, help: propertyHelp }
        ]),
        {
          side: "comparison",
          kind: "long",
          title: "Comparison",
          help: `Bring both sides together. Explain how the difference or similarity in structure and bonding produces the properties stated in the question.`
        }
      ];
    }

    function getLevelOneTable(question) {
      return levelOneTables[question.id] || [];
    }

    function eligible(focus) {
      return focus === "any" ? [...questions] : questions.filter((question) => question.focus === focus);
    }

    function choose(focus, randomValue, previousId) {
      const candidates = eligible(focus);
      const alternatives = candidates.length > 1 ? candidates.filter((question) => question.id !== previousId) : candidates;
      const source = alternatives.length ? alternatives : candidates;
      return source[Math.floor(randomValue * source.length)] || source[0];
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    }

    root.StructureBondingComparisonCore = { questions, eligible, choose, escapeHtml, getLevelOneTable, levelTwoSections };
  }(globalThis));
