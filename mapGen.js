window.Game = window.Game || {};

Game.MapGen = {
    MAP_WIDTH: 1500,
    MAP_HEIGHT: 1000,

    generateGalaxy(numStars = 24) {
        const systems = [];
        const names = [...Game.Data.starNames];

        for (let i = 0; i < numStars; i++) {
            let x, y, valid = false, attempts = 0;
            while (!valid && attempts < 200) {
                x = 120 + Math.random() * (this.MAP_WIDTH - 240);
                y = 120 + Math.random() * (this.MAP_HEIGHT - 240);
                valid = systems.every(s => Math.hypot(s.x - x, s.y - y) > 155);
                attempts++;
            }
            systems.push({ x, y });
        }

        systems.sort((a, b) => a.x - b.x);

        systems.forEach((sys, idx) => {
            sys.id = idx;
            sys.name = names[idx] || `Sector-${idx}`;
            sys.biome = Game.Data.biomes[idx % Game.Data.biomes.length];
            sys.owner = "neutral";
            sys.corvettes = 1 + (idx % 2);
            sys.destroyers = 0;
            sys.cruisers = 0;
            sys.starbase = 0; // Lvl 0-3 Orbital Bastion
            sys.anomaly = (idx > 0 && idx < numStars - 2 && idx % 2 === 1); // 50% of neutral stars have Anomalies
            sys.fleetReady = true;
            sys.pop = 2;
            sys.maxDistricts = 5 + (idx % 5);
            sys.districts = { gen: 1, mine: 1, farm: 0, foundry: 0, lab: 0 };
            sys.links = [];
            sys.explored = false;
        });

        // Player Homeworld
        const home = systems[0];
        home.name = "Alpha Prime";
        home.owner = "player";
        home.biome = Game.Data.biomes[0];
        home.corvettes = 4;
        home.starbase = 1; // Starts with Lvl 1 Starbase
        home.anomaly = false;
        home.pop = 5;
        home.maxDistricts = 9;
        home.districts = { gen: 1, mine: 1, farm: 1, foundry: 1, lab: 1 };
        home.explored = true;

        // 2 AI Homeworlds (Reduced starting fleet so AI builds up gradually)
        [systems[numStars - 1], systems[numStars - 2]].forEach((aiHome, i) => {
            aiHome.name = i === 0 ? "Zeta Core" : "Crimson Nexus";
            aiHome.owner = "ai";
            aiHome.biome = Game.Data.biomes[1];
            aiHome.corvettes = 3;
            aiHome.destroyers = 0;
            aiHome.starbase = 1;
            aiHome.anomaly = false;
            aiHome.pop = 4;
            aiHome.maxDistricts = 9;
            aiHome.districts = { gen: 1, mine: 1, farm: 1, foundry: 1, lab: 0 };
        });

        // Connect Hyperlanes
        systems.forEach(sys => {
            const neighbors = systems
                .filter(other => other.id !== sys.id)
                .map(other => ({ id: other.id, dist: Math.hypot(sys.x - other.x, sys.y - other.y) }))
                .sort((a, b) => a.dist - b.dist);

            const count = 2 + (sys.id % 2);
            for (let i = 0; i < count; i++) {
                const targetId = neighbors[i].id;
                if (!sys.links.includes(targetId)) sys.links.push(targetId);
                if (!systems[targetId].links.includes(sys.id)) systems[targetId].links.push(sys.id);
            }
        });

        return systems;
    }
};