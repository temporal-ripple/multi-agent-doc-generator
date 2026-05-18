class Boss extends Enemy {
    constructor(x, y, floor) {
        super(x, y, floor, false);

        this.maxHp = 200 + floor * 50;
        this.hp = this.maxHp;
        this.atk = 15 + floor * 5;
        this.def = 5 + floor * 2;
        this.speed = 50;

        this.type = 'boss';
        this.phase = 1;
        this.attackPattern = 0;
        this.patternTimer = 0;

        this.width = TILE_SIZE * 2;
        this.height = TILE_SIZE * 2;
    }

    update(deltaTime, player, dungeon) {
        this.patternTimer += deltaTime;

        // Phase transitions
        if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.3;
            this.atk *= 1.2;
        }

        // Attack patterns
        if (this.patternTimer > 2) {
            this.patternTimer = 0;
            this.attackPattern = (this.attackPattern + 1) % 3;
        }

        switch(this.attackPattern) {
            case 0: // Chase
                this.updateChaser(deltaTime, player, dungeon);
                break;
            case 1: // Circle
                this.updateCircle(deltaTime, player, dungeon);
                break;
            case 2: // Charge
                this.updateCharge(deltaTime, player, dungeon);
                break;
        }

        this.attack(player);
    }

    updateCircle(deltaTime, player, dungeon) {
        const angle = Date.now() / 1000;
        const radius = TILE_SIZE * 3;
        const targetX = player.x + Math.cos(angle) * radius;
        const targetY = player.y + Math.sin(angle) * radius;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const newX = this.x + (dx / dist) * this.speed * deltaTime;
            const newY = this.y + (dy / dist) * this.speed * deltaTime;

            if (dungeon.isWalkable(newX, this.y)) {
                this.x = newX;
            }
            if (dungeon.isWalkable(this.x, newY)) {
                this.y = newY;
            }
        }
    }

    updateCharge(deltaTime, player, dungeon) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const newX = this.x + (dx / dist) * this.speed * 2 * deltaTime;
            const newY = this.y + (dy / dist) * this.speed * 2 * deltaTime;

            if (dungeon.isWalkable(newX, this.y)) {
                this.x = newX;
            }
            if (dungeon.isWalkable(this.x, newY)) {
                this.y = newY;
            }
        }
    }

    die() {
        const room = game.dungeon.getRoomAt(this.x, this.y);
        if (room) {
            const index = room.enemies.indexOf(this);
            if (index !== -1) {
                room.enemies.splice(index, 1);
                room.cleared = true;
                room.openDoors();
                // Convert boss room to stairs room so player can progress
                room.type = ROOM_TYPES.STAIRS;
            }
        }

        // Drop loot
        this.dropBossLoot();
        game.player.addExp(100 + this.floor * 20);
        game.player.enemiesKilled++;

        // Track boss kill achievement
        achievements.check(ACHIEVEMENT_TYPES.KILL_BOSS);
    }

    dropBossLoot() {
        // Always drop rare item
        const rareItems = [ITEM_TYPES.WEAPON, ITEM_TYPES.ARMOR];
        game.player.addItem(randomChoice(rareItems));

        // Drop lots of gold
        game.player.gold += randomInt(100, 200);
    }

    render(renderer) {
        renderer.drawPixelEnemy(this.x, this.y, COLORS.boss, TILE_SIZE * 2);

        // Boss health bar
        const hpPercent = this.hp / this.maxHp;
        const barWidth = TILE_SIZE * 3;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - TILE_SIZE - 12;

        renderer.drawRect(barX, barY, barWidth, barHeight, '#333');
        renderer.drawRect(barX, barY, barWidth * hpPercent, barHeight, '#c0392b');

        // Boss name
        renderer.drawText('BOSS', this.x, barY - 8, '#f39c12', 12, 'center');
    }
}
