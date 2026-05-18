class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.camera = { x: 0, y: 0 };
    }

    setCamera(x, y) {
        this.camera.x = x - CANVAS_WIDTH / 2;
        this.camera.y = y - CANVAS_HEIGHT / 2;
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            Math.floor(x - this.camera.x),
            Math.floor(y - this.camera.y),
            w, h
        );
    }

    drawStrokeRect(x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(
            Math.floor(x - this.camera.x),
            Math.floor(y - this.camera.y),
            w, h
        );
    }

    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            Math.floor(x - this.camera.x),
            Math.floor(y - this.camera.y),
            radius, 0, Math.PI * 2
        );
        this.ctx.fill();
    }

    drawText(text, x, y, color, size = 16, align = 'left') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px 'Courier New'`;
        this.ctx.textAlign = align;
        this.ctx.fillText(text, Math.floor(x - this.camera.x), Math.floor(y - this.camera.y));
    }

    drawPixelChar(x, y, color, size = TILE_SIZE) {
        const px = Math.floor(x - this.camera.x);
        const py = Math.floor(y - this.camera.y);
        const s = size / 8;

        this.ctx.fillStyle = color;
        // Simple pixel character
        this.ctx.fillRect(px + 2*s, py + 0*s, 4*s, 2*s); // head
        this.ctx.fillRect(px + 1*s, py + 2*s, 6*s, 4*s); // body
        this.ctx.fillRect(px + 1*s, py + 6*s, 2*s, 2*s); // left leg
        this.ctx.fillRect(px + 5*s, py + 6*s, 2*s, 2*s); // right leg
    }

    drawPixelEnemy(x, y, color, size = TILE_SIZE) {
        const px = Math.floor(x - this.camera.x);
        const py = Math.floor(y - this.camera.y);
        const s = size / 8;

        this.ctx.fillStyle = color;
        // Simple pixel enemy
        this.ctx.fillRect(px + 1*s, py + 0*s, 6*s, 3*s); // head
        this.ctx.fillRect(px + 0*s, py + 3*s, 8*s, 3*s); // body
        this.ctx.fillRect(px + 1*s, py + 6*s, 2*s, 2*s); // left leg
        this.ctx.fillRect(px + 5*s, py + 6*s, 2*s, 2*s); // right leg
    }
}
