window.Game = window.Game || {};

Game.State = {
    turn: 1,
    res: { energy: 120, minerals: 120, alloys: 60, food: 60, research: 25 },
    systems: [],
    selectedSystem: null,
    fleetSplitRatio: 1.0,
    diplo: {
        opinion: 5,        // Starts neutral-cautious
        truceTurns: 0,
        posture: "Expanding Territory"
    },
    gameOver: null,
    logs: ["Welcome, Commander. The Crimson Syndicate is mobilizing its fleets!"],

    init() {
        this.systems = Game.MapGen.generateGalaxy(24);
        this.selectedSystem = this.systems[0];
        this.updateVisibility();
    },

    log(msg) {
        this.logs.unshift(`[T${this.turn}] ${msg}`);
        if (this.logs.length > 35) this.logs.pop();
    },

    hasTech(id) {
        const t = Game.Data.techTree.find(tech => tech.id === id);
        return t ? t.researched : false;
    },

    updateVisibility() {
        const sensorDepth = this.hasTech("tachyon_sensors") ? 2 : 1;
        this.systems.forEach(s => s.inSensorRange = false);

        this.systems.filter(s => s.owner === "player").forEach(pSys => {
            pSys.explored = true;
            pSys.inSensorRange = true;
            pSys.links.forEach(n1Id => {
                const n1 = this.systems[n1Id];
                n1.explored = true;
                n1.inSensorRange = true;
                if (sensorDepth >= 2) {
                    n1.links.forEach(n2Id => {
                        const n2 = this.systems[n2Id];
                        n2.explored = true;
                        n2.inSensorRange = true;
                    });
                }
            });
        });
    },

    getTotalShips(sys) {
        return sys.corvettes + sys.destroyers + sys.cruisers;
    },

    getStarbasePower(sys) {
        if (!sys.starbase) return 0;
        const perLevel = (sys.owner === "player" && this.hasTech("citadels")) ? 9 : 6;
        return sys.starbase * perLevel;
    },

    getFleetPower(sys, corv = sys.corvettes, dest = sys.destroyers, cruis = sys.cruisers) {
        let power = (corv * 1) + (dest * 3) + (cruis * 8);
        if (sys.owner === "player" && this.hasTech("plasma")) {
            power = Math.round(power * 1.25);
        }
        return power;
    },

    getMaxDistricts(sys) {
        return sys.maxDistricts + (sys.owner === "player" && this.hasTech("orbital_hab") ? 2 : 0);
    },

    getTotalDistricts(sys) {
        const d = sys.districts;
        return d.gen + d.mine + d.farm + d.foundry + d.lab;
    },

    getShipCost(type) {
        const costs = { corvette: 30, destroyer: 75, cruiser: 160 };
        return this.hasTech("auto_yards") ? Math.round(costs[type] * 0.8) : costs[type];
    },

    getSingleDistrictYield(sys, type) {
        const m = sys.biome.mult;
        const isPlayer = sys.owner === "player";
        if (type === "gen") return Math.round(8 * m.gen * ((isPlayer && this.hasTech("quantum_grid")) ? 1.25 : 1));
        if (type === "mine") return Math.round(8 * m.mine * ((isPlayer && this.hasTech("deep_mining")) ? 1.25 : 1));
        if (type === "farm") return Math.round(6 * m.farm);
        if (type === "foundry") return Math.round((5 + ((isPlayer && this.hasTech("nano_forges")) ? 2 : 0)) * m.foundry);
        if (type === "lab") return Math.round(6 * m.lab);
        return 0;
    },

    getSystemNetOutput(sys) {
        const d = sys.districts;
        const b = sys.biome.bonus;
        const shipUpkeep = (sys.corvettes * 1) + (sys.destroyers * 2) + (sys.cruisers * 4) + (sys.starbase * 1);

        return {
            energy: b.energy + (d.gen * this.getSingleDistrictYield(sys, "gen")) - (d.lab * 3) - shipUpkeep,
            minerals: b.minerals + (d.mine * this.getSingleDistrictYield(sys, "mine")) - (d.foundry * 6),
            alloys: 2 + (d.foundry * this.getSingleDistrictYield(sys, "foundry")),
            food: b.food + (d.farm * this.getSingleDistrictYield(sys, "farm")) - (sys.pop * 1),
            research: b.research + (d.lab * this.getSingleDistrictYield(sys, "lab"))
        };
    },

    getEmpireNetIncome(faction) {
        let net = { energy: 0, minerals: 0, alloys: 0, food: 0, research: 0 };
        this.systems.filter(s => s.owner === faction).forEach(s => {
            const out = this.getSystemNetOutput(s);
            for (let k in net) net[k] += out[k];
        });
        return net;
    },

    triggerAnomaly(sys, faction) {
        if (!sys.anomaly) return;
        sys.anomaly = false;
        if (faction === "player") {
            const event = Game.Data.anomalies[sys.id % Game.Data.anomalies.length];
            event.effect(this, sys);
            this.log(`✨ ANOMALY [${sys.name}]: ${event.title} — ${event.desc}`);
        }
    },

    moveFleet(origin, target, faction, ratio = 1.0) {
        if (faction === "player" && !origin.fleetReady) {
            this.log(`Fleet at ${origin.name} is recharging its jump drive!`);
            return false;
        }

        if (faction === "player" && target.owner === "ai" && this.diplo.truceTurns > 0) {
            this.log(`🕊️ Cannot attack ${target.name}! Active Non-Aggression Pact (${this.diplo.truceTurns} turns left).`);
            return false;
        }

        let sendCorv = Math.round(origin.corvettes * ratio);
        let sendDest = Math.round(origin.destroyers * ratio);
        let sendCruis = Math.round(origin.cruisers * ratio);

        if (sendCorv + sendDest + sendCruis === 0) {
            if (origin.corvettes > 0) sendCorv = 1;
            else if (origin.destroyers > 0) sendDest = 1;
            else if (origin.cruisers > 0) sendCruis = 1;
        }

        const atkPower = this.getFleetPower(origin, sendCorv, sendDest, sendCruis);
        origin.corvettes -= sendCorv;
        origin.destroyers -= sendDest;
        origin.cruisers -= sendCruis;

        if (target.owner === faction) {
            target.corvettes += sendCorv;
            target.destroyers += sendDest;
            target.cruisers += sendCruis;
            target.fleetReady = false;
            this.log(`Transferred ${sendCorv}C/${sendDest}D/${sendCruis}Cr to ${target.name}.`);
            this.updateVisibility();
            return true;
        }

        const fleetDef = this.getFleetPower(target);
        const starbaseDef = this.getStarbasePower(target);
        const totalDef = fleetDef + starbaseDef;

        if (faction === "player" && target.owner === "ai") {
            this.diplo.opinion -= 20;
        }

        this.log(`${faction.toUpperCase()} (⚔️${atkPower}) attacks ${target.name} (⚔️${fleetDef} + 🛡️${starbaseDef})!`);

        if (atkPower > totalDef) {
            const survRatio = (atkPower - totalDef) / atkPower;
            target.owner = faction;
            target.corvettes = Math.round(sendCorv * survRatio);
            target.destroyers = Math.round(sendDest * survRatio);
            target.cruisers = Math.round(sendCruis * survRatio);
            if (this.getTotalShips(target) === 0) target.corvettes = 1;
            if (target.starbase > 0) target.starbase = Math.max(0, target.starbase - 1);
            target.fleetReady = false;
            this.log(`${target.name} captured by ${faction.toUpperCase()}!`);
            this.triggerAnomaly(target, faction);
        } else if (atkPower < totalDef) {
            const survRatio = (totalDef - atkPower) / Math.max(1, totalDef);
            target.corvettes = Math.round(target.corvettes * survRatio);
            target.destroyers = Math.round(target.destroyers * survRatio);
            target.cruisers = Math.round(target.cruisers * survRatio);
            this.log(`Attack on ${target.name} repelled by defenders!`);
        } else {
            target.corvettes = 0; target.destroyers = 0; target.cruisers = 0;
            this.log(`Mutual fleet destruction at ${target.name}!`);
        }

        this.updateVisibility();
        this.checkVictoryConditions();
        return true;
    },

    checkVictoryConditions() {
        const playerCount = this.systems.filter(s => s.owner === "player").length;
        const aiCount = this.systems.filter(s => s.owner === "ai").length;
        if (aiCount === 0) this.gameOver = "victory";
        else if (playerCount === 0) this.gameOver = "defeat";
    },

    endTurn() {
        if (this.gameOver) return;
        this.turn++;

        const inc = this.getEmpireNetIncome("player");
        for (let k in this.res) {
            this.res[k] = Math.max(0, this.res[k] + inc[k]);
        }

        this.systems.forEach(s => s.fleetReady = true);

        if (this.diplo.truceTurns > 0) this.diplo.truceTurns--;
        if (this.turn % 4 === 0) this.diplo.opinion -= 3;

        // --- BALANCED AGGRESSIVE AI TURN ---
        const aiSystems = this.systems.filter(s => s.owner === "ai");

        if (this.diplo.truceTurns > 0) {
            this.diplo.posture = "🕊️ Bound by Non-Aggression Pact";
        } else if (this.turn < 5) {
            this.diplo.posture = "🏭 Initializing Expansion";
        } else if (this.diplo.opinion >= 25) {
            this.diplo.posture = "🤝 Cordial";
        } else {
            this.diplo.posture = "⚔️ Aggressive Expansion";
        }

        aiSystems.forEach(aiSys => {
            const usedSlots = this.getTotalDistricts(aiSys);

            // Balanced mix: 45% chance for districts/starbases, 55% chance to build ships
            if (usedSlots < aiSys.maxDistricts && Math.random() < 0.45) {
                const types = ["mine", "gen", "foundry", "farm", "lab"];
                const pick = types[this.turn % types.length];
                aiSys.districts[pick]++;
                aiSys.pop++;
            } else if (aiSys.starbase < 2 && Math.random() < 0.25) {
                aiSys.starbase++;
            } else {
                aiSys.corvettes += 1;
                if (this.turn > 6 && this.turn % 3 === 0) aiSys.destroyers += 1;
                if (this.turn > 12 && this.turn % 5 === 0) aiSys.cruisers += 1;
            }

            // AI Attack / Expansion Decision (More active: lowers power threshold to 4 and multiplier to 1.15x)
            const myPower = this.getFleetPower(aiSys);
            if (myPower >= 4 && Math.random() < 0.7) {
                const validTargets = aiSys.links
                    .map(id => this.systems[id])
                    .filter(s => {
                        if (s.owner === "ai") return false;
                        if (s.owner === "player" && (this.diplo.truceTurns > 0 || this.diplo.opinion >= 25)) return false;
                        const targetDef = this.getFleetPower(s) + this.getStarbasePower(s);
                        return myPower >= targetDef * 1.15; // 1.15x advantage is enough to push out
                    });

                validTargets.sort((a, b) => (a.owner === "neutral" ? -1 : 1));

                if (validTargets.length > 0) {
                    this.moveFleet(aiSys, validTargets[0], "ai", 0.75);
                }
            }
        });

        this.updateVisibility();
        this.checkVictoryConditions();
        this.log(`Turn ${this.turn} begun.`);
    }
};