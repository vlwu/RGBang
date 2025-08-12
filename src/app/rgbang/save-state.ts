
import { GameColor } from './color';

export interface SavedGameState {
    score: number;
    playerHealth: number;
    activeUpgrades: Map<string, number>; // Map<upgradeId, level>
    nextBossScoreThreshold: number;
    initialColor: GameColor;
}

const GAME_STATE_KEY = 'rgBangGameState';

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


export async function saveGameState(state: SavedGameState): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const json = JSON.stringify(state, replacer);
        window.localStorage.setItem(GAME_STATE_KEY, json);
    } catch (error) {
        console.error('Failed to save game state to localStorage', error);
    }
}

export async function loadGameState(): Promise<SavedGameState | null> {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const saved = window.localStorage.getItem(GAME_STATE_KEY);
        if (saved) {
            return JSON.parse(saved, reviver) as SavedGameState;
        }
    } catch (error) {
        console.error('Failed to load game state from localStorage', error);
    }
    return null;
}

export async function clearGameState(): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.removeItem(GAME_STATE_KEY);
    } catch (error) {
        console.error('Failed to clear game state from localStorage', error);
    }
}
