class Enemy {
    constructor(x, y, floor, isElite = false) {
        this.x = x * TILE_SIZE + TILE_SIZE / 2;
        this.y = y * TILE_SIZE + TILE_SIZE / 2;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.floor = floor;
        this.isElite = isElite;

        // Stats
        this.maxHp = 30 + floor * 10;
        this.hp = this.maxHp;
        this.atk = 5 + floor * 2;
        this.def = 2 + floor;
        this.speed = 60;

        // AI
        this.type = this.getRandomType();
        this.moveTimer = 0;
        this.attackCooldown = 0;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;

        // Elite bonus
        if (isElite) {
            this.maxHp *= 2;
            this.hp = this.maxHp;
            this.atk *= 2;
            this.def *= 1.5;
        }

        this.setupAI();
    }

    getRandomType() {
        const types = [ENEMY_TYPES.CHASER, ENEMY_TYPES.PATROL, ENEMY_TYPES.RANGER];
        return randomChoice(types);
    }

    setupAI() {
        switch(this.type) {
            case ENEMY_TYPES.PATROL:
                // Create patrol points around spawn
                this.patrolPoints = [
                    { x: this.x - TILE_SIZE * 2, y: this.y },
                    { x: this.x + TILE_SIZE * 2, y: this.y },
                    { x: this.x, y: this.y - TILE_SIZE * 2 },
                    { x: this.x, y: this.y + TILE_SIZE * 2 }
                ];
                break;
            case ENEMY_TYPES.RANGER:
                this.speed = 40;
                break;
        }
    }

    update(deltaTime, player) {
        this.moveTimer += deltaTime;
        this.attackCooldown -= deltaTime;

        switch(this.type) {
            case ENEMY_TYPES.CHASER:
                this.updateChaser(deltaTime, player);
                break;
            case ENEMY_TYPES.PATROL:
                this.updatePatrol(deltaTime, player);
                break;
            case ENEMY_TYPES.RANGER:
                this.updateRanger(deltaTime, player);
                break;
        }
    }

    updateChaser(deltaTime, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    updatePatrol(deltaTime, player) {
        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    updateRanger(deltaTime, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const optimalDist = TILE_SIZE * 3;

        if (dist < optimalDist - 20) {
            // Move away
            this.x -= (dx / dist) * this.speed * deltaTime;
            this.y -= (dy / dist) * this.speed * deltaTime;
        } else if (dist > optimalDist + 20) {
            // Move closer
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const room = game.dungeon.getRoomAt(this.x, this.y);
        if (room) {
            const index = room.enemies.indexOf(this);
            if (index !== -1) {
                room.enemies.splice(index, 1);
                room.checkCleared();
            }
        }

        // Drop loot
        this.dropLoot();

        // Give exp
        game.player.addExp(10 + this.floor * 2);
        game.player.enemiesKilled++;
    }

    dropLoot() {
        // Always drop gold
        const goldAmount = randomInt(5, 15) * (this.isElite ? 3 : 1);
        game.player.gold += goldAmount;

        // Chance to drop item
        const dropChance = this.isElite ? 0.5 : 0.2;
        if (Math.random() < dropChance) {
            const itemTypes = [
                ITEM_TYPES.HEALTH_POTION,
                ITEM_TYPES.KEY,
                ITEM_TYPES.BOMB,
                ITEM_TYPES.SHIELD,
                ITEM_TYPES.SPEED
            ];
            game.player.addItem(randomChoice(itemTypes));
        }
    }

    render(renderer) {
        const color = this.isElite ? COLORS.elite : COLORS.enemy;
        renderer.drawPixelEnemy(this.x, this.y, color);

        // Health bar
        const hpPercent = this.hp / this.maxHp;
        const barWidth = TILE_SIZE;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - TILE_SIZE / 2 - 8;

        renderer.drawRect(barX, barY, barWidth, barHeight, '#333');
        renderer.drawRect(barX, barY, barWidth * hpPercent, barHeight, '#e74c3c');
    }
}
