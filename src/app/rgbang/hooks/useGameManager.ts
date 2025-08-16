"use client";

import React, { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Game } from '../core/game';
import InputHandler, { Keybindings, defaultKeybindings } from '../managers/input-handler';
import { GameColor, PRIMARY_COLORS, getRandomElement, COLOR_DETAILS } from '../data/color';
import type { Upgrade, UpgradeProgress } from '../data/upgrades';
import { ALL_UPGRADES } from '../data/upgrades';
import { getPlayerUpgradeData, unlockUpgrade, PlayerUpgradeData, levelUpUpgrade, resetAllUpgradeData, savePlayerUpgradeData } from '../data/upgrade-data';
import { SavedGameState, saveGameState, loadGameState, clearGameState } from '../core/save-state';
import { useToast } from '@/hooks/use-toast';
import { soundManager, SoundType } from '../managers/sound-manager';
import { WAVE_CONFIGS, FALLBACK_WAVE_CONFIG, EnemyType } from '../data/wave-data';
import { gameStateStore } from '../core/gameStateStore';
import { SandboxManager } from '../managers/sandboxManager';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const DEFAULT_GAME_STATE: SavedGameState = { score: 0, playerHealth: 100, activeUpgrades: new Map<string, number>(), nextBossScoreThreshold: 150, initialColor: GameColor.RED, currentWave: 0, bankedUpgrades: 0, gameMode: 'normal' };
const BETWEEN_WAVES_DURATION = 15;

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

