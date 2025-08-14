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
    // Player Stat Upgrades
    {
        id: 'max-health',
        name: 'Vitality Boost',
        description: 'Increases maximum health by 20 per level.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 20 * level,
        apply: (player, level) => {
            player.flatHealthIncrease += 20;
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
    {
        id: 'vampirism',
        name: 'Vampirism',
        description: 'Heal for a small percentage of damage dealt.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level * 0.02,
        apply: (player) => {
            player.lifestealPercent += 0.02; // 2% lifesteal per level
        }
    },
    {
        id: 'resilience',
        name: 'Resilience',
        description: 'Reduces all incoming damage by a flat amount.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.flatDamageReduction += 1;
        }
    },
    {
        id: 'adrenaline-rush',
        name: 'Adrenaline Rush',
        description: 'After taking damage, gain a short burst of speed and fire rate.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.adrenalineRushLevel += 1;
        }
    },
    {
        id: 'kinetic-shielding',
        name: 'Kinetic Shielding',
        description: 'Dashing grants a temporary shield that absorbs one hit.',
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.kineticShieldLevel += 1;
        }
    },

    // General Upgrades
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
        description: 'Increases score gained from enemies by 20% per level.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.2 * level),
        apply: (player, level) => {
            player.scoreMultiplier *= 1.2;
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
    {
        id: 'fragment-duplication',
        name: 'Fragment Duplication',
        description: 'Enemies have a small chance to drop an extra fragment.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 3,
        getValue: (level) => level * 0.05,
        apply: (player) => {
            player.fragmentDuplicationChance += 0.05; // 5% chance per level
        }
    },
    {
        id: 'punishment-reversal',
        name: 'Punishment Reversal',
        description: 'Wrong hits build a meter. When full, the next correct hit deals massive bonus damage.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 3,
        getValue: (level) => 50 * level,
        apply: (player) => {
            player.punishmentReversalLevel += 1;
        }
    },
    {
        id: 'bullet-penetration',
        name: 'Bullet Penetration',
        description: 'Your bullets have a chance to pierce through enemies.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.bulletPenetrationLevel += 1;
        }
    },
    {
        id: 'explosive-finish',
        name: 'Explosive Finish',
        description: 'Enemies have a chance to explode on death, damaging nearby foes.',
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.explosiveFinishLevel += 1;
        }
    },

    // Gun-Specific Upgrades
    {
        id: 'ice-spiker',
        name: 'Ice Spiker',
        description: 'Blue bullets freeze enemies, duration and power increase with level.',
        type: UpgradeType.GUN,
        color: GameColor.BLUE,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.iceSpikerLevel += 1; }
    },
    {
        id: 'chain-lightning',
        name: 'Chain Lightning',
        description: 'Yellow bullets chain to more enemies with more damage per level.',
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.chainLightningLevel += 1; }
    },
    {
        id: 'ricochet-rounds',
        name: 'Ricochet Rounds',
        description: 'Yellow bullets bounce off surfaces and enemies.',
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.ricochetRoundsLevel += 1;
        }
    },
    {
        id: 'ignite',
        name: 'Ignite',
        description: 'Red bullets set enemies on fire, damage and duration increase per level.',
        type: UpgradeType.GUN,
        color: GameColor.RED,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.igniteLevel += 1; }
    },
    {
        id: 'seeking-shards',
        name: 'Seeking Shards',
        description: 'Red bullets slightly home-in on nearby targets.',
        type: UpgradeType.GUN,
        color: GameColor.RED,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.seekingShardsLevel += 1;
        }
    },
    {
        id: 'growth-catalyst',
        name: 'Growth Catalyst',
        description: 'Green bullets leave a trail that slows enemies.',
        type: UpgradeType.GUN,
        color: GameColor.GREEN,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.slowingTrailLevel += 1;
        }
    },
    {
        id: 'fission-catalyst',
        name: 'Fission Catalyst',
        description: 'Orange bullets can split into their primary components on impact.',
        type: UpgradeType.GUN,
        color: GameColor.ORANGE,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.fissionLevel += 1;
        }
    },
    {
        id: 'void-catalyst',
        name: 'Void Catalyst',
        description: 'Purple bullets can strip an enemy\'s color, making them vulnerable to all primary colors.',
        type: UpgradeType.GUN,
        color: GameColor.PURPLE,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.voidLevel += 1;
        }
    },
    {
        id: 'gravity-well',
        name: 'Gravity Well',
        description: 'Purple bullets create a vortex on hit, pulling in nearby enemies.',
        type: UpgradeType.GUN,
        color: GameColor.PURPLE,
        getMaxLevel: () => 3,
        getValue: (level) => level,
        apply: (player) => {
            player.gravityWellLevel += 1;
        }
    },
];