window.Game = window.Game || {};

Game.Data = {
    factionColors: {
        player: "#38bdf8",  // Cyan
        ai: "#f43f5e",      // Crimson
        neutral: "#64748b"  // Slate
    },

    starNames: [
        "Alpha Prime", "Vega", "Kessel", "Sirius", "Nexus", "Zeta Reticuli",
        "Procyon", "Altair", "Deneb", "Rigel", "Betelgeuse", "Antares",
        "Aldebaran", "Spica", "Pollux", "Castor", "Capella", "Arcturus",
        "Fomalhaut", "Regulus", "Canopus", "Achernar", "Bellatrix", "Mira"
    ],

    biomes: [
        {
            name: "Terran World",
            color: "#4ade80",
            specialty: "🌱 Agri-Hub: +50% Food from Agri-Districts, balanced base yields.",
            bonus: { energy: 3, minerals: 3, food: 5, research: 2 },
            mult: { gen: 1.0, mine: 1.0, farm: 1.5, foundry: 1.0, lab: 1.0 }
        },
        {
            name: "Volcanic World",
            color: "#fb923c",
            specialty: "🌋 Forge World: +50% Mining & +25% Foundry Alloys, -50% Farming.",
            bonus: { energy: 2, minerals: 6, food: 0, research: 1 },
            mult: { gen: 1.0, mine: 1.5, farm: 0.5, foundry: 1.25, lab: 1.0 }
        },
        {
            name: "Arid World",
            color: "#facc15",
            specialty: "☀️ Solar Dynamo: +50% Energy from Generators, -25% Farming.",
            bonus: { energy: 6, minerals: 3, food: 1, research: 1 },
            mult: { gen: 1.5, mine: 1.0, farm: 0.75, foundry: 1.0, lab: 1.0 }
        },
        {
            name: "Relic World",
            color: "#c084fc",
            specialty: "🏛️ Precursor Ruins: +50% Research from Labs & +25% Foundry Alloys.",
            bonus: { energy: 2, minerals: 2, food: 1, research: 6 },
            mult: { gen: 1.0, mine: 1.0, farm: 1.0, foundry: 1.25, lab: 1.5 }
        },
        {
            name: "Ice World",
            color: "#67e8f9",
            specialty: "❄️ Cryo-Research: +25% Research & +25% Mining, -25% Generator Energy.",
            bonus: { energy: 1, minerals: 4, food: 1, research: 4 },
            mult: { gen: 0.75, mine: 1.25, farm: 0.75, foundry: 1.0, lab: 1.25 }
        }
    ],

    anomalies: [
        { title: "Precursor Shipyard", desc: "Reactivated an automated orbital dock! (+1 Cruiser joins fleet)", effect: (S, sys) => { sys.cruisers += 1; } },
        { title: "Ancient Data Vault", desc: "Decrypted precursor science logs! (+45 🔬 Research)", effect: (S) => { S.res.research += 45; } },
        { title: "Orbital Alloy Cache", desc: "Salvaged a derelict dreadnought hull! (+55 🔩 Alloys)", effect: (S) => { S.res.alloys += 55; } },
        { title: "Rich Asteroid Vein", desc: "Harvested high-purity core minerals! (+80 ⛏️ Minerals)", effect: (S) => { S.res.minerals += 80; } },
        { title: "Subspace Capacitor", desc: "Siphoned zero-point energy cells! (+90 ⚡ Energy)", effect: (S) => { S.res.energy += 90; } }
    ],

    techTree: [
        // Military Branch
        { id: "destroyers", category: "⚔️ Military", name: "Destroyer Hulls", cost: 30, researched: false, desc: "Unlocks Destroyers (3⚔️ Combat Power)." },
        { id: "plasma", category: "⚔️ Military", name: "Plasma Cannons", cost: 50, researched: false, req: "destroyers", desc: "+25% Fleet Combat Power in all battles." },
        { id: "cruisers", category: "⚔️ Military", name: "Cruiser Hulls", cost: 90, researched: false, req: "plasma", desc: "Unlocks heavy Cruisers (8⚔️ Combat Power)." },
        { id: "citadels", category: "⚔️ Military", name: "Citadel Bastions", cost: 45, researched: false, desc: "Starbases grant +9🛡️ Defense per level instead of +6🛡️." },

        // Economy Branch
        { id: "quantum_grid", category: "🏭 Economy", name: "Quantum Energy Grid", cost: 25, researched: false, desc: "+25% Energy output from Generator Districts." },
        { id: "deep_mining", category: "🏭 Economy", name: "Deep Core Mining", cost: 25, researched: false, desc: "+25% Mineral output from Mining Districts." },
        { id: "nano_forges", category: "🏭 Economy", name: "Nano-Alloy Forges", cost: 60, researched: false, req: "deep_mining", desc: "+2 base Alloys per Foundry District." },

        // Logistics & Exploration Branch
        { id: "tachyon_sensors", category: "🛸 Logistics", name: "Tachyon Sensors", cost: 25, researched: false, desc: "Doubles Sensor Range (reveals stars 2 jumps away)." },
        { id: "orbital_hab", category: "🛸 Logistics", name: "Orbital Habitation", cost: 40, researched: false, desc: "+2 Max District slots on every planet." },
        { id: "auto_yards", category: "🛸 Logistics", name: "Automated Shipyards", cost: 45, researched: false, desc: "-20% Alloy cost for building all warships." }
    ]
};