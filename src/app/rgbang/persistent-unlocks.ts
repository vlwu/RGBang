
const UNLOCKED_UPGRADES_KEY = 'rgBangUnlockedUpgrades';

export function getUnlockedUpgrades(): Set<string> {
    if (typeof window === 'undefined') {
        return new Set();
    }
    try {
        const saved = window.localStorage.getItem(UNLOCKED_UPGRADES_KEY);
        if (saved) {
            const unlockedIds = JSON.parse(saved);
            return new Set(unlockedIds);
        }
    } catch (error) {
        console.error('Failed to load unlocked upgrades from localStorage', error);
    }
    return new Set();
}

export function unlockUpgrade(upgradeId: string): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const currentUnlocks = getUnlockedUpgrades();
        if (!currentUnlocks.has(upgradeId)) {
            currentUnlocks.add(upgradeId);
            window.localStorage.setItem(UNLOCKED_UPGRADES_KEY, JSON.stringify(Array.from(currentUnlocks)));
        }
    } catch (error) {
        console.error('Failed to save unlocked upgrade to localStorage', error);
    }
}

export function resetUnlockedUpgrades(): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.removeItem(UNLOCKED_UPGRADES_KEY);
    } catch (error) {
        console.error('Failed to reset unlocked upgrades in localStorage', error);
    }
}
