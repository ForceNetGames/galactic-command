window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('galaxyCanvas');
    Game.State.init();
    Game.Renderer.init(canvas);

    // --- MAIN MENU & TUTORIAL HANDLERS ---
    const mainMenu = document.getElementById('main-menu');
    const tutorialModal = document.getElementById('tutorial-modal');

    document.getElementById('menu-start-btn').addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        Game.State.log("Game started. Good luck, Commander.");
        updateUI();
        Game.Renderer.draw();
    });

    document.getElementById('menu-tutorial-btn').addEventListener('click', () => {
        tutorialModal.classList.remove('hidden');
    });

    document.getElementById('tutorial-close-btn').addEventListener('click', () => {
        tutorialModal.classList.add('hidden');
    });

    function formatInc(val, elId) {
        const el = document.getElementById(elId);
        el.textContent = val >= 0 ? `(+${val})` : `(${val})`;
        el.className = "income " + (val >= 0 ? "inc-pos" : "inc-neg");
    }

    function renderTechTree() {
        const container = document.getElementById('tech-list');
        container.innerHTML = "";

        const unlockedCount = Game.Data.techTree.filter(t => t.researched).length;
        document.getElementById('tech-count').textContent = `${unlockedCount}/${Game.Data.techTree.length}`;

        ["⚔️ Military", "🏭 Economy", "🛸 Logistics"].forEach(cat => {
            const header = document.createElement('div');
            header.className = "tech-cat-title";
            header.textContent = cat;
            container.appendChild(header);

            Game.Data.techTree.filter(t => t.category === cat).forEach(tech => {
                const card = document.createElement('div');
                card.className = "tech-card" + (tech.researched ? " researched" : "");

                const reqMet = !tech.req || Game.State.hasTech(tech.req);
                const canAfford = Game.State.res.research >= tech.cost && reqMet && !tech.researched;

                let btnText = `${tech.cost} 🔬`;
                if (tech.researched) btnText = "✔ Active";
                else if (!reqMet) btnText = "🔒 Locked";

                card.innerHTML = `
                    <div class="tech-info">
                        <span class="tech-name">${tech.name}</span>
                        <span class="tech-desc">${tech.desc}</span>
                    </div>
                    <button class="tech-buy-btn" ${canAfford ? "" : "disabled"}>${btnText}</button>
                `;

                if (canAfford) {
                    card.querySelector('button').addEventListener('click', () => {
                        Game.State.res.research -= tech.cost;
                        tech.researched = true;
                        Game.State.updateVisibility();
                        Game.State.log(`🔬 Researched ${tech.name}!`);
                        updateUI();
                        Game.Renderer.draw();
                    });
                }
                container.appendChild(card);
            });
        });
    }

    function updateUI() {
        const S = Game.State;
        const inc = S.getEmpireNetIncome("player");

        document.getElementById('energy-val').textContent = S.res.energy; formatInc(inc.energy, 'energy-inc');
        document.getElementById('minerals-val').textContent = S.res.minerals; formatInc(inc.minerals, 'minerals-inc');
        document.getElementById('alloys-val').textContent = S.res.alloys; formatInc(inc.alloys, 'alloys-inc');
        document.getElementById('food-val').textContent = S.res.food; formatInc(inc.food, 'food-inc');
        document.getElementById('research-val').textContent = S.res.research; formatInc(inc.research, 'research-inc');
        document.getElementById('turn-val').textContent = S.turn;

        document.getElementById('game-log').innerHTML = S.logs.map(m => `<li>${m}</li>`).join('');
        renderTechTree();

        // Update Diplomacy Tab
        document.getElementById('ai-posture').textContent = S.diplo.posture;
        document.getElementById('ai-opinion').textContent = `${S.diplo.opinion} (${S.diplo.opinion >= 25 ? "Friendly" : (S.diplo.opinion < 0 ? "Hostile" : "Cautious")})`;
        document.getElementById('ai-truce').textContent = S.diplo.truceTurns > 0 ? `${S.diplo.truceTurns} Turns Remaining` : "None";
        document.getElementById('player-worlds').textContent = S.systems.filter(s => s.owner === "player").length;
        document.getElementById('ai-worlds').textContent = S.systems.filter(s => s.owner === "ai").length;
        document.getElementById('neutral-worlds').textContent = S.systems.filter(s => s.owner === "neutral").length;

        // Check Game Over Modal
        if (S.gameOver) {
            const modal = document.getElementById('gameover-modal');
            modal.classList.remove('hidden');
            document.getElementById('gameover-title').textContent = S.gameOver === "victory" ? "🏆 GALACTIC VICTORY!" : "💀 EMPIRE FALLEN";
            document.getElementById('gameover-desc').textContent = S.gameOver === "victory"
                ? `You eliminated the Crimson Syndicate in ${S.turn} turns!`
                : "Your last star system has fallen.";
        }

        const sys = S.selectedSystem;
        const detailsBox = document.getElementById('sys-details');
        const actionsBox = document.getElementById('player-actions');
        const splitBox = document.getElementById('fleet-split-box');

        if (!sys) {
            detailsBox.classList.add('hidden');
            return;
        }

        detailsBox.classList.remove('hidden');

        if (!sys.explored) {
            document.getElementById('sys-name').textContent = sys.anomaly ? "✨ Unexplored Anomaly" : "Unexplored System";
            document.getElementById('sys-biome').textContent = "Unknown";
            document.getElementById('sys-biome').style.color = "#94a3b8";
            document.getElementById('sys-owner').textContent = "Deep Space — Outside Sensor Range";
            document.getElementById('sys-specialty').textContent = sys.anomaly
                ? "✨ Long-range scans detect a Precursor Anomaly here! Move a fleet in to claim it."
                : "Move a fleet to an adjacent star or research Tachyon Sensors to scan this system.";
            document.getElementById('sys-slots').textContent = "??? / ???";
            document.getElementById('sys-starbase').textContent = "Unknown";
            document.getElementById('sys-fleet').textContent = "Unknown Garrison";
            document.getElementById('sys-ready').textContent = "--";
            document.getElementById('sys-econ').textContent = "Unknown Yields";
            actionsBox.classList.add('hidden');
            splitBox.classList.add('hidden');
            return;
        }

        const out = S.getSystemNetOutput(sys);

        document.getElementById('sys-name').textContent = (sys.anomaly ? "✨ " : "") + sys.name;
        document.getElementById('sys-biome').textContent = sys.biome.name;
        document.getElementById('sys-biome').style.color = sys.biome.color;
        document.getElementById('sys-owner').textContent = `Empire: ${sys.owner.toUpperCase()} | Population: ${sys.pop}`;
        document.getElementById('sys-specialty').textContent = sys.biome.specialty;
        document.getElementById('sys-slots').textContent = `${S.getTotalDistricts(sys)} / ${S.getMaxDistricts(sys)} Districts`;
        document.getElementById('sys-starbase').textContent = `Lvl ${sys.starbase} / 3 (🛡️${S.getStarbasePower(sys)} Defense)`;
        document.getElementById('sys-fleet').textContent = `${sys.corvettes}C / ${sys.destroyers}D / ${sys.cruisers}Cr (⚔️${S.getFleetPower(sys)})`;
        document.getElementById('sys-ready').textContent = sys.fleetReady ? "⚡ Ready to Jump" : "⏳ Recharging Drive";
        document.getElementById('sys-econ').textContent = `${out.energy}⚡ ${out.minerals}⛏️ ${out.alloys}🔩 ${out.food}🌾 ${out.research}🔬`;

        // District Yields & Counts
        document.getElementById('yield-gen').textContent = `(+${S.getSingleDistrictYield(sys, 'gen')}⚡)`;
        document.getElementById('yield-mine').textContent = `(+${S.getSingleDistrictYield(sys, 'mine')}⛏️)`;
        document.getElementById('yield-farm').textContent = `(+${S.getSingleDistrictYield(sys, 'farm')}🌾)`;
        document.getElementById('yield-foundry').textContent = `(+${S.getSingleDistrictYield(sys, 'foundry')}🔩/-6⛏️)`;
        document.getElementById('yield-lab').textContent = `(+${S.getSingleDistrictYield(sys, 'lab')}🔬/-3⚡)`;

        document.getElementById('count-gen').textContent = `[${sys.districts.gen}]`;
        document.getElementById('count-mine').textContent = `[${sys.districts.mine}]`;
        document.getElementById('count-farm').textContent = `[${sys.districts.farm}]`;
        document.getElementById('count-foundry').textContent = `[${sys.districts.foundry}]`;
        document.getElementById('count-lab').textContent = `[${sys.districts.lab}]`;

        // Starbase Button
        const sbBtn = document.getElementById('build-starbase-btn');
        const sbBonusPerLvl = S.hasTech('citadels') ? 9 : 6;
        document.getElementById('starbase-bonus').textContent = `(+${sbBonusPerLvl}🛡️ / -1⚡)`;
        if (sys.starbase >= 3) {
            sbBtn.disabled = true;
            document.getElementById('starbase-cost').textContent = "MAX LVL";
        } else {
            sbBtn.disabled = false;
            document.getElementById('starbase-cost').textContent = "40 🔩";
        }

        // Shipyard Buttons
        document.getElementById('corvette-cost').textContent = `${S.getShipCost('corvette')} 🔩`;
        
        const destBtn = document.getElementById('build-destroyer-btn');
        destBtn.disabled = !S.hasTech('destroyers');
        document.getElementById('destroyer-cost').textContent = S.hasTech('destroyers') ? `${S.getShipCost('destroyer')} 🔩` : "🔒 Tech";

        const cruisBtn = document.getElementById('build-cruiser-btn');
        cruisBtn.disabled = !S.hasTech('cruisers');
        document.getElementById('cruiser-cost').textContent = S.hasTech('cruisers') ? `${S.getShipCost('cruiser')} 🔩` : "🔒 Tech";

        if (sys.owner === "player") {
            actionsBox.classList.remove('hidden');
            splitBox.classList.remove('hidden');
        } else {
            actionsBox.classList.add('hidden');
            splitBox.classList.add('hidden');
        }
    }

    // --- FLEET SPLIT BUTTONS ---
    document.querySelectorAll('.split-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.split-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const ratio = parseFloat(btn.dataset.ratio);
            Game.State.fleetSplitRatio = ratio;
            document.getElementById('split-label').textContent = `${Math.round(ratio * 100)}% of Stationed Fleet`;
        });
    });

    // --- CAMERA DRAGGING & STAR CLICKING ---
    let isDragging = false, dragMoved = false, lastX = 0, lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDragging = true;
            dragMoved = false;
            lastX = e.clientX;
            lastY = e.clientY;
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        if (Math.hypot(dx, dy) > 4) dragMoved = true;
        Game.Renderer.pan(-dx, -dy);
        lastX = e.clientX;
        lastY = e.clientY;
        Game.Renderer.draw();
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0 && isDragging) {
            isDragging = false;
            if (!dragMoved) {
                const worldPos = Game.Renderer.screenToWorld(e.clientX, e.clientY);
                const clicked = Game.State.systems.find(s => Math.hypot(s.x - worldPos.x, s.y - worldPos.y) < 26);
                if (clicked) {
                    Game.State.selectedSystem = clicked;
                    updateUI();
                    Game.Renderer.draw();
                }
            }
        }
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const S = Game.State;
        const origin = S.selectedSystem;
        if (!origin || origin.owner !== "player" || S.getTotalShips(origin) <= 0) return;

        const worldPos = Game.Renderer.screenToWorld(e.clientX, e.clientY);
        const target = S.systems.find(s => Math.hypot(s.x - worldPos.x, s.y - worldPos.y) < 26);

        if (target && origin.links.includes(target.id)) {
            if (S.moveFleet(origin, target, "player", S.fleetSplitRatio)) {
                S.selectedSystem = target;
            }
            updateUI();
            Game.Renderer.draw();
        } else if (target) {
            S.log(`No direct hyperlane between ${origin.name} and ${target.name}!`);
            updateUI();
        }
    });

    window.addEventListener('keydown', (e) => {
        const step = 40;
        const key = e.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') Game.Renderer.pan(0, -step);
        if (key === 's' || key === 'arrowdown') Game.Renderer.pan(0, step);
        if (key === 'a' || key === 'arrowleft') Game.Renderer.pan(-step, 0);
        if (key === 'd' || key === 'arrowright') Game.Renderer.pan(step, 0);
        Game.Renderer.draw();
    });

    // --- SIDEBAR COMMANDS ---
    function buildDistrict(type, cost, label) {
        const S = Game.State;
        const sys = S.selectedSystem;
        if (!sys || sys.owner !== "player") return;
        if (S.getTotalDistricts(sys) >= S.getMaxDistricts(sys)) {
            S.log(`${sys.name} has reached max district capacity!`);
            return updateUI();
        }
        if (S.res.minerals < cost) {
            S.log(`Insufficient Minerals (Need ${cost} ⛏️).`);
            return updateUI();
        }
        S.res.minerals -= cost;
        sys.districts[type]++;
        sys.pop++;
        S.log(`Built ${label} on ${sys.name}.`);
        updateUI();
    }

    document.getElementById('build-gen-btn').addEventListener('click', () => buildDistrict('gen', 50, 'Generator District'));
    document.getElementById('build-mine-btn').addEventListener('click', () => buildDistrict('mine', 50, 'Mining District'));
    document.getElementById('build-farm-btn').addEventListener('click', () => buildDistrict('farm', 40, 'Agri-District'));
    document.getElementById('build-foundry-btn').addEventListener('click', () => buildDistrict('foundry', 75, 'Alloy Foundry'));
    document.getElementById('build-lab-btn').addEventListener('click', () => buildDistrict('lab', 60, 'Research Lab'));

    document.getElementById('build-starbase-btn').addEventListener('click', () => {
        const S = Game.State;
        const sys = S.selectedSystem;
        if (!sys || sys.owner !== "player" || sys.starbase >= 3) return;
        if (S.res.alloys < 40) {
            S.log("Need 40 🔩 Alloys to upgrade Starbase.");
            return updateUI();
        }
        S.res.alloys -= 40;
        sys.starbase++;
        S.log(`🛡️ Upgraded Starbase at ${sys.name} to Level ${sys.starbase}!`);
        updateUI();
        Game.Renderer.draw();
    });

    function buildShip(type, propName, label) {
        const S = Game.State;
        const sys = S.selectedSystem;
        const cost = S.getShipCost(type);
        if (sys && sys.owner === "player" && S.res.alloys >= cost) {
            S.res.alloys -= cost;
            sys[propName]++;
            S.log(`Constructed ${label} at ${sys.name}.`);
            updateUI();
            Game.Renderer.draw();
        } else {
            S.log(`Need ${cost} 🔩 Alloys for ${label}.`);
            updateUI();
        }
    }

    document.getElementById('build-corvette-btn').addEventListener('click', () => buildShip('corvette', 'corvettes', 'Corvette'));
    document.getElementById('build-destroyer-btn').addEventListener('click', () => buildShip('destroyer', 'destroyers', 'Destroyer'));
    document.getElementById('build-cruiser-btn').addEventListener('click', () => buildShip('cruiser', 'cruisers', 'Cruiser'));

    document.getElementById('diplo-gift-btn').addEventListener('click', () => {
        const S = Game.State;
        if (S.res.energy < 60) {
            S.log("Need 60 ⚡ Energy to send a Trade Envoy.");
            return updateUI();
        }
        S.res.energy -= 60;
        S.diplo.opinion += 30;
        S.log("🎁 Sent Trade Envoy to Crimson Syndicate (+30 Opinion).");
        updateUI();
    });

    document.getElementById('diplo-pact-btn').addEventListener('click', () => {
        const S = Game.State;
        if (S.diplo.opinion < 20) {
            S.log("Crimson Syndicate refuses! Need at least +20 Opinion first.");
            return updateUI();
        }
        if (S.res.energy < 80) {
            S.log("Need 80 ⚡ Energy to sign Non-Aggression Pact.");
            return updateUI();
        }
        S.res.energy -= 80;
        S.diplo.truceTurns = 8;
        S.log("🕊️ Signed 8-Turn Non-Aggression Pact with the Crimson Syndicate!");
        updateUI();
    });

    document.getElementById('end-turn-btn').addEventListener('click', () => {
        Game.State.endTurn();
        updateUI();
        Game.Renderer.draw();
    });

    const tabs = [
        { btn: document.getElementById('tab-planet-btn'), view: document.getElementById('planet-tab-view') },
        { btn: document.getElementById('tab-tech-btn'), view: document.getElementById('tech-tab-view') },
        { btn: document.getElementById('tab-diplo-btn'), view: document.getElementById('diplo-tab-view') }
    ];

    tabs.forEach(t => {
        t.btn.addEventListener('click', () => {
            tabs.forEach(other => {
                other.btn.classList.remove('active');
                other.view.classList.add('hidden');
            });
            t.btn.classList.add('active');
            t.view.classList.remove('hidden');
        });
    });

    updateUI();
    Game.Renderer.draw();
});