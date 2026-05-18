class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.state = GAME_STATES.MENU;
        this.currentFloor = 1;
        this.player = null;
        this.dungeon = null;
        this.renderer = null;
        this.ui = null;

        this.lastTime = 0;
        this.deltaTime = 0;

        this.init();
    }

    init() {
        this.renderer = new Renderer(this.ctx);
        this.ui = new UI(this);
        this.ui.showMainMenu();
        this.gameLoop(0);
    }

    startGame(characterType) {
        this.state = GAME_STATES.PLAYING;
        this.currentFloor = 1;
        this.player = new Player(characterType);
        this.dungeon = new Dungeon(this.currentFloor);
        this.dungeon.generate();
        this.player.x = this.dungeon.startRoom.x * TILE_SIZE + TILE_SIZE;
        this.player.y = this.dungeon.startRoom.y * TILE_SIZE + TILE_SIZE;
        this.ui.hideAllMenus();
        this.ui.updateHUD();
    }

    gameLoop(timestamp) {
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.state === GAME_STATES.PLAYING) {
            this.update();
        }

        this.render();
        input.clearJustPressed();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        this.player.update(this.deltaTime, this.dungeon);
        this.dungeon.update(this.deltaTime, this.player);
        this.ui.updateHUD();
    }

    render() {
        this.renderer.clear();

        if (this.state === GAME_STATES.PLAYING) {
            this.dungeon.render(this.renderer, this.player);
            this.player.render(this.renderer);
        }
    }

    nextFloor() {
        this.currentFloor++;
        if (this.currentFloor > 10) {
            this.victory();
            return;
        }
        this.dungeon = new Dungeon(this.currentFloor);
        this.dungeon.generate();
        this.player.x = this.dungeon.startRoom.x * TILE_SIZE + TILE_SIZE;
        this.player.y = this.dungeon.startRoom.y * TILE_SIZE + TILE_SIZE;
        this.ui.updateHUD();
    }

    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        this.ui.showGameOver(this.currentFloor);
    }

    victory() {
        this.state = GAME_STATES.VICTORY;
        this.ui.showVictory();
    }

    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.ui.showPauseMenu();
        }
    }

    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.ui.hideAllMenus();
        }
    }
}

const game = new Game();
