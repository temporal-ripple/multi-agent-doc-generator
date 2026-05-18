const ACHIEVEMENTS = {
    [ACHIEVEMENT_TYPES.FIRST_CLEAR]: {
        name: '初次通关',
        description: '第一次通关游戏',
        reward: '解锁法师角色',
        unlockCharacter: 'mage'
    },
    [ACHIEVEMENT_TYPES.ALL_CHARACTERS]: {
        name: '全能战士',
        description: '使用所有角色通关',
        reward: '解锁游侠角色',
        unlockCharacter: 'ranger'
    },
    [ACHIEVEMENT_TYPES.KILL_BOSS]: {
        name: 'Boss猎手',
        description: '击杀10个Boss',
        reward: '成就徽章'
    },
    [ACHIEVEMENT_TYPES.NO_DAMAGE_FLOOR]: {
        name: '无伤通关',
        description: '单层无伤通关',
        reward: '成就徽章'
    },
    [ACHIEVEMENT_TYPES.COLLECT_ALL]: {
        name: '收藏家',
        description: '收集所有装备',
        reward: '成就徽章'
    },
    [ACHIEVEMENT_TYPES.ELITE_KILLER]: {
        name: '精英猎手',
        description: '击杀50个精英怪',
        reward: '成就徽章'
    }
};

class AchievementSystem {
    constructor() {
        this.unlocked = {};
        this.progress = {};
        this.collectedTypes = new Set();
        this.completedCharacters = new Set();

        this.load();
    }

    load() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const data = JSON.parse(saved);
            this.unlocked = data.unlocked || {};
            this.progress = data.progress || {};
            this.collectedTypes = new Set(data.collectedTypes || []);
            this.completedCharacters = new Set(data.completedCharacters || []);
        }
    }

    save() {
        localStorage.setItem('achievements', JSON.stringify({
            unlocked: this.unlocked,
            progress: this.progress,
            collectedTypes: Array.from(this.collectedTypes),
            completedCharacters: Array.from(this.completedCharacters)
        }));
    }

    trackItemCollection(type) {
        if (this.unlocked[ACHIEVEMENT_TYPES.COLLECT_ALL]) return;
        this.collectedTypes.add(type);
        this.progress[ACHIEVEMENT_TYPES.COLLECT_ALL] = this.collectedTypes.size;
        if (this.collectedTypes.size >= 8) {
            this.unlock(ACHIEVEMENT_TYPES.COLLECT_ALL);
        }
        this.save();
    }

    trackCharacterCompletion(characterType) {
        if (this.unlocked[ACHIEVEMENT_TYPES.ALL_CHARACTERS]) return;
        this.completedCharacters.add(characterType);
        this.progress[ACHIEVEMENT_TYPES.ALL_CHARACTERS] = this.completedCharacters.size;
        if (this.completedCharacters.size >= 4) {
            this.unlock(ACHIEVEMENT_TYPES.ALL_CHARACTERS);
        }
        this.save();
    }

    check(type, value = 1) {
        if (this.unlocked[type]) return;

        if (!this.progress[type]) {
            this.progress[type] = 0;
        }
        this.progress[type] += value;

        const achievement = ACHIEVEMENTS[type];
        let unlocked = false;

        switch(type) {
            case ACHIEVEMENT_TYPES.FIRST_CLEAR:
                unlocked = this.progress[type] >= 1;
                break;
            case ACHIEVEMENT_TYPES.ALL_CHARACTERS:
                unlocked = this.progress[type] >= 4; // 4 characters
                break;
            case ACHIEVEMENT_TYPES.KILL_BOSS:
                unlocked = this.progress[type] >= 10;
                break;
            case ACHIEVEMENT_TYPES.NO_DAMAGE_FLOOR:
                unlocked = this.progress[type] >= 1;
                break;
            case ACHIEVEMENT_TYPES.COLLECT_ALL:
                unlocked = this.progress[type] >= 8; // 8 item types
                break;
            case ACHIEVEMENT_TYPES.ELITE_KILLER:
                unlocked = this.progress[type] >= 50;
                break;
            default:
                unlocked = this.progress[type] >= 1;
        }

        if (unlocked) {
            this.unlock(type);
        }

        this.save();
    }

    unlock(type) {
        this.unlocked[type] = true;
        this.save();

        const achievement = ACHIEVEMENTS[type];
        console.log(`Achievement unlocked: ${achievement.name}`);

        // Show notification if game UI is available
        if (typeof game !== 'undefined' && game.ui) {
            game.ui.showAchievementNotification(achievement);
        }

        // Unlock character if reward
        if (achievement.unlockCharacter) {
            this.unlockCharacter(achievement.unlockCharacter);
        }
    }

    unlockCharacter(characterType) {
        let unlocked = JSON.parse(localStorage.getItem('unlockedCharacters') || '[]');
        if (!unlocked.includes(characterType)) {
            unlocked.push(characterType);
            localStorage.setItem('unlockedCharacters', JSON.stringify(unlocked));
        }
    }

    isUnlocked(type) {
        return this.unlocked[type] || false;
    }

    getProgress(type) {
        return this.progress[type] || 0;
    }

    render(renderer) {
        // Achievement display handled by UI
    }
}

const achievements = new AchievementSystem();
