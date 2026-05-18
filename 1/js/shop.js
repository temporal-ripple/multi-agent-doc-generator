class Shop {
    constructor() {
        this.items = [];
        this.isOpen = false;
    }

    generateItems(floor) {
        this.items = [];

        const availableItems = [
            ITEM_TYPES.HEALTH_POTION,
            ITEM_TYPES.KEY,
            ITEM_TYPES.BOMB,
            ITEM_TYPES.SHIELD,
            ITEM_TYPES.SPEED
        ];

        // Shuffle and pick 3-5 unique items
        const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
        const count = randomInt(3, 5);
        for (let i = 0; i < count; i++) {
            const type = shuffled[i];
            this.items.push({
                type: type,
                price: ITEMS[type].price + floor * 10,
                sold: false
            });
        }

        // Maybe add equipment
        if (Math.random() < 0.3 + floor * 0.05) {
            const equipType = randomChoice([ITEM_TYPES.WEAPON, ITEM_TYPES.ARMOR]);
            this.items.push({
                type: equipType,
                price: ITEMS[equipType].price + floor * 20,
                sold: false
            });
        }
    }

    buyItem(index, player) {
        if (index < 0 || index >= this.items.length) return false;

        const item = this.items[index];
        if (item.sold) return false;

        // Check if player already has this equipment
        if (item.type === ITEM_TYPES.WEAPON && player.weapon) return false;
        if (item.type === ITEM_TYPES.ARMOR && player.armor) return false;

        if (player.gold >= item.price) {
            player.gold -= item.price;
            item.sold = true;

            if (item.type === ITEM_TYPES.WEAPON || item.type === ITEM_TYPES.ARMOR) {
                applyEquipment(player, item.type);
            } else {
                player.addItem(item.type);
            }

            return true;
        }

        return false;
    }

    render(renderer, player) {
        if (!this.isOpen) return;

        // Draw shop UI - adjust for camera
        const shopX = renderer.camera.x + 100;
        const shopY = renderer.camera.y + 100;
        const shopWidth = 600;
        const shopHeight = 400;

        renderer.drawRect(shopX, shopY, shopWidth, shopHeight, '#16213e');
        renderer.drawStrokeRect(shopX, shopY, shopWidth, shopHeight, '#3498db', 2);

        renderer.drawText('商店', shopX + shopWidth / 2, shopY + 30, '#f39c12', 24, 'center');
        renderer.drawText(`金币: ${player.gold}`, shopX + shopWidth - 20, shopY + 30, '#f1c40f', 16, 'right');

        // Draw items
        this.items.forEach((item, index) => {
            const itemY = shopY + 60 + index * 40;
            const itemInfo = ITEMS[item.type];

            renderer.drawRect(shopX + 20, itemY, shopWidth - 40, 35, item.sold ? '#555' : '#2c3e50');
            renderer.drawText(
                `${itemInfo.icon} ${itemInfo.name}`,
                shopX + 30, itemY + 22,
                item.sold ? '#999' : '#fff',
                14
            );
            renderer.drawText(
                itemInfo.description,
                shopX + 200, itemY + 22,
                '#95a5a6',
                12
            );
            renderer.drawText(
                `${item.price}G`,
                shopX + shopWidth - 30, itemY + 22,
                item.sold ? '#999' : '#f1c40f',
                14,
                'right'
            );
        });

        renderer.drawText('按数字键购买，ESC关闭', shopX + shopWidth / 2, shopY + shopHeight - 20, '#95a5a6', 12, 'center');
    }
}
