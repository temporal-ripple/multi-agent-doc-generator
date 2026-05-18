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
                level: game.player.level,
                exp: game.player.exp,
                gold: game.player.gold,
                keys: game.player.keys,
                items: game.player.items,
                weapon: game.player.weapon,
                armor: game.player.armor,
                enemiesKilled: game.player.enemiesKilled,
                damageTaken: game.player.damageTaken
            },
            floor: game.currentFloor,
            timestamp: Date.now()
        };

        localStorage.setItem(this.saveKey, JSON.stringify(data));
        return true;
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
        game.currentFloor = data.floor;
        game.player = new Player(data.player.characterType);

        Object.assign(game.player, {
            x: data.player.x,
            y: data.player.y,
            hp: data.player.hp,
            maxHp: data.player.maxHp,
            atk: data.player.atk,
            def: data.player.def,
            spd: data.player.spd,
            level: data.player.level,
            exp: data.player.exp,
            gold: data.player.gold,
            keys: data.player.keys,
            items: data.player.items,
            weapon: data.player.weapon,
            armor: data.player.armor,
            enemiesKilled: data.player.enemiesKilled,
            damageTaken: data.player.damageTaken
        });

        game.dungeon = new Dungeon(game.currentFloor);
        game.dungeon.generate();
        game.state = GAME_STATES.PLAYING;
    }
}

const saveSystem = new SaveSystem();
