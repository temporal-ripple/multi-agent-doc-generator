class Input {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            const gameKeys = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyQ','KeyE'];
            if (gameKeys.includes(e.code)) e.preventDefault();
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            this.justPressed = {};
            this.mouse.clicked = false;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('click', (e) => {
            this.mouse.clicked = true;
        });
    }

    isKeyDown(code) {
        return this.keys[code] || false;
    }

    isKeyJustPressed(code) {
        return this.justPressed[code] || false;
    }

    clearJustPressed() {
        this.justPressed = {};
        this.mouse.clicked = false;
    }

    getDirection() {
        let dx = 0, dy = 0;
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) dy = -1;
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) dy = 1;
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) dx = -1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) dx = 1;
        return { dx, dy };
    }
}

const input = new Input();
