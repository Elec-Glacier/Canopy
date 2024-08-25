import { Rule } from "lib/canopy/Canopy";
import { world } from "@minecraft/server";

new Rule({
    category: 'Rules',
    identifier: 'explosionChainReactionOnly',
    description: 'Makes explosion only affect TNT blocks.',
    independentRules: ['explosionNoBlockDamage', 'explosionOff']
});

world.beforeEvents.explosion.subscribe((event) => {
    if (!Rule.getNativeValue('explosionChainReactionOnly')) return;
    const explodedTntBlocks = event.getImpactedBlocks().filter(block => block.typeId === 'minecraft:tnt');
    event.setImpactedBlocks(explodedTntBlocks);
});