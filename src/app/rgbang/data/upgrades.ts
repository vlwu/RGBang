import { GameColor } from './color';
import { Player } from '../entities/player';

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
    getEffectDescription?: (level: number) => string;
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
        description: 'Increases your maximum health.',
        getEffectDescription: (level) => `+${20 * level} Max HP`,
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
        description: 'Reduces the cooldown of your dash ability.',
        getEffectDescription: (level) => `${8 * level}% Cooldown Reduction`,
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 - (0.08 * level),
        apply: (player, level) => {
            player.dashCooldownModifier *= 0.92;
        }
    },
    {
        id: 'dash-length',
        name: 'Extended Dash',
        description: 'Increases the distance and duration of your dash.',
        getEffectDescription: (level) => `+${level * 10}% Dash Duration`,
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + (0.1 * level),
        apply: (player, level) => {
            player.dashDurationModifier += 0.1;
        }
    },
    {
        id: 'dash-damage',
        name: 'Kinetic Impact',
        description: 'Dashing through enemies damages them.',
        getEffectDescription: (level) => `Deals ${15 * level} damage on impact`,
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 15 * level,
        apply: (player, level) => {
            player.dashDamageLevel += 1;
        }
    },
     {
        id: 'movement-speed',
        name: 'Agility',
        description: 'Increases your overall movement speed.',
        getEffectDescription: (level) => `+${5 * level}% Movement Speed`,
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
        description: 'Heal for a percentage of the damage you deal.',
        getEffectDescription: (level) => `${level * 2}% Lifesteal`,
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level * 0.02,
        apply: (player) => {
            player.lifestealPercent += 0.02;
        }
    },
    {
        id: 'resilience',
        name: 'Resilience',
        description: 'Reduces all incoming damage by a flat amount.',
        getEffectDescription: (level) => `-${level} Damage Taken`,
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
        description: 'After taking damage, gain a burst of speed and fire rate.',
        getEffectDescription: (level) => `+${level*12}% Speed/Fire Rate for ${2 + level}s`,
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.adrenalineRushLevel += 1;
        }
    },
    {
        id: 'kinetic-shielding',
        name: 'Kinetic Shielding',
        description: 'Dashing grants a temporary shield that absorbs hits.',
        getEffectDescription: (level) => `Absorbs ${level} hit(s)`,
        type: UpgradeType.PLAYER_STAT,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.kineticShieldLevel += 1;
        }
    },


    {
        id: 'bullet-damage',
        name: 'Power Shot',
        description: 'Increases damage for all your projectiles.',
        getEffectDescription: (level) => `+${10 * level}% Bullet Damage`,
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
        description: 'Increases fire rate for all weapons.',
        getEffectDescription: (level) => `+${10 * level}% Fire Rate`,
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 - (0.1 * level),
        apply: (player, level) => {
            player.shootCooldownModifier *= 0.9;
        }
    },
    {
        id: 'prism-attraction',
        name: 'Prism Attraction',
        description: 'Increases the pickup range for fragments.',
        getEffectDescription: (level) => `+${20 * level}% Pickup Range`,
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 1 + 0.2 * level,
        apply: (player, level) => {
            player.prismAttractionRadius *= 1.2;
        },
    },
    {
        id: 'accuracy',
        name: 'Focus',
        description: 'Improves bullet accuracy by reducing spread.',
        getEffectDescription: (level) => `+${15 * level}% Accuracy`,
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
        description: 'Enemies have a chance to drop an extra fragment.',
        getEffectDescription: (level) => `${level * 5}% Duplication Chance`,
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level * 0.05,
        apply: (player) => {
            player.fragmentDuplicationChance += 0.05;
        }
    },
    {
        id: 'punishment-reversal',
        name: 'Punishment Reversal',
        description: 'Wrong hits build a meter for a powerful counter-attack.',
        getEffectDescription: (level) => `+${50 * level} Bonus Damage`,
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => 50 * level,
        apply: (player) => {
            player.punishmentReversalLevel += 1;
        }
    },
    {
        id: 'bullet-penetration',
        name: 'Bullet Penetration',
        description: 'Your bullets can pierce through enemies.',
        getEffectDescription: (level) => `Pierces ${level} enemy/ies`,
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
        description: 'Enemies have a chance to explode on death.',
        getEffectDescription: (level) => `${level*8}% chance for AoE`,
        type: UpgradeType.GENERAL,
        color: null,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.explosiveFinishLevel += 1;
        }
    },


    {
        id: 'ice-spiker',
        name: 'Ice Spiker',
        description: 'Increases the freeze duration of Blue bullets.',
        getEffectDescription: (level) => `+${level * 0.25}s Freeze Duration`,
        type: UpgradeType.GUN,
        color: GameColor.BLUE,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.iceSpikerLevel += 1; }
    },
    {
        id: 'chain-lightning',
        name: 'Chain Lightning',
        description: 'Improves the chain lightning from Yellow bullets.',
        getEffectDescription: (level) => `+${level} chains, +${5*level} dmg, +${20*level} range`,
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player, level) => { player.chainLightningLevel += 1; }
    },
    {
        id: 'ricochet-rounds',
        name: 'Ricochet Rounds',
        description: 'Allows Yellow bullets to bounce off surfaces.',
        getEffectDescription: (level) => `Bounces ${level} time(s)`,
        type: UpgradeType.GUN,
        color: GameColor.YELLOW,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.ricochetRoundsLevel += 1;
        }
    },
    {
        id: 'ignite',
        name: 'Ignite',
        description: 'Improves the damage over time of Red bullets.',
        getEffectDescription: (level) => `+${level} damage, +${0.5 * level}s duration`,
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
        getEffectDescription: (level) => `+${level * 10}% Homing Strength`,
        type: UpgradeType.GUN,
        color: GameColor.RED,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.seekingShardsLevel += 1;
        }
    },
    {
        id: 'growth-catalyst',
        name: 'Growth Catalyst',
        description: 'Improves the slowing area from Green bullets.',
        getEffectDescription: (level) => `+${0.5 * level}s duration, +${10 * level} radius`,
        type: UpgradeType.GUN,
        color: GameColor.GREEN,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.slowingTrailLevel += 1;
        }
    },
    {
        id: 'fission-catalyst',
        name: 'Fission Catalyst',
        description: 'Increases the chance for Orange bullets to split on impact.',
        getEffectDescription: (level) => `+${level * 15}% Split Chance`,
        type: UpgradeType.GUN,
        color: GameColor.ORANGE,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.fissionLevel += 1;
        }
    },
    {
        id: 'void-catalyst',
        name: 'Void Catalyst',
        description: 'Purple bullets can strip an enemy\'s color.',
        getEffectDescription: (level) => `Color strip for ${2 + level}s`,
        type: UpgradeType.GUN,
        color: GameColor.PURPLE,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.voidLevel += 1;
        }
    },
    {
        id: 'gravity-well',
        name: 'Gravity Well',
        description: 'Improves the vortex from Purple bullets.',
        getEffectDescription: (level) => `+${15 * level} radius, +${0.1 * level} strength`,
        type: UpgradeType.GUN,
        color: GameColor.PURPLE,
        getMaxLevel: () => 5,
        getValue: (level) => level,
        apply: (player) => {
            player.gravityWellLevel += 1;
        }
    },
];