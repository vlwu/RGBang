import { GameColor } from './color';
import { SavedGameState } from './save-state';

export interface UIState {
    score: number;
    playerHealth: number;
    playerMaxHealth: number;
    currentWave: number;
    isGameOver: boolean;
    isPaused: boolean;
    isBetweenWaves: boolean;
    waveCompletedFragments: number;
    isBossWave: boolean;
    lastFragmentCollected: GameColor | null | 'special';
    fragmentCollectCount: number;
    requestOpenUpgradeModal?: boolean;
}

const initialUIState: UIState = {
    score: 0,
    playerHealth: 100,
    playerMaxHealth: 100,
    currentWave: 0,
    isGameOver: false,
    isPaused: false,
    isBetweenWaves: false,
    waveCompletedFragments: 0,
    isBossWave: false,
    lastFragmentCollected: null,
    fragmentCollectCount: 0,
    requestOpenUpgradeModal: false,
};

let gameState: UIState = { ...initialUIState };
let listeners = new Set<() => void>();

export const gameStateStore = {
    subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    getSnapshot(): UIState {
        return gameState;
    },
    getServerSnapshot(): UIState {
        return initialUIState;
    },
    updateState(newState: Partial<UIState>): void {
        gameState = { ...gameState, ...newState };
        for (const listener of listeners) {
            listener();
        }
    },
    resetState(initialState?: SavedGameState): void {
        gameState = {
            ...initialUIState,
            score: initialState?.score ?? 0,
            playerHealth: initialState?.playerHealth ?? 100,
            playerMaxHealth: 100 + (initialState?.activeUpgrades?.get('max-health') ?? 0) * 20,
            currentWave: initialState?.currentWave ?? 0,
        };
        for (const listener of listeners) {
            listener();
        }
    }
};