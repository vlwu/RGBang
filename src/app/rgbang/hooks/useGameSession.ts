"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Game } from '../core/game';
import { GameColor } from '../data/color';
import { SavedGameState, saveGameState, clearGameState, loadGameState } from '../core/save-state';
import { soundManager, SoundType } from '../managers/sound-manager';
import { SandboxManager } from '../managers/sandboxManager';
import { gameStateStore } from '../core/gameStateStore';
import { EnemyType } from '../data/wave-data';
import { Upgrade, ALL_UPGRADES } from '../data/upgrades';

const DEFAULT_GAME_STATE: SavedGameState = { score: 0, playerHealth: 100, activeUpgrades: new Map(), nextBossScoreThreshold: 150, initialColor: GameColor.RED, currentWave: 0, bankedUpgrades: 0, gameMode: 'normal', isBetweenWaves: false, betweenWaveCountdown: 0 };

export interface GameCanvasHandle {
    getGameInstance: () => Game | null;
}

export interface SandboxGameManager {
    spawnEnemy: (type: EnemyType, color?: GameColor) => void;
    spawnBoss: () => void;
    killAllEnemies: () => void;
    clearAllBullets: () => void;
    addUpgrade: (upgradeId: string) => void;
    removeUpgrade: (upgradeId: string) => void;
    maxUpgrade: (upgradeId: string) => void;
    getRunUpgrades: () => Map<string, number>;
    togglePlayerCollision: (enabled: boolean) => void;
    getIsPlayerCollisionEnabled: () => boolean;
}

interface UseGameSessionProps {
    savedGame: SavedGameState | null;
    highScore: number;
    setHighScore: (score: number) => void;
    loadInitialData: () => void;
    upgradesRemainingToSelect: number;
}

export const useGameSession = ({ savedGame, highScore, setHighScore, loadInitialData, upgradesRemainingToSelect }: UseGameSessionProps) => {
    const [uiState, setUiState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'betweenWaves' | 'continuePrompt'>('menu');
    const [initialGameState, setInitialGameState] = useState<SavedGameState>(DEFAULT_GAME_STATE);
    const [sandboxManager, setSandboxManager] = useState<SandboxGameManager | null>(null);
    const gameCanvasRef = useRef<GameCanvasHandle | null>(null);

    const startNewRun = async (gameMode: 'normal' | 'freeplay' = 'normal') => {
        soundManager.play(SoundType.ButtonClick);
        await clearGameState();
        const lastColor = localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED;
        const newInitialGameState: SavedGameState = { ...DEFAULT_GAME_STATE, initialColor: lastColor, currentWave: 0, gameMode };
        setInitialGameState(newInitialGameState);
        setUiState('playing');
    };

    const continueRun = async () => {
        soundManager.play(SoundType.ButtonClick);
        const savedRun = await loadGameState();
        if (savedRun) {
            setInitialGameState(savedRun);
            if (savedRun.isBetweenWaves && savedRun.betweenWaveCountdown) {
                setUiState('betweenWaves');
                gameStateStore.updateState({ betweenWaveCountdown: savedRun.betweenWaveCountdown });
            } else {
                setUiState('playing');
            }
        } else {
            startNewRun('normal');
        }
    };

    const handlePlayClick = () => {
        soundManager.play(SoundType.ButtonClick);
        if (savedGame) {
            setUiState('continuePrompt');
        } else {
            startNewRun('normal');
        }
    };

    const quitToMenu = () => {
        soundManager.play(SoundType.GameQuit);
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameInstance) {
            if (gameInstance.gameMode === 'normal') {
                const currentState = gameInstance.getCurrentState();
                const stateToSave: SavedGameState = {
                    ...currentState,
                    bankedUpgrades: gameStateStore.getSnapshot().bankedUpgrades + upgradesRemainingToSelect
                };

                if (uiState === 'betweenWaves') {
                    stateToSave.isBetweenWaves = true;
                    stateToSave.betweenWaveCountdown = gameStateStore.getSnapshot().betweenWaveCountdown;
                }

                if (stateToSave.score > 0) {
                    saveGameState(stateToSave);
                } else {
                    clearGameState();
                }

                if (currentState.score > highScore) {
                    localStorage.setItem('rgBangHighScore', currentState.score.toString());
                    setHighScore(currentState.score);
                }
                localStorage.setItem('rgBangLastColor', currentState.initialColor);
            } else {
                clearGameState();
            }
        }
        setUiState('menu');
        loadInitialData();
    };

    const resumeGame = () => {
        soundManager.play(SoundType.GameResume);
        setUiState('playing');
    };

    useEffect(() => {
        const game = gameCanvasRef.current?.getGameInstance();
        const sm = game?.getSandboxManager();
        if (game?.gameMode === 'freeplay' && sm) {
            const manager: SandboxGameManager = {
                spawnEnemy: sm.spawnEnemy.bind(sm),
                spawnBoss: sm.spawnBoss.bind(sm),
                killAllEnemies: sm.killAllEnemies.bind(sm),
                clearAllBullets: sm.clearAllBullets.bind(sm),
                addUpgrade: sm.addUpgrade.bind(sm),
                removeUpgrade: sm.removeUpgrade.bind(sm),
                maxUpgrade: sm.maxUpgrade.bind(sm),
                getRunUpgrades: () => gameStateStore.getSnapshot().runUpgrades,
                togglePlayerCollision: sm.togglePlayerCollision.bind(sm),
                getIsPlayerCollisionEnabled: sm.getIsPlayerCollisionEnabled.bind(sm),
            };
            setSandboxManager(manager);
        } else {
            setSandboxManager(null);
        }
    }, [uiState, gameCanvasRef.current?.getGameInstance()?.getSandboxManager()]);


    useEffect(() => {
        const handleBeforeUnload = () => {
            const gameInstance = gameCanvasRef.current?.getGameInstance();
            if (gameInstance && (uiState === 'playing' || uiState === 'paused' || uiState === 'betweenWaves' || uiState === 'upgrading')) {
                if (gameInstance.gameMode === 'normal') {
                    const stateFromGame = gameInstance.getCurrentState();
                    const stateToSave: SavedGameState = {
                        ...stateFromGame,
                        bankedUpgrades: gameStateStore.getSnapshot().bankedUpgrades + upgradesRemainingToSelect
                    };

                    if (uiState === 'betweenWaves') {
                        stateToSave.isBetweenWaves = true;
                        stateToSave.betweenWaveCountdown = gameStateStore.getSnapshot().betweenWaveCountdown;
                    }
                    
                    if (stateToSave.score > 0) {
                        saveGameState(stateToSave);
                    }
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [uiState, upgradesRemainingToSelect]);

    return {
        uiState,
        setUiState,
        initialGameState,
        setInitialGameState,
        sandboxManager,
        gameCanvasRef,
        startNewRun,
        continueRun,
        handlePlayClick,
        quitToMenu,
        resumeGame,
    };
};