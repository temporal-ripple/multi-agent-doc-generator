const ITEMS = {
    [ITEM_TYPES.HEALTH_POTION]: {
        name: '血瓶',
        description: '恢复50点生命值',
        price: 30,
        icon: '❤️'
    },
    [ITEM_TYPES.KEY]: {
        name: '钥匙',
        description: '打开锁住的门',
        price: 50,
        icon: '🔑'
    },
    [ITEM_TYPES.BOMB]: {
        name: '炸弹',
        description: '对房间内所有敌人造成50点伤害',
        price: 80,
        icon: '💣'
    },
    [ITEM_TYPES.TELEPORT]: {
        name: '传送门',
        description: '传送到随机房间',
        price: 100,
        icon: '🌀'
    },
    [ITEM_TYPES.SHIELD]: {
        name: '护盾',
        description: '无敌3秒',
        price: 60,
        icon: '🛡️'
    },
    [ITEM_TYPES.SPEED]: {
        name: '加速',
        description: '移动速度提升50%，持续5秒',
        price: 40,
        icon: '⚡'
    },
    [ITEM_TYPES.WEAPON]: {
        name: '武器',
        description: '攻击力+5',
        price: 150,
        icon: '⚔️'
    },
    [ITEM_TYPES.ARMOR]: {
        name: '盔甲',
        description: '防御力+5',
        price: 150,
        icon: '🛡️'
    }
};

class Item {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.collected = false;
    }

    render(renderer) {
        if (this.collected) return;

        const item = ITEMS[this.type];
        renderer.drawText(
            item.icon,
            this.x + TILE_SIZE / 2,
            this.y + TILE_SIZE / 2,
            '#fff',
            20,
            'center'
        );
    }
}

function applyEquipment(player, type) {
    switch(type) {
        case ITEM_TYPES.WEAPON:
            player.atk += 5;
            player.weapon = type;
            break;
        case ITEM_TYPES.ARMOR:
            player.def += 5;
            player.armor = type;
            break;
    }
}
