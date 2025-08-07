import { characterConfig } from '../entities/level-definitions.js';

export class StorageManager {
    static _getDefaultState() {
        return {
            levelProgress: { unlockedLevels: [1], completedLevels: [] },
            selectedCharacter: 'm_human',
            levelStats: {},
            tutorialShown: false,
        };
    }

    static loadProgress() {
        try {
            const saved = localStorage.getItem('rgbangGameState');
            if (!saved) return this._getDefaultState();

            const state = JSON.parse(saved);
            if (typeof state !== 'object' || state === null) return this._getDefaultState();

            const lp = state.levelProgress;
            if (typeof lp !== 'object' || lp === null || !Array.isArray(lp.unlockedLevels) || !Array.isArray(lp.completedLevels)) {
                 return this._getDefaultState();
            }

            if (typeof state.selectedCharacter !== 'string' || !characterConfig[state.selectedCharacter.split('_')[1]]) {
                state.selectedCharacter = 'm_human';
            }

            if (!state.levelStats || typeof state.levelStats !== 'object') {
                state.levelStats = {};
            }
             if (typeof state.tutorialShown !== 'boolean') {
                state.tutorialShown = false;
            }

            return state;
        } catch (e) {
            console.error("Failed to parse game state from localStorage. Resetting to default.", e);
            return this._getDefaultState();
        }
    }

    static saveProgress(gameState) {
        try {
            const stateToSave = {
                levelProgress: gameState.levelProgress,
                selectedCharacter: gameState.selectedCharacter,
                levelStats: gameState.levelStats,
                tutorialShown: gameState.tutorialShown,
            };
            localStorage.setItem('rgbangGameState', JSON.stringify(stateToSave));
            console.log("Progress saved:", stateToSave);
        } catch (e) {
            console.error("Failed to save game state to localStorage", e);
        }
    }

    static resetProgress() {
        try {
            localStorage.removeItem('rgbangGameState');
            console.log("Game progress has been reset.");
        } catch (e) {
            console.error("Failed to reset game state in localStorage", e);
        }
    }
}