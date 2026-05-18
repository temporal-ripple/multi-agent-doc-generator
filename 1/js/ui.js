class UI {
    constructor(game) {
        this.game = game;
        this.shop = new Shop();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.showCharacterSelect();
        });

        document.getElementById('btn-characters').addEventListener('click', () => {
            this.showCharacterSelect();
        });

        document.getElementById('btn-achievements').addEventListener('click', () => {
            this.showAchievements();
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            this.game.resume();
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            saveSystem.save(this.game);
            this.game.resume();
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.showCharacterSelect();
        });

        document.getElementById('btn-main-menu').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.game.state === GAME_STATES.PLAYING) {
                    this.game.pause();
                } else if (this.game.state === GAME_STATES.PAUSED) {
                    this.game.resume();
                }
            }

            // Item use (1-6 keys)
            if (this.game.state === GAME_STATES.PLAYING) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 6) {
                    this.game.player.useItem(num - 1);
                }
            }

            // Shop
            if (this.shop.isOpen) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9) {
                    this.shop.buyItem(num - 1, this.game.player);
                }
                if (e.code === 'Escape') {
                    this.shop.isOpen = false;
                }
            }
        });
    }

    showMainMenu() {
        this.hideAllMenus();
        document.getElementById('main-menu').classList.remove('hidden');
        this.game.state = GAME_STATES.MENU;
    }

    showCharacterSelect() {
        this.hideAllMenus();
        document.getElementById('character-select').classList.remove('hidden');
        this.renderCharacterList();
    }

    renderCharacterList() {
        const list = document.getElementById('character-list');
        list.innerHTML = '';

        const characters = [
            { type: 'warrior', name: '战士', desc: '高血量、高防御、低速度', locked: false },
            { type: 'assassin', name: '刺客', desc: '低血量、高攻击、高速度', locked: false },
            { type: 'mage', name: '法师', desc: '低血量、中等攻击、中等速度', locked: true },
            { type: 'ranger', name: '游侠', desc: '中等血量、中等攻击、高速度', locked: true }
        ];

        const unlocked = JSON.parse(localStorage.getItem('unlockedCharacters') || '[]');

        characters.forEach(char => {
            const isLocked = char.locked && !unlocked.includes(char.type);

            const card = document.createElement('div');
            card.className = `character-card ${isLocked ? 'locked' : ''}`;
            card.innerHTML = `
                <div class="character-name">${char.name}</div>
                <div class="character-desc">${char.desc}</div>
                ${isLocked ? '<div class="character-desc">🔒 通过成就解锁</div>' : ''}
            `;

            if (!isLocked) {
                card.addEventListener('click', () => {
                    this.game.startGame(char.type);
                });
            }

            list.appendChild(card);
        });
    }

    showPauseMenu() {
        this.hideAllMenus();
        document.getElementById('pause-menu').classList.remove('hidden');
    }

    showGameOver(floor) {
        this.hideAllMenus();
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-floor').textContent = floor;
    }

    showVictory() {
        achievements.check(ACHIEVEMENT_TYPES.FIRST_CLEAR);
        this.showGameOver(10);
        document.querySelector('#game-over h2').textContent = '恭喜通关！';
    }

    showAchievements() {
        // TODO: Implement achievement display
        console.log('Achievements:', achievements);
    }

    hideAllMenus() {
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    updateHUD() {
        if (!this.game.player) return;

        const player = this.game.player;

        document.getElementById('hp-value').textContent = Math.floor(player.hp);
        document.getElementById('hp-max').textContent = player.maxHp;
        document.getElementById('level-value').textContent = player.level;
        document.getElementById('gold-value').textContent = player.gold;
        document.getElementById('floor-value').textContent = this.game.currentFloor;

        // Update skill cooldown
        const cooldownPercent = (player.skillCooldown / player.skillMaxCooldown) * 100;
        document.getElementById('skill-cooldown').style.height = `${cooldownPercent}%`;

        // Update inventory
        this.updateInventory(player);
    }

    updateInventory(player) {
        const bar = document.getElementById('inventory-bar');
        bar.innerHTML = '';

        player.items.slice(0, 6).forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.textContent = ITEMS[item].icon;
            slot.title = `${ITEMS[item].name} (${index + 1})`;
            bar.appendChild(slot);
        });
    }
}
