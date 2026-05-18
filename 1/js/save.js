class SaveSystem {
    constructor() {
        this.saveKey = 'dungeonSave';
    }

    save(game) {
        const data = {
            player: {
                characterType: game.player.characterType,
                x: game.player.x,
                y: game.player.y,
                hp: game.player.hp,
                maxHp: game.player.maxHp,
                atk: game.player.atk,
                def: game.player.def,
                spd: game.player.spd,
                baseSpd: game.player.baseSpd,
                level: game.player.level,
                exp: game.player.exp,
                expToLevel: game.player.expToLevel,
                skillMaxCooldown: game.player.skillMaxCooldown,
                gold: game.player.gold,
                keys: game.player.keys,
                items: game.player.items,
                weapon: game.player.weapon,
                armor: game.player.armor,
                enemiesKilled: game.player.enemiesKilled,
                eliteKills: game.player.eliteKills,
                damageTaken: game.player.damageTaken
            },
            floor: game.currentFloor,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    load() {
        const saved = localStorage.getItem(this.saveKey);
        if (!saved) return null;

        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }

    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }

    restoreGame(game, data) {
        if (!data || !data.player || typeof data.floor !== 'number') {
            return false;
        }

        game.currentFloor = data.floor;
        game.player = new Player(data.player.characterType);

        Object.assign(game.player, {
            hp: data.player.hp,
            maxHp: data.player.maxHp,
            atk: data.player.atk,
            def: data.player.def,
            spd: data.player.spd,
            baseSpd: data.player.baseSpd || game.player.baseSpd,
            level: data.player.level,
            exp: data.player.exp,
            expToLevel: data.player.expToLevel,
            skillMaxCooldown: data.player.skillMaxCooldown,
            gold: data.player.gold,
            keys: data.player.keys,
            items: data.player.items,
            weapon: data.player.weapon,
            armor: data.player.armor,
            enemiesKilled: data.player.enemiesKilled,
            eliteKills: data.player.eliteKills || 0,
            damageTaken: data.player.damageTaken
        });

        // Reset transient combat state
        game.player.speedBoostActive = false;
        game.player.speedBoostTimer = 0;
        game.player.invincible = false;
        game.player.invincibleTimer = 0;
        game.player.attackCooldown = 0;
        game.player.skillCooldown = 0;
        game.player.floorDamageTaken = 0;

        game.dungeon = new Dungeon(game.currentFloor);
        game.dungeon.generate();

        // Place player at start room (saved position may be inside a wall in regenerated dungeon)
        game.player.x = game.dungeon.startRoom.x * TILE_SIZE + TILE_SIZE;
        game.player.y = game.dungeon.startRoom.y * TILE_SIZE + TILE_SIZE;

        game.state = GAME_STATES.PLAYING;

        if (game.ui) {
            game.ui.hideAllMenus();
            game.ui.updateHUD();
        }

        return true;
    }
}

const saveSystem = new SaveSystem();
