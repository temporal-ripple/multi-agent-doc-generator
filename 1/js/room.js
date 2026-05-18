class Room {
    constructor(x, y, width, height, type = ROOM_TYPES.NORMAL) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.doors = [];
        this.enemies = [];
        this.items = [];
        this.obstacles = [];
        this.traps = [];
        this.chests = [];
        this.cleared = false;
        this.visited = false;
        this.generated = false;
    }

    getBounds() {
        return {
            x: this.x * TILE_SIZE,
            y: this.y * TILE_SIZE,
            w: this.width * TILE_SIZE,
            h: this.height * TILE_SIZE
        };
    }

    getCenter() {
        return {
            x: (this.x + this.width / 2) * TILE_SIZE,
            y: (this.y + this.height / 2) * TILE_SIZE
        };
    }

    isInRoom(x, y) {
        const bounds = this.getBounds();
        return x >= bounds.x && x < bounds.x + bounds.w &&
               y >= bounds.y && y < bounds.y + bounds.h;
    }

    generateContent(floor) {
        if (this.generated) return;
        this.generated = true;

        if (this.type === ROOM_TYPES.SHOP ||
            this.type === ROOM_TYPES.STAIRS ||
            this.type === ROOM_TYPES.EMPTY) {
            return;
        }

        // Generate obstacles
        const obstacleCount = randomInt(2, 5);
        for (let i = 0; i < obstacleCount; i++) {
            const ox = randomInt(this.x + 1, this.x + this.width - 2);
            const oy = randomInt(this.y + 1, this.y + this.height - 2);
            this.obstacles.push({
                x: ox,
                y: oy,
                breakable: Math.random() > 0.5
            });
        }

        // Generate enemies (only for normal and boss rooms)
        if (this.type === ROOM_TYPES.NORMAL) {
            const enemyCount = randomInt(2, 4) + Math.floor(floor / 3);
            for (let i = 0; i < enemyCount; i++) {
                const ex = randomInt(this.x + 1, this.x + this.width - 2);
                const ey = randomInt(this.y + 1, this.y + this.height - 2);
                const isElite = Math.random() < 0.1 + floor * 0.02;
                this.enemies.push(new Enemy(ex, ey, floor, isElite));
            }
        }

        // Generate traps
        if (this.type === ROOM_TYPES.TRAP || this.type === ROOM_TYPES.NORMAL) {
            const trapCount = this.type === ROOM_TYPES.TRAP ? randomInt(5, 8) : randomInt(0, 2);
            for (let i = 0; i < trapCount; i++) {
                const tx = randomInt(this.x + 1, this.x + this.width - 2);
                const ty = randomInt(this.y + 1, this.y + this.height - 2);
                this.traps.push({ x: tx, y: ty, active: true, damage: 10 + floor * 2 });
            }
        }

        // Generate chests
        if (this.type === ROOM_TYPES.TREASURE || Math.random() < 0.2) {
            const cx = randomInt(this.x + 1, this.x + this.width - 2);
            const cy = randomInt(this.y + 1, this.y + this.height - 2);
            this.chests.push({ x: cx, y: cy, opened: false });
        }
    }

    addDoor(x, y, targetRoom) {
        this.doors.push({ x, y, targetRoom, locked: false, open: false });
    }

    openDoors() {
        this.doors.forEach(door => door.open = true);
    }

    checkCleared() {
        if (this.cleared) return true;
        if (this.enemies.length === 0) {
            this.cleared = true;
            this.openDoors();
            return true;
        }
        return false;
    }

    render(renderer) {
        const bounds = this.getBounds();

        // Draw floor
        renderer.drawRect(bounds.x, bounds.y, bounds.w, bounds.h, COLORS.floor);

        // Draw walls
        renderer.drawStrokeRect(bounds.x, bounds.y, bounds.w, bounds.h, COLORS.wall, 3);

        // Draw obstacles
        this.obstacles.forEach(obs => {
            renderer.drawRect(
                obs.x * TILE_SIZE, obs.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                obs.breakable ? '#95a5a6' : '#7f8c8d'
            );
        });

        // Draw traps
        this.traps.forEach(trap => {
            if (trap.active) {
                renderer.drawRect(
                    trap.x * TILE_SIZE + 4, trap.y * TILE_SIZE + 4,
                    TILE_SIZE - 8, TILE_SIZE - 8,
                    COLORS.trap
                );
            }
        });

        // Draw chests
        this.chests.forEach(chest => {
            if (!chest.opened) {
                renderer.drawRect(
                    chest.x * TILE_SIZE + 4, chest.y * TILE_SIZE + 8,
                    TILE_SIZE - 8, TILE_SIZE - 12,
                    COLORS.chest
                );
            }
        });

        // Draw doors
        this.doors.forEach(door => {
            const doorColor = door.open ? COLORS.door :
                            door.locked ? COLORS.doorLocked : COLORS.wall;
            renderer.drawRect(
                door.x * TILE_SIZE, door.y * TILE_SIZE,
                TILE_SIZE, TILE_SIZE,
                doorColor
            );
        });

        // Draw stairs
        if (this.type === ROOM_TYPES.STAIRS) {
            const center = this.getCenter();
            renderer.drawRect(
                center.x - TILE_SIZE/2, center.y - TILE_SIZE/2,
                TILE_SIZE, TILE_SIZE,
                COLORS.stairs
            );
            renderer.drawText('▼', center.x, center.y + 4, '#000', 20, 'center');
        }

        // Draw shop
        if (this.type === ROOM_TYPES.SHOP) {
            const center = this.getCenter();
            renderer.drawRect(
                center.x - TILE_SIZE, center.y - TILE_SIZE,
                TILE_SIZE * 2, TILE_SIZE * 2,
                COLORS.shop
            );
            renderer.drawText('$', center.x, center.y + 6, '#fff', 24, 'center');
        }
    }
}
