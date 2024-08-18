import { Rule } from "lib/canopy/Canopy";
import { system, world } from '@minecraft/server';
import HotbarManager from 'src/classes/HotbarManager';

new Rule({
    category: 'Rules',
    identifier: 'hotbarSwitching',
    description: 'Allows for quick switching between multiple hotbars. Put an arrow in the top right of your inventory, then sneak and scroll to switch.',
});

new Rule({
    category: 'Rules',
    identifier: 'hotbarSwitchingSurvival',
    description: 'Enables hotbarSwitching for survival mode.',
    contingentRules: ['hotbarSwitching'],
});

const ARROW_SLOT = 17;
const lastSelectedSlots = {};
const lastLoadedSlots = {};
const hotbarManagers = {};

system.runInterval(async () => {
    if (!await Rule.getValue('hotbarSwitching')) return;
    const players = world.getAllPlayers();
    for (const player of players) {
        if (!await hasAppropriateGameMode(player)) continue;
        if (hotbarManagers[player.id] === undefined) 
            hotbarManagers[player.id] = new HotbarManager(player);
        processHotbarSwitching(player);
    }
});

async function hasAppropriateGameMode(player) {
    return await Rule.getValue('hotbarSwitchingSurvival') || player.getGameMode() === 'creative';
}

async function processHotbarSwitching(player) {
    if (lastSelectedSlots[player.id] !== undefined && (!hasArrowInCorrectSlot(player) || !await hasAppropriateGameMode(player))) {
        delete lastSelectedSlots[player.id];
        return;
    } else if (lastSelectedSlots[player.id] === undefined && (!hasArrowInCorrectSlot(player) || !await hasAppropriateGameMode(player))) {
        return;
    }
    if (hasScrolled(player) && player.isSneaking) {
        switchToHotbar(player, player.selectedSlotIndex);
    }
    lastSelectedSlots[player.id] = player.selectedSlotIndex;
}

function switchToHotbar(player, index) {
    if (lastLoadedSlots[player.id] === undefined) 
        lastLoadedSlots[player.id] = lastSelectedSlots[player.id];    
    const hotbarMgr = hotbarManagers[player.id];
    hotbarMgr.saveHotbar(lastLoadedSlots[player.id]);
    hotbarMgr.loadHotbar(index)
    lastLoadedSlots[player.id] = index;
    player.onScreenDisplay.setActionBar(`§a${index + 1}`);
}

function hasArrowInCorrectSlot(player) {
    const container = player.getComponent('inventory')?.container;
    return container?.getItem(ARROW_SLOT)?.typeId === 'minecraft:arrow';
}

function hasScrolled(player) {
    return player.selectedSlotIndex !== lastSelectedSlots[player.id];
}
