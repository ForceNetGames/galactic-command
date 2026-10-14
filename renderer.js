window.Game = window.Game || {};

Game.Renderer = {
    canvas: null,
    ctx: null,
    camX: 0,
    camY: 200,

    init(canvasEl) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        const home = Game.State.systems[0];
        if (home) {
            this.camX = Math.max(0, home.x - 180);
            this.camY = Math.max(0, home.y - 280);
        }
    },

    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (screenX - rect.left) * scaleX + this.camX,
            y: (screenY - rect.top) * scaleY + this.camY
        };
    },

    pan(dx, dy) {
        this.camX = Math.max(-100, Math.min(Game.MapGen.MAP_WIDTH - this.canvas.width + 100, this.camX + dx));
        this.camY = Math.max(-100, Math.min(Game.MapGen.MAP_HEIGHT - this.canvas.height + 100, this.camY + dy));
    },

    drawHexagon(ctx, x, y, radius, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = x + radius * Math.cos(angle);
            const hy = y + radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
    },

    draw() {
        const ctx = this.ctx;
        const systems = Game.State.systems;
        const selected = Game.State.selectedSystem;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        ctx.translate(-this.camX, -this.camY);

        // 1. Sector Grid
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 1;
        for (let x = 0; x < Game.MapGen.MAP_WIDTH; x += 100) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Game.MapGen.MAP_HEIGHT); ctx.stroke();
        }
        for (let y = 0; y < Game.MapGen.MAP_HEIGHT; y += 100) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Game.MapGen.MAP_WIDTH, y); ctx.stroke();
        }

        // 2. Hyperlanes
        systems.forEach(sys => {
            sys.links.forEach(targetId => {
                if (sys.id < targetId) {
                    const target = systems[targetId];
                    const bothHidden = !sys.explored && !target.explored;
                    const isSelectedLink = selected && (selected.id === sys.id || selected.id === targetId);

                    ctx.strokeStyle = isSelectedLink ? "#38bdf888" : (bothHidden ? "#0f172a" : "#1e293b");
                    ctx.lineWidth = isSelectedLink ? 2.5 : 1.5;
                    ctx.beginPath();
                    ctx.moveTo(sys.x, sys.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.stroke();
                }
            });
        });

        // 3. Star Systems
        systems.forEach(sys => {
            if (selected && selected.id === sys.id) {
                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(sys.x, sys.y, 27, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (!sys.explored) {
                ctx.strokeStyle = "#334155";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(sys.x, sys.y, 15, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "#1e293b";
                ctx.beginPath();
                ctx.arc(sys.x, sys.y, 9, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#64748b";
                ctx.font = "11px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(sys.anomaly ? "✨ ??? Anomaly" : "??? Unexplored", sys.x, sys.y + 32);
                return;
            }

            // Starbase Hexagon Shield (if Starbase Lvl > 0)
            if (sys.starbase > 0) {
                this.drawHexagon(ctx, sys.x, sys.y, 22, Game.Data.factionColors[sys.owner]);
            }

            // Territory Ring
            ctx.strokeStyle = Game.Data.factionColors[sys.owner];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sys.x, sys.y, 16, 0, Math.PI * 2);
            ctx.stroke();

            // Planet Biome Core
            ctx.fillStyle = sys.biome.color;
            ctx.beginPath();
            ctx.arc(sys.x, sys.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // System Name & Biome
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            const anomalyIcon = sys.anomaly ? "✨ " : "";
            ctx.fillText(anomalyIcon + sys.name, sys.x, sys.y + 33);

            ctx.fillStyle = sys.biome.color;
            ctx.font = "10px sans-serif";
            ctx.fillText(sys.biome.name.replace(" World", ""), sys.x, sys.y + 45);

            // Fleet & Starbase Badge
            const power = Game.State.getFleetPower(sys);
            const sbPower = Game.State.getStarbasePower(sys);
            if ((power > 0 || sbPower > 0) && sys.inSensorRange) {
                const badgeX = sys.x + 14;
                const badgeY = sys.y - 26;
                ctx.fillStyle = "#090d16";
                ctx.fillRect(badgeX, badgeY, 54, 18);
                ctx.strokeStyle = Game.Data.factionColors[sys.owner];
                ctx.lineWidth = 1.2;
                ctx.strokeRect(badgeX, badgeY, 54, 18);

                ctx.fillStyle = sys.fleetReady ? "#ffffff" : "#94a3b8";
                ctx.font = "bold 10px sans-serif";
                const icon = sys.fleetReady ? "⚔️" : "⏳";
                const sbText = sbPower > 0 ? `+🛡️${sbPower}` : "";
                ctx.fillText(`${icon}${power}${sbText}`, badgeX + 27, badgeY + 13);
            }
        });

        ctx.restore();
    }
};