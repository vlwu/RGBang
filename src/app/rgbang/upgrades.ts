
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
    apply: (player: Player, level: number) => void;
    getValue: (level: number) => number;
    getMaxLevel: () => number;
}

export const ALL_UPGRADES: Upgrade[] = [
    // --- PLAYER_STAT Upgrades (from White/Boss Fragments) ---
    {
        id: 'max-health',
        name: 'Vitality Boost',
        description: 'Increases maximum health by 20 per level.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 20 * level,
        apply: (player, level) => {
            player.flatHealthIncrease += 20; // This is additive
            player.health += 20; // Heal for the same amount
        }
    },
    {
        id: 'dash-cooldown',
        name: 'Quick Dash',
        description: 'Reduces dash cooldown by 8% per level.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 - (0.08 * level),
        apply: (player, level) => {
            player.dashCooldownModifier *= 0.92;
        }
    },
     {
        id: 'movement-speed',
        name: 'Agility',
        description: 'Increases movement speed by 5% per level.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.05 * level),
        apply: (player, level) => {
            player.movementSpeedMultiplier *= 1.05;
        }
    },

    // --- GENERAL Upgrades (Can appear for any color) ---
    {
        id: 'bullet-damage',
        name: 'Power Shot',
        description: 'Increases all bullet damage by 10% per level.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.1 * level),
        apply: (player, level) => { 
            player.bulletDamageMultiplier *= 1.10;
        }
    },
    {
        id: 'faster-reload',
        name: 'Quick Hands',
        description: 'Increases fire rate by 10% per level.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 - (0.1 * level),
        apply: (player, level) => {
            player.shootCooldownModifier *= 0.9;
        }
    },
    {
        id: 'prism-exp-gain',
        name: 'Prism Magnetism',
        description: 'Increases EXP gained from fragments by 20% per level.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.2 * level),
        apply: (player, level) => {
            player.expGainMultiplier *= 1.2;
        }
    },
    {
        id: 'accuracy',
        name: 'Focus',
        description: 'Improves bullet accuracy by 15% per level.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 - (0.15 * level),
        apply: (player, level) => {
            player.accuracyModifier *= 0.85;
        }
    },


    // --- GUN-Specific Upgrades ---
    {
        id: 'ice-spiker',
        name: 'Ice Spiker',
        description: 'Blue bullets briefly freeze enemies on hit.',
        type: UpgradeType.GUN,
        color: GameColor.BLUE,
        getMaxLevel: () => 1,
        getValue: () => 1,
        apply: (player) => { player.hasIceSpiker = true; }
    },
    {
        id: 'chain-lightning',
        name: 'Chain Lightning',
        description: 'Yellow bullets chain to a nearby enemy on hit.',
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        getMaxLevel: () => 1,
        getValue: () => 1,
        apply: (player) => { player.hasChainLightning = true; }
    },
    {
        id: 'ignite',
        name: 'Ignite',
        description: 'Red bullets set enemies on fire, dealing damage over time.',
        type: UpgradeType.GUN,
        color: GameColor.RED,
        getMaxLevel: () => 1,
        getValue: () => 1,
        apply: (player) => { player.hasIgnite = true; }
    }
];
