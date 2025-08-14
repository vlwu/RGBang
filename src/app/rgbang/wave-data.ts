// src/app/rgbang/wave-data.ts

import { GameColor } from './color';

export enum EnemyType {
    RED_BLOB = 'RED_BLOB',
    BLUE_SHARD = 'BLUE_SHARD',
    CHROMA_SENTINEL = 'CHROMA_SENTINEL',
    MINI_BOSS_1 = 'MINI_BOSS_1',
    MAIN_BOSS_1 = 'MAIN_BOSS_1',
}

// Defines a single group of enemies to spawn within a wave
export interface EnemySpawnConfig {
    type: EnemyType;
    color?: GameColor; // Optional, can be 'random' for enemy types that support it
    count: number;
    delay?: number; // Delay in frames before this group starts spawning after wave begins
}

// Defines the configuration for a single wave
export interface WaveConfig {
    waveNumber: number;
    name: string; // E.g., "First Contact", "Color Shards"
    enemySpawnPatterns: EnemySpawnConfig[];
    bossType?: EnemyType.MINI_BOSS_1 | EnemyType.MAIN_BOSS_1; // Optional: if this is a boss wave
    nextWaveHint: string; // Hint for the next wave's challenge
    fragmentsAwarded: number; // Number of upgrade fragments awarded for completing this wave
    // Add other wave-specific modifiers here later (e.g., speedMultiplier, healthMultiplier)
}

// Define the full progression of waves
export const WAVE_CONFIGS: WaveConfig[] = [
    {
        waveNumber: 1,
        name: "First Contact",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, color: GameColor.RED, count: 5 },
            { type: EnemyType.RED_BLOB, color: GameColor.YELLOW, count: 5 },
            { type: EnemyType.RED_BLOB, color: GameColor.BLUE, count: 5 },
        ],
        nextWaveHint: "More enemies are adapting to your colors!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 2,
        name: "Color Echoes",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, color: GameColor.RED, count: 7 },
            { type: EnemyType.RED_BLOB, color: GameColor.YELLOW, count: 7 },
            { type: EnemyType.RED_BLOB, color: GameColor.BLUE, count: 7 },
        ],
        nextWaveHint: "Prepare for a new kind of threat!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 3,
        name: "Shifting Sands",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, color: GameColor.RED, count: 5 },
            { type: EnemyType.RED_BLOB, color: GameColor.YELLOW, count: 5 },
            { type: EnemyType.RED_BLOB, color: GameColor.BLUE, count: 5 },
            { type: EnemyType.BLUE_SHARD, color: GameColor.BLUE, count: 2, delay: 60 }, // Introduce Blue Shard
        ],
        nextWaveHint: "The assault intensifies. Watch out for reflections!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 4,
        name: "Reflective Gauntlet",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, count: 8 }, // Random color blobs
            { type: EnemyType.BLUE_SHARD, color: GameColor.BLUE, count: 4 },
            { type: EnemyType.BLUE_SHARD, color: GameColor.YELLOW, count: 2, delay: 120 },
        ],
        nextWaveHint: "A formidable opponent approaches. Focus your fire!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 5,
        name: "Mini-Boss: Sentinel Prime",
        enemySpawnPatterns: [], // Boss waves might not have regular spawns or limited ones
        bossType: EnemyType.MINI_BOSS_1,
        nextWaveHint: "The core challenge awaits. Master all colors!",
        fragmentsAwarded: 3, // More fragments for boss
    },
    {
        waveNumber: 6,
        name: "Chromatic Confusion",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, count: 10 },
            { type: EnemyType.BLUE_SHARD, count: 6 },
            { type: EnemyType.CHROMA_SENTINEL, count: 1, delay: 180 }, // Introduce Chroma Sentinel
        ],
        nextWaveHint: "Enemies are adapting faster now. Stay sharp!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 7,
        name: "Adaptive Onslaught",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, count: 12 },
            { type: EnemyType.BLUE_SHARD, count: 8 },
            { type: EnemyType.CHROMA_SENTINEL, count: 2, delay: 120 },
        ],
        nextWaveHint: "The final test nears. Prepare for the Prism Guardian!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 8,
        name: "Apex Predator",
        enemySpawnPatterns: [],
        bossType: EnemyType.MAIN_BOSS_1,
        nextWaveHint: "You've survived the worst. How long can you last?",
        fragmentsAwarded: 5, // Even more fragments for main boss
    },
    // Add more waves here to extend game length
    // Example for continuing after main boss:
    {
        waveNumber: 9,
        name: "Endless Surge I",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, count: 15 },
            { type: EnemyType.BLUE_SHARD, count: 10 },
            { type: EnemyType.CHROMA_SENTINEL, count: 3, delay: 60 },
        ],
        nextWaveHint: "The waves are endless. Max out your power!",
        fragmentsAwarded: 2, // Slightly more fragments for endless waves
    },
    {
        waveNumber: 10,
        name: "Endless Surge II",
        enemySpawnPatterns: [
            { type: EnemyType.RED_BLOB, count: 18 },
            { type: EnemyType.BLUE_SHARD, count: 12 },
            { type: EnemyType.CHROMA_SENTINEL, count: 4, delay: 30 },
        ],
        nextWaveHint: "Can you beat your high score?",
        fragmentsAwarded: 2,
    },
    // ... continue as needed
];

// Fallback wave if WAVE_CONFIGS index is out of bounds (for endless mode beyond defined waves)
export const FALLBACK_WAVE_CONFIG: WaveConfig = {
    waveNumber: 999, // Placeholder for endless
    name: "Endless Wave",
    enemySpawnPatterns: [
        { type: EnemyType.RED_BLOB, count: 20 },
        { type: EnemyType.BLUE_SHARD, count: 15 },
        { type: EnemyType.CHROMA_SENTINEL, count: 5 },
    ],
    nextWaveHint: "The waves are endless. How far can you go?",
    fragmentsAwarded: 2,
};