import { GameColor } from './color';

export enum EnemyType {
    RED_BLOB = 'RED_BLOB',
    BLUE_SHARD = 'BLUE_SHARD',
    CHROMA_SENTINEL = 'CHROMA_SENTINEL',
    MINI_BOSS_1 = 'MINI_BOSS_1',
    MAIN_BOSS_1 = 'MAIN_BOSS_1',
}

export const ENEMY_COSTS: Record<EnemyType, number> = {
    [EnemyType.RED_BLOB]: 5,
    [EnemyType.BLUE_SHARD]: 10,
    [EnemyType.CHROMA_SENTINEL]: 25,
    [EnemyType.MINI_BOSS_1]: 0, // Not spawned procedurally
    [EnemyType.MAIN_BOSS_1]: 0, // Not spawned procedurally
};

const ENEMY_UNLOCK_WAVE: Record<EnemyType, number> = {
    [EnemyType.RED_BLOB]: 1,
    [EnemyType.BLUE_SHARD]: 3,
    [EnemyType.CHROMA_SENTINEL]: 6,
    [EnemyType.MINI_BOSS_1]: 999, // Arbitrarily high to prevent procedural spawn
    [EnemyType.MAIN_BOSS_1]: 999,
};

function getAvailableEnemies(waveNumber: number): EnemyType[] {
    return (Object.keys(ENEMY_UNLOCK_WAVE) as EnemyType[]).filter(
        type => waveNumber >= ENEMY_UNLOCK_WAVE[type] && ENEMY_COSTS[type] > 0
    );
}

const BASE_WAVE_BUDGET = 40;
const BUDGET_PER_WAVE = 20;

export function generateProceduralWave(waveNumber: number): EnemySpawnConfig[] {
    const budget = BASE_WAVE_BUDGET + (waveNumber * BUDGET_PER_WAVE);
    let remainingBudget = budget;
    const spawnPatterns: EnemySpawnConfig[] = [];
    const availableEnemies = getAvailableEnemies(waveNumber);

    let isFirstSpawn = true;

    while (remainingBudget > 0 && availableEnemies.length > 0) {
        const cheapestEnemyCost = Math.min(...availableEnemies.map(e => ENEMY_COSTS[e]));
        if (remainingBudget < cheapestEnemyCost) {
            break;
        }

        const affordableEnemies = availableEnemies.filter(e => ENEMY_COSTS[e] <= remainingBudget);
        const enemyType = affordableEnemies[Math.floor(Math.random() * affordableEnemies.length)];
        const enemyCost = ENEMY_COSTS[enemyType];

        const maxInGroup = Math.floor(remainingBudget / enemyCost);
        let groupSize;
        if (Math.random() > 0.8 && maxInGroup > 1) { // 20% chance of a large group
            const minSize = Math.floor(maxInGroup / 2);
            groupSize = minSize + Math.floor(Math.random() * (maxInGroup - minSize + 1));
        } else {
            groupSize = 1 + Math.floor(Math.random() * Math.min(maxInGroup, 4));
        }
        groupSize = Math.max(1, Math.min(groupSize, maxInGroup));

        const delay = isFirstSpawn ? 120 : (60 + Math.random() * 120); // 2s initial, 1-3s after
        isFirstSpawn = false;

        spawnPatterns.push({
            type: enemyType,
            count: groupSize,
            delay: Math.round(delay),
        });

        remainingBudget -= enemyCost * groupSize;
    }
    
    return spawnPatterns;
}


export interface EnemySpawnConfig {
    type: EnemyType;
    color?: GameColor;
    count: number;
    delay?: number;
}


export interface WaveConfig {
    waveNumber: number;
    name: string;
    enemySpawnPatterns?: EnemySpawnConfig[];
    bossType?: EnemyType.MINI_BOSS_1 | EnemyType.MAIN_BOSS_1;
    nextWaveHint: string;
    fragmentsAwarded: number;

}


export const WAVE_CONFIGS: WaveConfig[] = [
    {
        waveNumber: 1,
        name: "First Contact",
        nextWaveHint: "More enemies are adapting to your colors!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 2,
        name: "Color Echoes",
        nextWaveHint: "Prepare for a new kind of threat!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 3,
        name: "Shifting Sands",
        nextWaveHint: "The assault intensifies. Watch out for reflections!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 4,
        name: "Reflective Gauntlet",
        nextWaveHint: "A formidable opponent approaches. Focus your fire!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 5,
        name: "Mini-Boss: Sentinel Prime",
        enemySpawnPatterns: [],
        bossType: EnemyType.MINI_BOSS_1,
        nextWaveHint: "The core challenge awaits. Master all colors!",
        fragmentsAwarded: 3,
    },
    {
        waveNumber: 6,
        name: "Chromatic Confusion",
        nextWaveHint: "Enemies are adapting faster now. Stay sharp!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 7,
        name: "Adaptive Onslaught",
        nextWaveHint: "The final test nears. Prepare for the Prism Guardian!",
        fragmentsAwarded: 1,
    },
    {
        waveNumber: 8,
        name: "Apex Predator",
        enemySpawnPatterns: [],
        bossType: EnemyType.MAIN_BOSS_1,
        nextWaveHint: "You've survived the worst. How long can you last?",
        fragmentsAwarded: 5,
    },


    {
        waveNumber: 9,
        name: "Endless Surge I",
        nextWaveHint: "The waves are endless. Max out your power!",
        fragmentsAwarded: 2,
    },
    {
        waveNumber: 10,
        name: "Endless Surge II",
        nextWaveHint: "Can you beat your high score?",
        fragmentsAwarded: 2,
    },

];


export const FALLBACK_WAVE_CONFIG: WaveConfig = {
    waveNumber: 999,
    name: "Endless Wave",
    nextWaveHint: "The waves are endless. How far can you go?",
    fragmentsAwarded: 2,
};