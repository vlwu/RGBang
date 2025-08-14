// src/app/rgbang/upgrades.ts
import { GameColor } from './color';
import { Player } from './player';

export enum UpgradeType {
    GUN,
    PLAYER_STAT,
    GENERAL
}

export interface UpgradeProgress {
    level: number;
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    type: UpgradeType;
    color: GameColor | null;
    apply: (player: Player, level: number, addScore?: (amount: number) => void) => void;
    getValue: (level: number) => number;
    getMaxLevel: () => number;
}

export const ALL_UPGRADES: Upgrade[] = [

    {
        id: 'max-health',
        name: 'Vitality Boost',
        description: 'Increases maximum health by 20 per level.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 20 * level,
        apply: (player, level) => {
            player.flatHealthIncrease += 20 * level;
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
            player.dashCooldownModifier *= Math.pow(0.92, level);
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
            player.movementSpeedMultiplier *= Math.pow(1.05, level);
        }
    },


    {
        id: 'bullet-damage',
        name: 'Power Shot',
        description: 'Increases all bullet damage by 10% per level.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.1 * level),
        apply: (player, level) => {
            player.bulletDamageMultiplier *= Math.pow(1.10, level);
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
            player.shootCooldownModifier *= Math.pow(0.9, level);
        }
    },
    {
        id: 'prism-exp-gain',
        name: 'Prism Magnetism',
        description: 'Increases score gained from enemies by 20% per level.', // MODIFIED DESCRIPTION
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.2 * level),
        apply: (player, level) => {
            player.scoreMultiplier *= Math.pow(1.2, level); // MODIFIED: Apply to scoreMultiplier
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
            player.accuracyModifier *= Math.pow(0.85, level);
        }
    },



    {
        id: 'ice-spiker',
        name: 'Ice Spiker',
        description: 'Blue bullets freeze enemies, duration and power increase with level.',
        type: UpgradeType.GUN,
        color: GameColor.BLUE,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.iceSpikerLevel += level; }
    },
    {
        id: 'chain-lightning',
        name: 'Chain Lightning',
        description: 'Yellow bullets chain to more enemies with more damage per level.',
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.chainLightningLevel += level; }
    },
    {
        id: 'ignite',
        name: 'Ignite',
        description: 'Red bullets set enemies on fire, damage and duration increase per level.',
        type: UpgradeType.GUN,
        color: GameColor.RED,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.igniteLevel += level; }
    }
];