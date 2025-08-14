import { ALL_UPGRADES } from './upgrades';

export interface UpgradeProgress {
    level: number;
}

export interface PlayerUpgradeData {
    unlockedUpgradeIds: Set<string>;
    upgradeProgress: Map<string, UpgradeProgress>;
}

const UPGRADE_DATA_KEY = 'rgBangUpgradeData';


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

export async function levelUpUpgrade(upgradeId: string): Promise<PlayerUpgradeData> {
    const data = await getPlayerUpgradeData();
    let progress = data.upgradeProgress.get(upgradeId);
    const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
    const maxLevel = upgrade ? upgrade.getMaxLevel() : 5;

    if (!progress) {
        progress = { level: 1 };
    } else {
        if (progress.level < maxLevel) {
            progress.level++;
        }
    }

    data.upgradeProgress.set(upgradeId, progress);
    await savePlayerUpgradeData(data);
    return data;
}

export async function unlockUpgrade(upgradeId: string): Promise<PlayerUpgradeData> {
    const data = await getPlayerUpgradeData();
    if (!data.unlockedUpgradeIds.has(upgradeId)) {
        data.unlockedUpgradeIds.add(upgradeId);

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