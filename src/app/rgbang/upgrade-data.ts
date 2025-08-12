
'use server';

export interface UpgradeProgress {
    level: number;
    exp: number;
}

export interface PlayerUpgradeData {
    unlockedUpgradeIds: Set<string>;
    upgradeProgress: Map<string, UpgradeProgress>;
}

const UPGRADE_DATA_KEY = 'rgBangUpgradeData';

// EXP needed to reach level 2, 3, 4, 5. Level 1 is 0 EXP.
const EXP_THRESHOLDS = [0, 100, 250, 500, 1000];

// Helper to convert Maps and Sets to JSON
const replacer = (key: string, value: any) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    }
    if (value instanceof Set) {
        return {
            dataType: 'Set',
            value: Array.from(value.values()),
        };
    }
    return value;
}

// Helper to revive Maps and Sets from JSON
const reviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
        if (value.dataType === 'Set') {
            return new Set(value.value);
        }
    }
    return value;
}


export async function getPlayerUpgradeData(): Promise<PlayerUpgradeData> {
    if (typeof window === 'undefined') {
        return { unlockedUpgradeIds: new Set(), upgradeProgress: new Map() };
    }
    try {
        const saved = window.localStorage.getItem(UPGRADE_DATA_KEY);
        if (saved) {
            return JSON.parse(saved, reviver);
        }
    } catch (error) {
        console.error('Failed to load upgrade data from localStorage', error);
    }
    // Default data if nothing is saved
    return {
        unlockedUpgradeIds: new Set(),
        upgradeProgress: new Map(),
    };
}

export async function savePlayerUpgradeData(data: PlayerUpgradeData): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const json = JSON.stringify(data, replacer);
        window.localStorage.setItem(UPGRADE_DATA_KEY, json);
    } catch (error) {
        console.error('Failed to save upgrade data to localStorage', error);
    }
}

export async function addExpAndLevelUp(upgradeId: string, expToAdd: number): Promise<PlayerUpgradeData> {
    const data = await getPlayerUpgradeData();
    let progress = data.upgradeProgress.get(upgradeId);

    if (!progress) {
        progress = { level: 1, exp: 0 };
    }
    
    // Cap level
    if (progress.level >= EXP_THRESHOLDS.length) {
        progress.exp = EXP_THRESHOLDS[EXP_THRESHOLDS.length - 1];
        data.upgradeProgress.set(upgradeId, progress);
        await savePlayerUpgradeData(data);
        return data;
    }
    
    progress.exp += expToAdd;
    
    // Check for level up
    while (progress.level < EXP_THRESHOLDS.length && progress.exp >= EXP_THRESHOLDS[progress.level]) {
        progress.level++;
        // Do not carry over "extra" exp for simplicity
    }
    
    data.upgradeProgress.set(upgradeId, progress);
    await savePlayerUpgradeData(data);
    return data;
}

export async function unlockUpgrade(upgradeId: string): Promise<PlayerUpgradeData> {
    const data = await getPlayerUpgradeData();
    if (!data.unlockedUpgradeIds.has(upgradeId)) {
        data.unlockedUpgradeIds.add(upgradeId);
        // Initialize progress when an upgrade is first unlocked
        if (!data.upgradeProgress.has(upgradeId)) {
            data.upgradeProgress.set(upgradeId, { level: 1, exp: 0 });
        }
        await savePlayerUpgradeData(data);
    }
    return data;
}


export async function resetAllUpgradeData(): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.removeItem(UPGRADE_DATA_KEY);
    } catch (error) {
        console.error('Failed to reset upgrade data in localStorage', error);
    }
}
