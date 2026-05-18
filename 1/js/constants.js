const TILE_SIZE = 32;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_WIDTH = Math.floor(CANVAS_WIDTH / TILE_SIZE);
const GRID_HEIGHT = Math.floor(CANVAS_HEIGHT / TILE_SIZE);

const ROOM_SIZES = {
    small: { w: 5, h: 5 },
    medium: { w: 8, h: 8 },
    large: { w: 12, h: 12 }
};

const COLORS = {
    floor: '#2c3e50',
    wall: '#1a1a2e',
    door: '#8b4513',
    doorLocked: '#e74c3c',
    stairs: '#f39c12',
    player: '#3498db',
    enemy: '#e74c3c',
    elite: '#9b59b6',
    boss: '#c0392b',
    item: '#2ecc71',
    gold: '#f1c40f',
    chest: '#d35400',
    trap: '#e74c3c',
    obstacle: '#7f8c8d',
    shop: '#9b59b6'
};

const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

const ROOM_TYPES = {
    NORMAL: 'normal',
    BOSS: 'boss',
    SHOP: 'shop',
    TREASURE: 'treasure',
    TRAP: 'trap',
    EMPTY: 'empty',
    HIDDEN: 'hidden',
    STAIRS: 'stairs'
};

const ENEMY_TYPES = {
    CHASER: 'chaser',
    PATROL: 'patrol',
    RANGER: 'ranger'
};

const ITEM_TYPES = {
    HEALTH_POTION: 'health_potion',
    KEY: 'key',
    BOMB: 'bomb',
    TELEPORT: 'teleport',
    SHIELD: 'shield',
    SPEED: 'speed',
    WEAPON: 'weapon',
    ARMOR: 'armor'
};

const ACHIEVEMENT_TYPES = {
    FIRST_CLEAR: 'first_clear',
    ALL_CHARACTERS: 'all_characters',
    KILL_BOSS: 'kill_boss',
    NO_DAMAGE_FLOOR: 'no_damage_floor',
    COLLECT_ALL: 'collect_all',
    ELITE_KILLER: 'elite_killer'
};
