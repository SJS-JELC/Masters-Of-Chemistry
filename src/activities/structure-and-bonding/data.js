(function (root) {
  "use strict";

    const questions = [
      {
        id: "water-sodium-chloride-melting",
        focus: "melting-boiling",
        left: { name: "Water", property: "low melting point" },
        right: { name: "Sodium chloride", property: "high melting point" },
        prompt: "Explain, in terms of their structure and bonding, why water has a low melting point but sodium chloride has a high melting point.",
        points: [
          { text: "Water has covalent bonding and a simple molecular structure." },
          { text: "Sodium chloride has ionic bonding and a giant lattice structure." },
          { text: "The intermolecular forces between water molecules are weak.", reject: "Do not award if the response says the covalent bonds are weak or that covalent bonds break when water melts." },
          { text: "Strong electrostatic attractions act between oppositely charged ions; accept between sodium ions, Na⁺, and chloride ions, Cl⁻.", reject: "Do not award if sodium chloride is described using intermolecular forces, covalent bonds or molecules." },
          { text: "Less energy is needed to overcome the intermolecular forces in water, so water has the lower melting point." }
        ]
      },
      {
        id: "methane-magnesium-oxide-boiling",
        focus: "melting-boiling",
        left: { name: "Methane", property: "low boiling point" },
        right: { name: "Magnesium oxide", property: "high boiling point" },
        prompt: "Explain, in terms of their structure and bonding, why methane has a low boiling point but magnesium oxide has a high boiling point.",
        points: [
          { text: "Methane has covalent bonding and a simple molecular structure." },
          { text: "Magnesium oxide has ionic bonding and a giant lattice structure." },
          { text: "The intermolecular forces between methane molecules are weak.", reject: "Do not award if the response says the covalent bonds are weak or are broken during boiling." },
          { text: "Strong electrostatic attractions act between oppositely charged ions; accept between magnesium ions, Mg²⁺, and oxide ions, O²⁻.", reject: "Do not award if magnesium oxide is described as molecules or using intermolecular forces." },
          { text: "Much more energy is needed to overcome the ionic attractions, so magnesium oxide has the higher boiling point." }
        ]
      },
      {
        id: "hexane-methane-boiling",
        focus: "melting-boiling",
        left: { name: "Hexane", property: "higher boiling point" },
        right: { name: "Methane", property: "lower boiling point" },
        prompt: "Explain, in terms of their structure and bonding, why hexane has a higher boiling point than methane.",
        points: [
          { text: "Both substances have covalent bonding and simple molecular structures." },
          { text: "Hexane molecules are larger than methane molecules, with a greater relative molecular mass or more electrons." },
          { text: "The intermolecular forces between hexane molecules are stronger than those between methane molecules.", reject: "Do not award if the response compares the strength of the covalent bonds." },
          { text: "More energy is needed to overcome the intermolecular forces in hexane, giving it the higher boiling point.", reject: "Do not award if the response says covalent bonds are broken during boiling." }
        ]
      },
      {
        id: "diamond-sodium-chloride-melting",
        focus: "melting-boiling",
        left: { name: "Diamond", property: "high melting point" },
        right: { name: "Sodium chloride", property: "high melting point" },
        prompt: "Explain, in terms of their structure and bonding, why diamond and sodium chloride both have high melting points even though their bonding is different.",
        points: [
          { text: "Diamond has covalent bonding and a giant lattice structure." },
          { text: "Many strong covalent bonds between carbon atoms must be broken to melt diamond.", reject: "Do not award references to intermolecular forces or molecules in diamond." },
          { text: "Sodium chloride has ionic bonding and a giant lattice structure." },
          { text: "Strong electrostatic attractions act between oppositely charged ions; accept between sodium ions, Na⁺, and chloride ions, Cl⁻.", reject: "Do not award references to covalent bonds, intermolecular forces or sodium chloride molecules." },
          { text: "Large amounts of energy are required to overcome the strong bonding or attractions in both structures." }
        ]
      },
      {
        id: "c60-diamond-melting",
        focus: "melting-boiling",
        left: { name: "C₆₀ fullerene", property: "lower melting point" },
        right: { name: "Diamond", property: "much higher melting point" },
        prompt: "Explain, in terms of their structure and bonding, why C₆₀ fullerene has a much lower melting point than diamond even though both are forms of carbon.",
        points: [
          { text: "C₆₀ has a simple molecular structure." },
          { text: "There are weak intermolecular forces between C₆₀ molecules.", reject: "Do not award if the covalent bonds within each C₆₀ molecule are described as weak." },
          { text: "Diamond has covalent bonding and a giant lattice structure." },
          { text: "Diamond contains many strong covalent bonds extending throughout the structure.", reject: "Do not award references to diamond molecules or intermolecular forces in diamond." },
          { text: "Less energy is needed to overcome the intermolecular forces in C₆₀ than to break the covalent bonds in diamond." }
        ]
      },
      {
        id: "graphite-diamond-conductivity",
        focus: "conductivity",
        left: { name: "Graphite", property: "conducts electricity" },
        right: { name: "Diamond", property: "does not conduct" },
        prompt: "Explain, in terms of their structure and bonding, why graphite conducts electricity but diamond does not.",
        points: [
          { text: "Both graphite and diamond have covalent bonding and giant lattice structures made from carbon atoms." },
          { text: "Each carbon atom in graphite forms three covalent bonds, leaving one electron per carbon atom delocalised." },
          { text: "The delocalised electrons in graphite are free to move, so graphite conducts electricity.", reject: "Do not award if graphite is said to conduct because its layers slide or because it contains ions." },
          { text: "Each carbon atom in diamond forms four covalent bonds, so all four outer electrons are used in bonding." },
          { text: "Diamond has no charged particles free to move, so diamond does not conduct electricity.", reject: "Do not award the incorrect claim that diamond contains no electrons." }
        ]
      },
      {
        id: "solid-molten-sodium-chloride-conductivity",
        focus: "conductivity",
        left: { name: "Solid sodium chloride", property: "does not conduct" },
        right: { name: "Molten sodium chloride", property: "conducts" },
        prompt: "Explain, in terms of their structure and bonding, why solid sodium chloride does not conduct electricity but molten sodium chloride does.",
        points: [
          { text: "Sodium chloride is ionic and contains charged ions." },
          { text: "In solid sodium chloride, the ions are held in fixed positions in a giant lattice." },
          { text: "The charged ions are fixed and cannot move, so solid sodium chloride does not conduct electricity.", reject: "Do not award explanations based on electrons moving through sodium chloride." },
          { text: "When sodium chloride melts, the ions become free to move." },
          { text: "The charged ions are free to move, so molten sodium chloride conducts electricity.", reject: "Do not award if molecules or delocalised electrons are identified as the moving charged particles." }
        ]
      },
      {
        id: "copper-sodium-chloride-conductivity",
        focus: "conductivity",
        left: { name: "Solid copper", property: "conducts electricity" },
        right: { name: "Solid sodium chloride", property: "does not conduct" },
        prompt: "Explain, in terms of their structure and bonding, why solid copper conducts electricity but solid sodium chloride does not.",
        points: [
          { text: "Copper has metallic bonding in a giant lattice structure." },
          { text: "Copper contains delocalised electrons that are free to move." },
          { text: "Sodium chloride has ionic bonding in a giant lattice structure." },
          { text: "The ions in solid sodium chloride are in fixed positions and cannot move, so solid sodium chloride does not conduct electricity.", reject: "Do not award if electrons or molecules are described as the particles that move in sodium chloride." }
        ]
      },
      {
        id: "graphite-diamond-hardness",
        focus: "hardness",
        left: { name: "Graphite", property: "soft" },
        right: { name: "Diamond", property: "hard" },
        prompt: "Explain, in terms of their structure and bonding, why graphite is soft but diamond is hard.",
        points: [
          { text: "Both graphite and diamond have covalent bonding and giant lattice structures made from carbon atoms." },
          { text: "In graphite, each carbon atom forms three covalent bonds in layers." },
          { text: "Only weak attractions act between the graphite layers.", reject: "Do not award if the covalent bonds within a graphite layer are described as weak." },
          { text: "The layers can slide over one another, making graphite soft." },
          { text: "In diamond, each carbon atom forms four strong covalent bonds in a rigid three-dimensional lattice." },
          { text: "The many strong covalent bonds make diamond hard." }
        ]
      }
    ];

    const levelOneTables = {
      "water-sodium-chloride-melting": [
        { label: "Bonding type", left: "Covalent", right: "Ionic", options: ["Covalent", "Ionic", "Metallic"] },
        { label: "Structure", left: "Simple molecular", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Attractions overcome on melting", left: "Weak intermolecular forces", right: "Strong electrostatic attractions between oppositely charged ions", options: ["Weak intermolecular forces", "Strong electrostatic attractions between oppositely charged ions", "Strong covalent bonds"] },
        { label: "Energy needed to melt", left: "Less energy", right: "More energy", options: ["Less energy", "More energy", "The same energy"] },
        { label: "Melting point", left: "Low", right: "High", options: ["Low", "High"] }
      ],
      "methane-magnesium-oxide-boiling": [
        { label: "Bonding type", left: "Covalent", right: "Ionic", options: ["Covalent", "Ionic", "Metallic"] },
        { label: "Structure", left: "Simple molecular", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Attractions overcome on boiling", left: "Weak intermolecular forces", right: "Strong electrostatic attractions between oppositely charged ions", options: ["Weak intermolecular forces", "Strong electrostatic attractions between oppositely charged ions", "Strong covalent bonds"] },
        { label: "Energy needed to boil", left: "Less energy", right: "More energy", options: ["Less energy", "More energy", "The same energy"] },
        { label: "Boiling point", left: "Low", right: "High", options: ["Low", "High"] }
      ],
      "hexane-methane-boiling": [
        { label: "Bonding type", left: "Covalent", right: "Covalent", options: ["Covalent", "Ionic", "Metallic"] },
        { label: "Structure", left: "Simple molecular", right: "Simple molecular", options: ["Simple molecular", "Giant lattice"] },
        { label: "Relative molecule size", left: "Larger; greater Mᵣ and more electrons", right: "Smaller; lower Mᵣ and fewer electrons", options: ["Larger; greater Mᵣ and more electrons", "Smaller; lower Mᵣ and fewer electrons", "The same size and number of electrons"] },
        { label: "Intermolecular forces", left: "Stronger", right: "Weaker", options: ["Stronger", "Weaker", "The same strength"] },
        { label: "Energy needed to boil", left: "More energy", right: "Less energy", options: ["Less energy", "More energy", "The same energy"] },
        { label: "Boiling point", left: "Higher", right: "Lower", options: ["Higher", "Lower"] }
      ],
      "diamond-sodium-chloride-melting": [
        { label: "Bonding type", left: "Covalent", right: "Ionic", options: ["Covalent", "Ionic", "Metallic"] },
        { label: "Structure", left: "Giant lattice", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Attractions overcome on melting", left: "Many strong covalent bonds", right: "Strong electrostatic attractions between oppositely charged ions", options: ["Weak intermolecular forces", "Many strong covalent bonds", "Strong electrostatic attractions between oppositely charged ions"] },
        { label: "Energy needed to melt", left: "Large amount", right: "Large amount", options: ["Small amount", "Large amount"] },
        { label: "Melting point", left: "High", right: "High", options: ["Low", "High"] }
      ],
      "c60-diamond-melting": [
        { label: "Bonding type", left: "Covalent within each molecule", right: "Covalent throughout the lattice", options: ["Covalent within each molecule", "Covalent throughout the lattice", "Ionic", "Metallic"] },
        { label: "Structure", left: "Simple molecular", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Attractions overcome on melting", left: "Weak intermolecular forces", right: "Many strong covalent bonds", options: ["Weak intermolecular forces", "Many strong covalent bonds", "Strong electrostatic attractions between ions"] },
        { label: "Energy needed to melt", left: "Less energy", right: "More energy", options: ["Less energy", "More energy", "The same energy"] },
        { label: "Melting point", left: "Lower", right: "Higher", options: ["Lower", "Higher"] }
      ],
      "graphite-diamond-conductivity": [
        { label: "Structure", left: "Giant lattice", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Covalent bonds per carbon atom", left: "Three", right: "Four", options: ["Two", "Three", "Four"] },
        { label: "Use of outer electrons", left: "One electron per carbon is delocalised", right: "All four outer electrons are used in bonds", options: ["One electron per carbon is delocalised", "All four outer electrons are used in bonds", "Electrons have transferred to form ions"] },
        { label: "Mobile charged particles", left: "Delocalised electrons are free to move", right: "No charged particles are free to move", options: ["Delocalised electrons are free to move", "Ions are free to move", "No charged particles are free to move"] },
        { label: "Electrical conductivity", left: "Conducts", right: "Does not conduct", options: ["Conducts", "Does not conduct"] }
      ],
      "solid-molten-sodium-chloride-conductivity": [
        { label: "Bonding type", left: "Ionic", right: "Ionic", options: ["Covalent", "Ionic", "Metallic"] },
        { label: "Charged particles present", left: "Ions", right: "Ions", options: ["Ions", "Delocalised electrons", "Molecules"] },
        { label: "Arrangement", left: "Regular giant lattice", right: "Disordered liquid ions; lattice broken down", options: ["Regular giant lattice", "Disordered liquid ions; lattice broken down", "Simple molecules"] },
        { label: "Movement of charged particles", left: "Ions fixed in position", right: "Ions free to move", options: ["Ions fixed in position", "Ions free to move", "Electrons free to move"] },
        { label: "Electrical conductivity", left: "Does not conduct", right: "Conducts", options: ["Conducts", "Does not conduct"] }
      ],
      "copper-sodium-chloride-conductivity": [
        { label: "Bonding type", left: "Metallic", right: "Ionic", options: ["Covalent", "Ionic", "Metallic"] },
        { label: "Structure", left: "Giant lattice", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Charged particles", left: "Delocalised electrons", right: "Ions", options: ["Delocalised electrons", "Ions", "Molecules"] },
        { label: "Movement of charged particles", left: "Electrons free to move", right: "Ions fixed in position", options: ["Electrons free to move", "Ions free to move", "Ions fixed in position"] },
        { label: "Electrical conductivity", left: "Conducts", right: "Does not conduct", options: ["Conducts", "Does not conduct"] }
      ],
      "graphite-diamond-hardness": [
        { label: "Structure", left: "Giant lattice", right: "Giant lattice", options: ["Simple molecular", "Giant lattice"] },
        { label: "Arrangement", left: "Layers", right: "Rigid three-dimensional network", options: ["Separate molecules", "Layers", "Rigid three-dimensional network"] },
        { label: "Covalent bonds per carbon atom", left: "Three", right: "Four", options: ["Two", "Three", "Four"] },
        { label: "Forces affecting shape", left: "Weak attractions between layers", right: "Strong covalent bonds throughout", options: ["Weak attractions between layers", "Weak covalent bonds throughout", "Strong covalent bonds throughout"] },
        { label: "Response to a force", left: "Layers can slide", right: "Rigid lattice does not slide", options: ["Layers can slide", "Rigid lattice does not slide", "Molecules move apart"] },
        { label: "Hardness", left: "Soft", right: "Hard", options: ["Soft", "Hard"] }
      ]
    };

  root.StructureBondingComparisonData = { questions, levelOneTables };
})(typeof globalThis !== "undefined" ? globalThis : window);
