import { system, world } from '@minecraft/server'
import Utils from 'stickycore/utils'

let brokenBlockEventsThisTick = [];

system.runInterval(() => {
    brokenBlockEventsThisTick = [];
});

world.afterEvents.playerBreakBlock.subscribe(blockEvent => {
    if (!world.getDynamicProperty('autoItemPickup')) return;
    if (!blockEvent.player.getDynamicProperty('autoItemPickup')) return;
    if (blockEvent.player.getGameMode() === 'creative') return;
    brokenBlockEventsThisTick.push(blockEvent);
});

world.afterEvents.entitySpawn.subscribe(entityEvent => {
    if (entityEvent.cause !== 'Spawned' || entityEvent.entity.typeId !== 'minecraft:item') return;
    if (!world.getDynamicProperty('autoItemPickup')) return;

    const item = entityEvent.entity;
    let brokenBlockEvent;
    try {
        brokenBlockEvent = brokenBlockEventsThisTick.find(blockEvent => Utils.calcDistance(blockEvent.block.location, item.location) < 2);
    } catch {}
    if (!brokenBlockEvent) return;

    const itemStack = item.getComponent('minecraft:item').itemStack;
    const inventory = brokenBlockEvent.player.getComponent('minecraft:inventory').container;
    if (canAdd(inventory, itemStack)) {
        inventory.addItem(itemStack) // doesnt always put things in the right slot 🎉
        item.remove();
    }
});

function canAdd(inventory, itemStack) {
    if (inventory.emptySlotsCount !== 0) return true;
    for (let i = 0; i < inventory.size; i++) {
        const slot = inventory.getSlot(i);
        if (slot.hasItem() && slot.isStackableWith(itemStack) && isWithinStackSize(slot, itemStack)) return true;
    }
    return false;
}

function isWithinStackSize(slot, itemStack) {
    return slot.amount + itemStack.amount <= slot.maxAmount;
}

export default { brokenBlockEventsThisTick }