export const useGameManager = () => {
    const [uiState, setUiState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'betweenWaves' | 'continuePrompt'>('menu');
    const [highScore, setHighScore] = useState(0);
    const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);
    const [upgradeData, setUpgradeData] = useState<PlayerUpgradeData>({ unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() });
    const [nextWaveHint, setNextWaveHint] = useState("");
    const [betweenWaveCountdown, setBetweenWaveCountdown] = useState(0);
    const [upgradesRemainingToSelect, setUpgradesRemainingToSelect] = useState(0);
    const [totalUpgradesToSelect, setTotalUpgradesToSelect] = useState(0);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isUpgradeOverviewOpen, setIsUpgradeOverviewOpen] = useState(false);
    const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);
    const [sandboxManager, setSandboxManager] = useState<SandboxGameManager | null>(null);

    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const gameCanvasRef = useRef<GameCanvasHandle | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });
    const [initialGameState, setInitialGameState] = useState<SavedGameState>(DEFAULT_GAME_STATE);
    const { toast } = useToast();
    const [volume, setVolume] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [areToastsEnabled, setAreToastsEnabled] = useState(true);

    const gameStoreState = useSyncExternalStore(gameStateStore.subscribe, gameStateStore.getSnapshot, gameStateStore.getServerSnapshot);

    const upgradeDataRef = useRef(upgradeData);
    useEffect(() => {
        upgradeDataRef.current = upgradeData;
    }, [upgradeData]);

    const keybindingsRef = useRef(keybindings);
    useEffect(() => {
        keybindingsRef.current = keybindings;
    }, [keybindings]);

    const inputHandlerRef = useRef(InputHandler.getInstance());

    const updateCanvasSize = useCallback(() => {
        const windowWidth = window.innerWidth * 0.9;
        const windowHeight = window.innerHeight * 0.9;
        const aspectRatio = GAME_WIDTH / GAME_HEIGHT;

        let newWidth = windowWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > windowHeight) {
            newHeight = windowHeight;
            newWidth = newHeight * aspectRatio;
        }

        setCanvasSize({ width: newWidth, height: newHeight });
    }, []);

    const loadInitialData = useCallback(async () => {
        soundManager.loadSounds();
        setHighScore(parseInt(localStorage.getItem('rgBangHighScore') || '0'));

        const savedVolume = localStorage.getItem('rgBangVolume');
        const savedMute = localStorage.getItem('rgBangMuted');
        const savedToastsEnabled = localStorage.getItem('rgBangToastsEnabled');
        const currentVolume = savedVolume ? parseFloat(savedVolume) : 1.0;
        const currentMute = JSON.parse(savedMute || 'false');
        const currentToastsEnabled = savedToastsEnabled ? JSON.parse(savedToastsEnabled) : true;
        setVolume(currentVolume);
        setIsMuted(currentMute);
        setAreToastsEnabled(currentToastsEnabled);
        soundManager.setMasterVolume(currentVolume);
        soundManager.setMuted(currentMute);

        const savedRun = await loadGameState();
        if (savedRun && savedRun.score > 0) {
            setSavedGame(savedRun);
        } else {
            setSavedGame(null);
        }

        const data = await getPlayerUpgradeData();
        setUpgradeData(data);
        upgradeDataRef.current = data;

        const savedKeybindings = localStorage.getItem('rgBangKeybindings');
        const loadedBindings = savedKeybindings ? JSON.parse(savedKeybindings) : {};
        const currentKeybindings = { ...defaultKeybindings, ...loadedBindings };
        setKeybindings(currentKeybindings);
        inputHandlerRef.current.setKeybindings(currentKeybindings);
        setUiState('menu');
    }, []);

    useEffect(() => {
        loadInitialData();
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, [loadInitialData, updateCanvasSize]);

    // Autosave when a wave is completed
    useEffect(() => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameStoreState.isBetweenWaves && uiState === 'betweenWaves' && gameInstance) {
            if (gameInstance.gameMode === 'normal') {
                const stateToSave = gameInstance.getCurrentState();
                if (stateToSave.score > 0) {
                    saveGameState(stateToSave);
                }
            }
        }
    }, [gameStoreState.isBetweenWaves, uiState]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            const gameInstance = gameCanvasRef.current?.getGameInstance();
            if (gameInstance && (uiState === 'playing' || uiState === 'paused' || uiState === 'betweenWaves' || uiState === 'upgrading')) {
                if (gameInstance.gameMode === 'normal') {
                    const stateFromGame = gameInstance.getCurrentState();
                    const stateToSave: SavedGameState = {
                        ...stateFromGame,
                        bankedUpgrades: gameStoreState.bankedUpgrades + upgradesRemainingToSelect
                    };
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
    }, [uiState, upgradesRemainingToSelect, gameStoreState.bankedUpgrades]);

    useEffect(() => {
        inputHandlerRef.current.setKeybindings(keybindings);
        localStorage.setItem('rgBangKeybindings', JSON.stringify(keybindings));
    }, [keybindings]);

    const handleNextWaveStart = useCallback(() => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameInstance) {
            if (upgradesRemainingToSelect > 0) {
                gameInstance.addBankedUpgrades(upgradesRemainingToSelect);
                toast({
                    title: "Upgrades Banked",
                    description: `You've saved ${upgradesRemainingToSelect} upgrade choice${upgradesRemainingToSelect > 1 ? 's' : ''} for later.`,
                    duration: 3000,
                });
                setUpgradesRemainingToSelect(0);
            }

            const nextWaveNum = gameStoreState.currentWave + 1;
            gameInstance.startWave(nextWaveNum);
            setUiState('playing');
            soundManager.play(SoundType.GameResume);
        }
    }, [upgradesRemainingToSelect, toast, gameStoreState.currentWave]);

    useEffect(() => {
        let countdownInterval: NodeJS.Timeout | null = null;
        if (uiState === 'betweenWaves' && betweenWaveCountdown > 0 && !isUpgradeModalOpen) {
            countdownInterval = setInterval(() => {
                setBetweenWaveCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval!);
                        countdownInterval = null;
                        handleNextWaveStart();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (countdownInterval) clearInterval(countdownInterval);
        };
    }, [uiState, betweenWaveCountdown, isUpgradeModalOpen, handleNextWaveStart]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isSandboxModalOpen) {
                    setIsSandboxModalOpen(false);
                    soundManager.play(SoundType.ButtonClick);
                } else if (isSettingsOpen || isInfoOpen) {
                    setIsSettingsOpen(false);
                    setIsInfoOpen(false);
                    soundManager.play(SoundType.ButtonClick);
                } else if (isUpgradeModalOpen) {
                    setIsUpgradeModalOpen(false);
                    setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
                    setUiState('betweenWaves');
                    soundManager.play(SoundType.GamePause);
                } else if (uiState === 'playing') {
                    setUiState('paused');
                    soundManager.play(SoundType.GamePause);
                } else if (uiState === 'paused') {
                    setUiState('playing');
                    soundManager.play(SoundType.GameResume);
                } else if (uiState === 'betweenWaves') {
                    handleNextWaveStart();
                }
            }
            if (e.key.toLowerCase() === keybindingsRef.current.viewUpgrades.toLowerCase()) {
                if (e.repeat) return;
                if (uiState === 'playing' || uiState === 'paused') {
                    setIsUpgradeOverviewOpen(prev => !prev);
                }
            }
            if (e.key === 'Tab') {
                const gameInstance = gameCanvasRef.current?.getGameInstance();
                if (gameInstance?.gameMode === 'freeplay' && (uiState === 'playing' || isSandboxModalOpen)) {
                    e.preventDefault();
                    setIsSandboxModalOpen(prev => !prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [uiState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen, isSandboxModalOpen, handleNextWaveStart]);

    const openUpgradeSelection = useCallback((isBossWave: boolean, upgradesCount?: number) => {
        const count = upgradesCount ?? upgradesRemainingToSelect;
        const gameInstance = gameCanvasRef.current?.getGameInstance();

        if (count > 0 && gameInstance) {
            const nextFragmentColorForOptions = isBossWave ? null : getRandomElement(PRIMARY_COLORS);

            const options = gameInstance.player.upgradeManager.getUpgradeOptions(
                nextFragmentColorForOptions,
                upgradeDataRef.current,
                gameInstance.addScore
            );
            setUpgradeOptions(options);
            setIsUpgradeModalOpen(true);
        } else {
            toast({
                title: "No Upgrades Available",
                description: "You have no fragments to convert into upgrades at this time. Proceeding to next wave.",
            });
            setIsUpgradeModalOpen(false);
            setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
            setUiState('betweenWaves');
            soundManager.play(SoundType.GameResume);
        }
    }, [upgradesRemainingToSelect, toast]);

    useEffect(() => {
        if (gameStoreState.isGameOver) {
            const finalScore = gameStoreState.score;
            setUiState('gameOver');
            if (finalScore > highScore) {
                localStorage.setItem('rgBangHighScore', finalScore.toString());
                setHighScore(finalScore);
            }
            clearGameState();
        } else if (gameStoreState.isBetweenWaves && uiState !== 'betweenWaves' && uiState !== 'upgrading') {
            const { waveCompletedFragments, isBossWave } = gameStoreState;
            const gameInstance = gameCanvasRef.current?.getGameInstance();
            if (!gameInstance) return;

            const waveConfigForNextHint = WAVE_CONFIGS.find(w => w.waveNumber === gameStoreState.currentWave + 1) || FALLBACK_WAVE_CONFIG;
            setNextWaveHint(waveConfigForNextHint.nextWaveHint);

            const totalUpgradesToOffer = waveCompletedFragments + gameStoreState.bankedUpgrades;
            gameInstance.setBankedUpgrades(0);

            if (totalUpgradesToOffer > 0) {
                setUpgradesRemainingToSelect(totalUpgradesToOffer);
                setTotalUpgradesToSelect(totalUpgradesToOffer);
                setUiState('upgrading');
                soundManager.play(SoundType.GamePause);

                toast({
                    title: "Wave Cleared!",
                    description: `You've earned ${totalUpgradesToOffer} upgrade choice${totalUpgradesToOffer > 1 ? 's' : ''}! Choose wisely.`,
                    duration: 3000,
                });

                setTimeout(() => openUpgradeSelection(isBossWave, totalUpgradesToOffer), 100);
            } else {
                setUpgradesRemainingToSelect(0);
                setTotalUpgradesToSelect(0);
                setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
                setUiState('betweenWaves');
                soundManager.play(SoundType.GamePause);
            }
        }
    }, [gameStoreState.isGameOver, gameStoreState.isBetweenWaves, gameStoreState.bankedUpgrades, openUpgradeSelection, toast, uiState, gameStoreState.currentWave]);

    useEffect(() => {
        if (gameStoreState.requestOpenUpgradeModal && uiState === 'playing') {
            const gameInstance = gameCanvasRef.current?.getGameInstance();
            if (gameInstance) {
                const options = gameInstance.player.upgradeManager.getUpgradeOptions(null, upgradeDataRef.current, gameInstance.addScore);
                setUpgradeOptions(options);
                setUpgradesRemainingToSelect(1);
                setTotalUpgradesToSelect(1);
                setIsUpgradeModalOpen(true);
                setUiState('upgrading');
            }
            gameStateStore.updateState({ requestOpenUpgradeModal: false });
        }
    }, [gameStoreState.requestOpenUpgradeModal, uiState]);

    const lastFragmentCount = useRef(0);
    useEffect(() => {
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (gameStoreState.fragmentCollectCount > lastFragmentCount.current && gameInstance?.gameMode === 'normal') {
            const color = gameStoreState.lastFragmentCollected;
            const colorHex = color === 'special'
                ? '#FFFFFF'
                : color
                ? COLOR_DETAILS[color].hex
                : '#A9A9A9';

            toast({
                title: "Fragment Collected!",
                description: `You picked up a ${color === 'special' ? 'special' : (color ? COLOR_DETAILS[color].name : '')} fragment.`,
                duration: 1500,
                className: "toast-glow",
                style: { '--toast-glow-color': colorHex } as React.CSSProperties,
                stackId: 'fragment-collected',
            });
            lastFragmentCount.current = gameStoreState.fragmentCollectCount;
        }
    }, [gameStoreState.fragmentCollectCount, gameStoreState.lastFragmentCollected, toast]);

    const handleUpgradeSelected = useCallback(async (upgrade: Upgrade) => {
        soundManager.play(SoundType.UpgradeSelect);
        const gameInstance = gameCanvasRef.current?.getGameInstance();
        if (!gameInstance) return;

        const addScoreCallback = (amount: number) => gameInstance.addScore(amount);

        if (upgrade.id.startsWith('max-out-')) {
            const originalId = upgrade.id.replace('max-out-', '');
            const originalUpgrade = ALL_UPGRADES.find(u => u.id === originalId);
            if (originalUpgrade) {
                gameInstance.player.upgradeManager.applyMax(originalUpgrade);
                const data = await getPlayerUpgradeData();
                data.unlockedUpgradeIds.add(originalId);
                data.upgradeProgress.set(originalId, { level: originalUpgrade.getMaxLevel() });
                await savePlayerUpgradeData(data);
                setUpgradeData(data);
                upgradeDataRef.current = data;
            }
        } else if (upgrade.id.startsWith('fallback-')) {
            upgrade.apply(gameInstance.player, 1, addScoreCallback);
        } else {
            gameInstance.player.applyUpgrade(upgrade);
            await unlockUpgrade(upgrade.id);
            const finalData = await levelUpUpgrade(upgrade.id);
            setUpgradeData(finalData);
            upgradeDataRef.current = finalData;
        }

        if (gameInstance.gameMode === 'freeplay') {
            setIsUpgradeModalOpen(false);
            setUiState('playing');
            setUpgradesRemainingToSelect(0);
            return;
        }

        setUpgradesRemainingToSelect(prev => {
            const newCount = prev - 1;
            if (newCount <= 0) {
                setIsUpgradeModalOpen(false);
                setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
                setUiState('betweenWaves');
            } else {
                const isBossWaveRecentlyCompleted = WAVE_CONFIGS.find(w => w.waveNumber === gameStoreState.currentWave)?.bossType !== undefined;
                openUpgradeSelection(isBossWaveRecentlyCompleted, newCount);
            }
            return newCount;
        });
    }, [gameStoreState.currentWave, openUpgradeSelection]);

    const startNewRun = async (gameMode: 'normal' | 'freeplay' = 'normal') => {
        soundManager.play(SoundType.ButtonClick);
        await clearGameState();
        const lastColor = localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED;
        const newInitialGameState: SavedGameState = { ...DEFAULT_GAME_STATE, initialColor: lastColor, currentWave: 0, gameMode };
        setInitialGameState(newInitialGameState);
        setUiState('playing');

        if (gameMode === 'freeplay') {
            const game = gameCanvasRef.current?.getGameInstance();
            const sm = game?.getSandboxManager();
            if (sm) {
                const manager: SandboxGameManager = {
                    spawnEnemy: sm.spawnEnemy.bind(sm),
                    spawnBoss: sm.spawnBoss.bind(sm),
                    killAllEnemies: sm.killAllEnemies.bind(sm),
                    clearAllBullets: sm.clearAllBullets.bind(sm),
                    addUpgrade: sm.addUpgrade.bind(sm),
                    removeUpgrade: sm.removeUpgrade.bind(sm),
                    maxUpgrade: sm.maxUpgrade.bind(sm),
                    getRunUpgrades: () => gameStoreState.runUpgrades,
                    togglePlayerCollision: sm.togglePlayerCollision.bind(sm),
                    getIsPlayerCollisionEnabled: sm.getIsPlayerCollisionEnabled.bind(sm),
                };
                setSandboxManager(manager);
            }
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

    const continueRun = async () => {
        soundManager.play(SoundType.ButtonClick);
        const savedRun = await loadGameState();
        if (savedRun) {
            const data = await getPlayerUpgradeData();
            setUpgradeData(data);
            upgradeDataRef.current = data;
            setInitialGameState(savedRun);
            setUiState('playing');
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
                    bankedUpgrades: gameStoreState.bankedUpgrades + upgradesRemainingToSelect
                };

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

    const handleResetData = async () => {
        soundManager.play(SoundType.ButtonClick);
        await resetAllUpgradeData();
        await clearGameState();
        localStorage.removeItem('rgBangHighScore');
        localStorage.removeItem('rgBangLastColor');
        setHighScore(0);
        setUpgradeData({ unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() });
        setSavedGame(null);
        toast({
            title: "Progress Reset",
            description: "Your high score and all upgrade progress have been cleared.",
        });
    }

    const playHoverSound = () => soundManager.play(SoundType.ButtonHover);

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        soundManager.setMasterVolume(newVolume);
        localStorage.setItem('rgBangVolume', newVolume.toString());
    };

    const handleMuteChange = (newMute: boolean) => {
        setIsMuted(newMute);
        soundManager.setMuted(newMute);
        localStorage.setItem('rgBangMuted', JSON.stringify(newMute));
    };

    const handleAreToastsEnabledChange = (enabled: boolean) => {
        setAreToastsEnabled(enabled);
        localStorage.setItem('rgBangToastsEnabled', JSON.stringify(enabled));
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
                getRunUpgrades: () => gameStoreState.runUpgrades,
                togglePlayerCollision: sm.togglePlayerCollision.bind(sm),
                getIsPlayerCollisionEnabled: sm.getIsPlayerCollisionEnabled.bind(sm),
            };
            setSandboxManager(manager);
        } else {
            setSandboxManager(null);
        }
    }, [uiState, gameStoreState.runUpgrades]);

    return {
        uiState,
        setUiState,
        highScore,
        savedGame,
        upgradeData,
        nextWaveHint,
        betweenWaveCountdown,
        upgradesRemainingToSelect,
        totalUpgradesToSelect,
        isSettingsOpen,
        setIsSettingsOpen,
        isInfoOpen,
        setIsInfoOpen,
        isUpgradeModalOpen,
        isUpgradeOverviewOpen,
        setIsUpgradeOverviewOpen,
        isSandboxModalOpen,
        setIsSandboxModalOpen,
        upgradeOptions,
        sandboxManager,
        keybindings,
        setKeybindings,
        gameCanvasRef,
        canvasSize,
        initialGameState,
        volume,
        isMuted,
        areToastsEnabled,
        gameStoreState,
        loadInitialData,
        handleUpgradeSelected,
        startNewRun,
        handlePlayClick,
        continueRun,
        quitToMenu,
        resumeGame: () => {
            soundManager.play(SoundType.GameResume);
            setUiState('playing');
        },
        handleResetData,
        playHoverSound,
        handleVolumeChange,
        handleMuteChange,
        handleAreToastsEnabledChange,
        openUpgradeSelection
    };
};