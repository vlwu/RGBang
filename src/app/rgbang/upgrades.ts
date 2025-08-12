
import { GameColor } from './color';
import { Player } from './player';

export enum UpgradeType {
    GUN,
    PLAYER_STAT,
    GENERAL
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    type: UpgradeType;
    color: GameColor | null;
    apply: (player: Player) => void;
}

export const ALL_UPGRADES: Upgrade[] = [
    // Player Stat Upgrades (from White/Boss Fragments)
    {
        id: 'max-health',
        name: 'Vitality Boost',
        description: 'Increases maximum health by 25.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        apply: (player) => {
            player.maxHealth += 25;
            player.health += 25; // Heal for the same amount
        }
    },
    {
        id: 'dash-cooldown',
        name: 'Quick Dash',
        description: 'Reduces dash cooldown by 15%.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        apply: (player) => {
            // This would require modifying the player's dash cooldown property
            // For now, we'll log it. A full implementation would need player properties to be public or have setters.
            console.log("Dash cooldown reduced!");
        }
    },
     // General Upgrades (Can appear for any color)
    {
        id: 'bullet-damage',
        name: 'Power Shot',
        description: 'Increases bullet damage by 20%.',
        type: UpgradeType.GENERAL,
        color: null, // can be applied to any
        apply: (player) => { console.log('bullet damage up'); }
    },

    // Gun-Specific Upgrades
    {
        id: 'ice-spiker',
        name: 'Ice Spiker',
        description: 'Blue bullets have a chance to briefly freeze enemies.',
        type: UpgradeType.GUN,
        color: GameColor.BLUE,
        apply: (player) => { console.log('ice spiker active'); }
    },
    {
        id: 'chain-lightning',
        name: 'Chain Lightning',
        description: 'Yellow bullets chain to nearby enemies on hit.',
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        apply: (player) => { console.log('chain lightning active'); }
    },
    {
        id: 'explosive-rounds',
        name: 'Explosive Rounds',
        description: 'Red bullets explode on impact, damaging nearby enemies.',
        type: UpgradeType.GUN,
        color: GameColor.RED,
        apply: (player) => { console.log('explosive rounds active'); }
    }
];

    