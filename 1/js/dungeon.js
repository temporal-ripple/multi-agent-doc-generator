class Dungeon {
    constructor(floor) {
        this.floor = floor;
        this.rooms = [];
        this.corridors = [];
        this.startRoom = null;
        this.bossRoom = null;
        this.shopRoom = null;
        this.stairsRoom = null;
        this.grid = [];
    }

    generate() {
        this.rooms = [];
        this.corridors = [];

        // Initialize grid
        for (let y = 0; y < GRID_HEIGHT * 2; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_WIDTH * 2; x++) {
                this.grid[y][x] = 0;
            }
        }

        // Generate rooms
        const roomCount = randomInt(8, 12);
        let attempts = 0;

        while (this.rooms.length < roomCount && attempts < 100) {
            const size = this.getRandomRoomSize();
            const x = randomInt(1, GRID_WIDTH * 2 - size.w - 1);
            const y = randomInt(1, GRID_HEIGHT * 2 - size.h - 1);

            const room = new Room(x, y, size.w, size.h);

            if (!this.roomOverlaps(room)) {
                this.rooms.push(room);
                this.markRoom(room);
            }
            attempts++;
        }

        // Assign room types
        this.assignRoomTypes();

        // Connect rooms
        this.connectRooms();

        // Generate content
        this.rooms.forEach(room => room.generateContent(this.floor));
    }

    getRandomRoomSize() {
        const sizes = Object.values(ROOM_SIZES);
        return randomChoice(sizes);
    }

    roomOverlaps(newRoom) {
        for (const room of this.rooms) {
            if (newRoom.x < room.x + room.width + 2 &&
                newRoom.x + newRoom.width + 2 > room.x &&
                newRoom.y < room.y + room.height + 2 &&
                newRoom.y + newRoom.height + 2 > room.y) {
                return true;
            }
        }
        return false;
    }

    markRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.grid[y][x] = 1;
            }
        }
    }

    assignRoomTypes() {
        // First room is start
        this.startRoom = this.rooms[0];
        this.startRoom.type = ROOM_TYPES.EMPTY;

        // Last room is boss
        this.bossRoom = this.rooms[this.rooms.length - 1];
        this.bossRoom.type = ROOM_TYPES.BOSS;

        // Random room is shop
        const shopIndex = randomInt(2, this.rooms.length - 2);
        this.shopRoom = this.rooms[shopIndex];
        this.shopRoom.type = ROOM_TYPES.SHOP;

        // Random room is treasure
        const treasureIndex = randomInt(1, this.rooms.length - 2);
        if (treasureIndex !== shopIndex) {
            this.rooms[treasureIndex].type = ROOM_TYPES.TREASURE;
        }

        // Random room is trap
        const trapIndex = randomInt(1, this.rooms.length - 2);
        if (trapIndex !== shopIndex && trapIndex !== treasureIndex) {
            this.rooms[trapIndex].type = ROOM_TYPES.TRAP;
        }
    }

    connectRooms() {
        // Connect each room to nearest unconnected room
        const connected = new Set();
        connected.add(0);

        while (connected.size < this.rooms.length) {
            let bestDist = Infinity;
            let bestFrom = -1;
            let bestTo = -1;

            for (const from of connected) {
                for (let to = 0; to < this.rooms.length; to++) {
                    if (connected.has(to)) continue;

                    const dist = this.roomDistance(this.rooms[from], this.rooms[to]);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestFrom = from;
                        bestTo = to;
                    }
                }
            }

            if (bestTo !== -1) {
                connected.add(bestTo);
                this.createCorridor(this.rooms[bestFrom], this.rooms[bestTo]);
            }
        }
    }

    roomDistance(room1, room2) {
        const c1 = room1.getCenter();
        const c2 = room2.getCenter();
        return distance(c1.x, c1.y, c2.x, c2.y);
    }

    createCorridor(room1, room2) {
        const c1 = room1.getCenter();
        const c2 = room2.getCenter();

        let x = Math.floor(c1.x / TILE_SIZE);
        let y = Math.floor(c1.y / TILE_SIZE);
        const targetX = Math.floor(c2.x / TILE_SIZE);
        const targetY = Math.floor(c2.y / TILE_SIZE);

        // L-shaped corridor
        while (x !== targetX) {
            x += x < targetX ? 1 : -1;
            if (x >= 0 && x < GRID_WIDTH * 2 && y >= 0 && y < GRID_HEIGHT * 2) {
                this.grid[y][x] = 2; // corridor
            }
        }
        while (y !== targetY) {
            y += y < targetY ? 1 : -1;
            if (x >= 0 && x < GRID_WIDTH * 2 && y >= 0 && y < GRID_HEIGHT * 2) {
                this.grid[y][x] = 2;
            }
        }

        this.corridors.push({ from: room1, to: room2 });
    }

    getRoomAt(x, y) {
        const gridX = Math.floor(x / TILE_SIZE);
        const gridY = Math.floor(y / TILE_SIZE);

        for (const room of this.rooms) {
            if (gridX >= room.x && gridX < room.x + room.width &&
                gridY >= room.y && gridY < room.y + room.height) {
                return room;
            }
        }
        return null;
    }

    isWalkable(x, y) {
        const gridX = Math.floor(x / TILE_SIZE);
        const gridY = Math.floor(y / TILE_SIZE);

        if (gridX < 0 || gridX >= GRID_WIDTH * 2 ||
            gridY < 0 || gridY >= GRID_HEIGHT * 2) {
            return false;
        }

        return this.grid[gridY][gridX] > 0;
    }

    update(deltaTime, player) {
        this.rooms.forEach(room => {
            if (room.visited) {
                room.update(deltaTime, player);
            }
        });
    }

    render(renderer, player) {
        // Set camera to follow player
        renderer.setCamera(player.x, player.y);

        // Render corridors first (under rooms)
        this.renderCorridors(renderer);

        // Render visible rooms
        this.rooms.forEach(room => {
            const center = room.getCenter();
            const dist = distance(player.x, player.y, center.x, center.y);

            if (dist < CANVAS_WIDTH) {
                room.render(renderer);

                // Render enemies
                room.enemies.forEach(enemy => {
                    enemy.render(renderer);
                });

                // Mark as visited
                if (!room.visited) {
                    room.visited = true;
                }
            }
        });
    }

    renderCorridors(renderer) {
        for (let y = 0; y < GRID_HEIGHT * 2; y++) {
            for (let x = 0; x < GRID_WIDTH * 2; x++) {
                if (this.grid[y][x] === 2) {
                    renderer.drawRect(
                        x * TILE_SIZE, y * TILE_SIZE,
                        TILE_SIZE, TILE_SIZE,
                        COLORS.floor
                    );
                }
            }
        }
    }
}
