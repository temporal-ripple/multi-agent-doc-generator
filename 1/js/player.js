class Player {
    constructor(characterType = 'warrior') {
        this.x = 0;
        this.y = 0;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.characterType = characterType;

        // Stats
        this.maxHp = 100;
        this.hp = 100;
        this.atk = 10;
        this.def = 5;
        this.spd = 120;

        // Experience
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;

        // Combat
        this.attackCooldown = 0;
        this.attackRange = TILE_SIZE * 1.5;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.speedBoostTimer = 0;
        this.speedBoostActive = false;

        // Skill
        this.skillCooldown = 0;
        this.skillMaxCooldown = 5;

        // Inventory
        this.gold = 0;
        this.keys = 0;
        this.items = [];
        this.weapon = null;
        this.armor = null;

        // Stats tracking
        this.damageTaken = 0;
        this.enemiesKilled = 0;

        this.applyCharacterStats(characterType);
        this.baseSpd = this.spd;
    }

    applyCharacterStats(type) {
        switch(type) {
            case 'warrior':
                this.maxHp = 150;
                this.hp = 150;
                this.atk = 8;
                this.def = 8;
                this.spd = 100;
                this.skillMaxCooldown = 8;
                break;
            case 'assassin':
                this.maxHp = 80;
                this.hp = 80;
                this.atk = 15;
                this.def = 3;
                this.spd = 160;
                this.skillMaxCooldown = 4;
                break;
            case 'mage':
                this.maxHp = 70;
                this.hp = 70;
                this.atk = 12;
                this.def = 4;
                this.spd = 120;
                this.skillMaxCooldown = 6;
                break;
            case 'ranger':
                this.maxHp = 90;
                this.hp = 90;
                this.atk = 10;
                this.def = 5;
                this.spd = 140;
                this.skillMaxCooldown = 5;
                break;
        }
    }

    update(deltaTime, dungeon) {
        // Movement
        const dir = input.getDirection();
        // Normalize diagonal movement
        if (dir.dx !== 0 && dir.dy !== 0) {
            const len = Math.sqrt(dir.dx * dir.dx + dir.dy * dir.dy);
            dir.dx /= len;
            dir.dy /= len;
        }
        const moveX = dir.dx * this.spd * deltaTime;
        const moveY = dir.dy * this.spd * deltaTime;

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        if (dungeon.isWalkable(newX, this.y)) {
            this.x = newX;
        }
        if (dungeon.isWalkable(this.x, newY)) {
            this.y = newY;
        }

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Skill cooldown
        if (this.skillCooldown > 0) {
            this.skillCooldown -= deltaTime;
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Speed boost
        if (this.speedBoostActive) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.speedBoostActive = false;
                this.spd = this.baseSpd;
            }
        }

        // Attack input
        if (input.isKeyJustPressed('Space') && this.attackCooldown <= 0) {
            this.attack(dungeon);
        }

        // Skill input
        if (input.isKeyJustPressed('KeyQ') && this.skillCooldown <= 0) {
            this.useSkill(dungeon);
        }

        // Interact input
        if (input.isKeyJustPressed('KeyE')) {
            this.interact(dungeon);
        }

        // Check traps
        this.checkTraps(dungeon);
    }

    attack(dungeon) {
        this.attackCooldown = 0.5;

        const room = dungeon.getRoomAt(this.x, this.y);
        if (!room) return;

        room.enemies.forEach(enemy => {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < this.attackRange) {
                const damage = Math.max(1, this.atk - enemy.def);
                enemy.takeDamage(damage);
            }
        });
    }

    useSkill(dungeon) {
        this.skillCooldown = this.skillMaxCooldown;

        switch(this.characterType) {
            case 'warrior':
                // Shield block - invincible for 2 seconds
                this.invincible = true;
                this.invincibleTimer = 2;
                break;
            case 'assassin':
                // Dash - move forward quickly
                const dir = input.getDirection();
                const dashDist = TILE_SIZE * 3;
                const newX = this.x + dir.dx * dashDist;
                const newY = this.y + dir.dy * dashDist;
                if (dungeon.isWalkable(newX, newY)) {
                    this.x = newX;
                    this.y = newY;
                }
                break;
            case 'mage':
                // Fireball - ranged attack
                this.fireballAttack(dungeon);
                break;
            case 'ranger':
                // Multi-shot - attack all directions
                this.multiShotAttack(dungeon);
                break;
        }
    }

    fireballAttack(dungeon) {
        const room = dungeon.getRoomAt(this.x, this.y);
        if (!room) return;

        room.enemies.forEach(enemy => {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < TILE_SIZE * 5) {
                const damage = Math.max(1, this.atk * 2 - enemy.def);
                enemy.takeDamage(damage);
            }
        });
    }

    multiShotAttack(dungeon) {
        const room = dungeon.getRoomAt(this.x, this.y);
        if (!room) return;

        room.enemies.forEach(enemy => {
            const dist = distance(this.x, this.y, enemy.x, enemy.y);
            if (dist < TILE_SIZE * 3) {
                const damage = Math.max(1, this.atk - enemy.def);
                enemy.takeDamage(damage);
            }
        });
    }

    interact(dungeon) {
        const room = dungeon.getRoomAt(this.x, this.y);
        if (!room) return;

        // Check chests
        room.chests.forEach(chest => {
            if (!chest.opened) {
                const dist = distance(
                    this.x, this.y,
                    chest.x * TILE_SIZE + TILE_SIZE/2,
                    chest.y * TILE_SIZE + TILE_SIZE/2
                );
                if (dist < TILE_SIZE * 1.5) {
                    chest.opened = true;
                    this.openChest();
                }
            }
        });

        // Check stairs
        if (room.type === ROOM_TYPES.STAIRS && room.cleared) {
            const center = room.getCenter();
            const dist = distance(this.x, this.y, center.x, center.y);
            if (dist < TILE_SIZE * 1.5) {
                game.nextFloor();
            }
        }

        // Check shop
        if (room.type === ROOM_TYPES.SHOP) {
            // Shop interaction handled by UI
        }
    }

    openChest() {
        const roll = Math.random();
        if (roll < 0.3) {
            this.addItem(ITEM_TYPES.HEALTH_POTION);
        } else if (roll < 0.5) {
            this.gold += randomInt(20, 50);
        } else if (roll < 0.7) {
            this.addItem(ITEM_TYPES.KEY);
        } else {
            this.addItem(randomChoice([ITEM_TYPES.BOMB, ITEM_TYPES.SHIELD, ITEM_TYPES.SPEED]));
        }
    }

    checkTraps(dungeon) {
        const room = dungeon.getRoomAt(this.x, this.y);
        if (!room) return;

        room.traps.forEach(trap => {
            if (trap.active) {
                const dist = distance(
                    this.x, this.y,
                    trap.x * TILE_SIZE + TILE_SIZE/2,
                    trap.y * TILE_SIZE + TILE_SIZE/2
                );
                if (dist < TILE_SIZE * 0.8) {
                    this.takeDamage(trap.damage);
                    trap.active = false;
                    setTimeout(() => trap.active = true, 2000);
                }
            }
        });
    }

    takeDamage(damage) {
        if (this.invincible) return;

        const actualDamage = Math.max(1, damage - this.def);
        this.hp -= actualDamage;
        this.damageTaken += actualDamage;

        this.invincible = true;
        this.invincibleTimer = 0.5;

        if (this.hp <= 0) {
            this.hp = 0;
            game.gameOver();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp -= this.expToLevel;
        this.expToLevel = Math.floor(this.expToLevel * 1.5);

        // Increase stats
        this.maxHp += 10;
        this.hp = this.maxHp;
        this.atk += 2;
        this.def += 1;

        // Skill upgrade every 3 levels
        if (this.level % 3 === 0) {
            this.skillMaxCooldown *= 0.8;
        }
    }

    addItem(type) {
        this.items.push(type);
    }

    useItem(index) {
        if (index < 0 || index >= this.items.length) return;

        const item = this.items[index];
        this.items.splice(index, 1);

        switch(item) {
            case ITEM_TYPES.HEALTH_POTION:
                this.heal(50);
                break;
            case ITEM_TYPES.KEY:
                this.keys++;
                break;
            case ITEM_TYPES.BOMB:
                this.bombAttack();
                break;
            case ITEM_TYPES.SHIELD:
                this.invincible = true;
                this.invincibleTimer = 3;
                break;
            case ITEM_TYPES.SPEED:
                if (!this.speedBoostActive) {
                    this.baseSpd = this.spd;
                }
                this.spd = this.baseSpd * 1.5;
                this.speedBoostActive = true;
                this.speedBoostTimer = 5;
                break;
            case ITEM_TYPES.TELEPORT:
                // Teleport to random room
                const rooms = game.dungeon.rooms;
                const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
                const center = randomRoom.getCenter();
                this.x = center.x;
                this.y = center.y;
                break;
            case ITEM_TYPES.WEAPON:
                if (this.weapon !== item) {
                    applyEquipment(this, item);
                }
                break;
            case ITEM_TYPES.ARMOR:
                if (this.armor !== item) {
                    applyEquipment(this, item);
                }
                break;
        }
    }

    bombAttack() {
        const room = game.dungeon.getRoomAt(this.x, this.y);
        if (!room) return;

        room.enemies.forEach(enemy => {
            enemy.takeDamage(50);
        });
    }

    render(renderer) {
        // Flash when invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        renderer.drawPixelChar(this.x, this.y, COLORS.player);
    }
}
