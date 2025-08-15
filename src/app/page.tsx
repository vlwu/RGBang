"use client";

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, useSyncExternalStore } from 'react';
import { Game } from './rgbang/game';
import InputHandler, { Keybindings, defaultKeybindings } from './rgbang/input-handler';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Info, LogOut, Pause, Play, Settings, Trash2, History, X } from 'lucide-react';
import { SettingsModal } from './rgbang/settings-modal';
import { InfoModal } from './rgbang/info-modal';
import { GameColor, PRIMARY_COLORS, getRandomElement, COLOR_DETAILS } from './rgbang/color';
import { UpgradeModal } from './rgbang/upgrade-modal';
import type { Upgrade, UpgradeProgress } from './rgbang/upgrades';
import { ALL_UPGRADES } from './rgbang/upgrades';
import { getPlayerUpgradeData, unlockUpgrade, PlayerUpgradeData, levelUpUpgrade, resetAllUpgradeData, savePlayerUpgradeData } from './rgbang/upgrade-data';
import { SavedGameState, saveGameState, loadGameState, clearGameState } from './rgbang/save-state';
import { UpgradesOverviewModal } from './rgbang/upgrades-overview-modal';
import { useToast } from '@/hooks/use-toast';
import { soundManager, SoundType } from './rgbang/sound-manager';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { WAVE_CONFIGS, FALLBACK_WAVE_CONFIG } from './rgbang/wave-data';
import { gameEngine } from './rgbang/engine';
import { gameStateStore } from './rgbang/gameStateStore';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const DEFAULT_GAME_STATE: SavedGameState = { score: 0, playerHealth: 100, activeUpgrades: new Map<string, number>(), nextBossScoreThreshold: 150, initialColor: GameColor.RED, currentWave: 0, bankedUpgrades: 0 };
const BETWEEN_WAVES_DURATION = 15;

interface GameCanvasHandle {
    getGameInstance: () => Game | null;
}

const GameCanvas = React.forwardRef<GameCanvasHandle, {
    width: number,
    height: number,
    initialGameState: SavedGameState,
    isGamePausedExternally: boolean;
    currentWaveCountdown: number;
    currentWaveToDisplay: number;
    isGameBetweenWaves: boolean;
}> (({ width, height, initialGameState, isGamePausedExternally, currentWaveCountdown, currentWaveToDisplay, isGameBetweenWaves }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const inputHandler = InputHandler.getInstance();

    const isGamePausedRef = useRef(isGamePausedExternally);
    const drawParamsRef = useRef({ currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves });

    useEffect(() => {
        isGamePausedRef.current = isGamePausedExternally;
    }, [isGamePausedExternally]);

    useEffect(() => {
        drawParamsRef.current = { currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves };
    });

    const gameLoop = useCallback(() => {
        if (!gameEngine.isRunning || !canvasRef.current) {
            animationFrameIdRef.current = null;
            return;
        }

        gameEngine.update(inputHandler, isGamePausedRef.current);

        const { currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves } = drawParamsRef.current;
        gameEngine.draw(currentWaveToDisplay, currentWaveCountdown, isGameBetweenWaves);
        inputHandler.resetEvents();
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    }, [inputHandler]);

    useImperativeHandle(ref, () => ({
        getGameInstance: () => gameEngine,
    }));

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        inputHandler.setCanvas(canvas);

        console.log("Initializing Game engine with initialGameState:", initialGameState);
        gameEngine.initialize(canvas, initialGameState, soundManager);
        gameEngine.start();

        if (animationFrameIdRef.current === null) {
             animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        }

        return () => {
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            if (gameEngine) {
                gameEngine.stop();
            }
            inputHandler.destroy();
        };
    }, [initialGameState, inputHandler, gameLoop]);


    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-black" />;
});

GameCanvas.displayName = 'GameCanvas';

export default function Home() {
    const [uiState, setUiState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'continuePrompt' | 'betweenWaves'>('menu');
    const [highScore, setHighScore] = useState(0);
    const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);
    const [upgradeData, setUpgradeData] = useState<PlayerUpgradeData>({ unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() });
    const [runUpgrades, setRunUpgrades] = useState<Map<string, number>>(new Map<string, number>());
    const [currentWave, setCurrentWave] = useState(0);
    const [nextWaveHint, setNextWaveHint] = useState("");
    const [betweenWaveCountdown, setBetweenWaveCountdown] = useState(0);
    const [upgradesRemainingToSelect, setUpgradesRemainingToSelect] = useState(0);
    const [totalUpgradesToSelect, setTotalUpgradesToSelect] = useState(0);
    const [bankedUpgrades, setBankedUpgrades] = useState(0);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isUpgradeOverviewOpen, setIsUpgradeOverviewOpen] = useState(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);

    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const gameCanvasRef = useRef<GameCanvasHandle | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });
    const [initialGameState, setInitialGameState] = useState<SavedGameState>(DEFAULT_GAME_STATE);
    const { toast } = useToast();
    const [volume, setVolume] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);

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
        const currentVolume = savedVolume ? parseFloat(savedVolume) : 1.0;
        const currentMute = savedMute ? JSON.parse(savedMute) : false;
        setVolume(currentVolume);
        setIsMuted(currentMute);
        soundManager.setMasterVolume(currentVolume);
        soundManager.setMuted(currentMute);

        const savedRun = await loadGameState();
        if (savedRun && savedRun.score > 0) {
            setSavedGame(savedRun);
            setCurrentWave(savedRun.currentWave);
            setBankedUpgrades(savedRun.bankedUpgrades || 0);
        } else {
            setSavedGame(null);
            setCurrentWave(0);
            setBankedUpgrades(0);
        }

        const data = await getPlayerUpgradeData();
        setUpgradeData(data);
        upgradeDataRef.current = data;

        const savedKeybindings = localStorage.getItem('rgBangKeybindings');
        const currentKeybindings = savedKeybindings ? JSON.parse(savedKeybindings) : defaultKeybindings;
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

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance() && (uiState === 'playing' || uiState === 'paused' || uiState === 'betweenWaves' || uiState === 'upgrading')) {
                const stateFromGame = gameCanvasRef.current.getGameInstance()!.getCurrentState();
                const stateToSave: SavedGameState = {
                    ...stateFromGame,
                    bankedUpgrades: bankedUpgrades + upgradesRemainingToSelect
                };
                if (stateToSave.score > 0) {
                    saveGameState(stateToSave);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [uiState, bankedUpgrades, upgradesRemainingToSelect]);

    useEffect(() => {
        inputHandlerRef.current.setKeybindings(keybindings);
        localStorage.setItem('rgBangKeybindings', JSON.stringify(keybindings));
    }, [keybindings]);

    const handleNextWaveStart = useCallback(() => {
        if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
            if (upgradesRemainingToSelect > 0) {
                setBankedUpgrades(prev => prev + upgradesRemainingToSelect);
                toast({
                    title: "Upgrades Banked",
                    description: `You've saved ${upgradesRemainingToSelect} upgrade choice${upgradesRemainingToSelect > 1 ? 's' : ''} for later.`,
                    duration: 3000,
                });
                setUpgradesRemainingToSelect(0);
            }

            const nextWaveNum = currentWave + 1;
            setCurrentWave(nextWaveNum);
            gameCanvasRef.current.getGameInstance()!.startWave(nextWaveNum);
            setUiState('playing');
            soundManager.play(SoundType.GameResume);
        }
    }, [currentWave, upgradesRemainingToSelect, toast]);

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
                if (isSettingsOpen || isInfoOpen) {
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
                if (uiState === 'playing' || uiState === 'paused') {
                    setIsUpgradeOverviewOpen(prev => !prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [uiState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen, handleNextWaveStart]);


    const openUpgradeSelection = useCallback((isBossWave: boolean, upgradesCount?: number) => {
        const count = upgradesCount ?? upgradesRemainingToSelect;
        if (count > 0 && gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
            const gameInstance = gameCanvasRef.current.getGameInstance()!;
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
    }, [upgradesRemainingToSelect, upgradeDataRef, toast]);

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
            setCurrentWave(gameStoreState.currentWave);

            const waveConfigForNextHint = WAVE_CONFIGS.find(w => w.waveNumber === gameStoreState.currentWave + 1) || FALLBACK_WAVE_CONFIG;
            setNextWaveHint(waveConfigForNextHint.nextWaveHint);

            const totalUpgradesToOffer = waveCompletedFragments + bankedUpgrades;
            setBankedUpgrades(0);

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
    }, [gameStoreState.isGameOver, gameStoreState.isBetweenWaves, bankedUpgrades, openUpgradeSelection, toast, uiState]);


    const lastFragmentCount = useRef(0);
    useEffect(() => {
        if (gameStoreState.fragmentCollectCount > lastFragmentCount.current) {
            const color = gameStoreState.lastFragmentCollected;
            toast({
                title: "Fragment Collected!",
                description: `You picked up a ${color === 'special' ? 'special' : (color ? COLOR_DETAILS[color].name : '')} fragment.`,
                duration: 1500,
            });
        }
        lastFragmentCount.current = gameStoreState.fragmentCollectCount;
    }, [gameStoreState.fragmentCollectCount, gameStoreState.lastFragmentCollected, toast]);


    const handleUpgradeSelected = useCallback(async (upgrade: Upgrade) => {
        soundManager.play(SoundType.UpgradeSelect);
        if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
            const gameInstance = gameCanvasRef.current.getGameInstance()!;
            const addScoreCallback = (amount: number) => {
                gameInstance.addScore(amount);
            };

            if (upgrade.id.startsWith('max-out-')) {
                const originalId = upgrade.id.replace('max-out-', '');
                const originalUpgrade = ALL_UPGRADES.find(u => u.id === originalId);

                if (originalUpgrade) {
                    gameInstance.player.upgradeManager.applyMax(originalUpgrade);
                    setRunUpgrades(prev => new Map(prev).set(originalId, originalUpgrade.getMaxLevel()));

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
                 setRunUpgrades(prev => {
                     const currentLevel = prev.get(upgrade.id) || 0;
                     const newMap = new Map(prev);
                     newMap.set(upgrade.id, currentLevel + 1);
                     return newMap;
                 });

                 await unlockUpgrade(upgrade.id);
                 const finalData = await levelUpUpgrade(upgrade.id);
                 setUpgradeData(finalData);
                 upgradeDataRef.current = finalData;
            }

            setUpgradesRemainingToSelect(prev => {
                const newCount = prev - 1;
                if (newCount <= 0) {
                    setIsUpgradeModalOpen(false);
                    setBetweenWaveCountdown(BETWEEN_WAVES_DURATION);
                    setUiState('betweenWaves');

                } else {
                    if (gameInstance) {
                        const isBossWaveRecentlyCompleted = WAVE_CONFIGS.find(w => w.waveNumber === gameStoreState.currentWave)?.bossType !== undefined;
                        openUpgradeSelection(isBossWaveRecentlyCompleted, newCount);
                    }
                }
                return newCount;
            });
        }
    }, [runUpgrades, gameStoreState.currentWave, soundManager, upgradeDataRef, openUpgradeSelection]);

    const resetGameAndUpgradeState = () => {
        const freshUpgradeData: PlayerUpgradeData = { unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() };
        setUpgradeData(freshUpgradeData);
        upgradeDataRef.current = freshUpgradeData;
        setRunUpgrades(new Map<string, number>());
        setSavedGame(null);
        setCurrentWave(0);
        setBankedUpgrades(0);
    };

    const startNewRun = async () => {
        await clearGameState();
        resetGameAndUpgradeState();
        const lastColor = localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED;

        const newInitialGameState = { ...DEFAULT_GAME_STATE, initialColor: lastColor, currentWave: 0 };
        setInitialGameState(newInitialGameState);
        setUiState('playing');
    };

    const handlePlayClick = () => {
        soundManager.play(SoundType.ButtonClick);
        if (savedGame) {
            setUiState('continuePrompt');
        } else {
            startNewRun();
        }
    };

    const continueRun = async () => {
        soundManager.play(SoundType.ButtonClick);
        const savedRun = await loadGameState();
        if (savedRun) {
            const data = await getPlayerUpgradeData();
            setUpgradeData(data);
            upgradeDataRef.current = data;
            setRunUpgrades(new Map(savedRun.activeUpgrades));
            setCurrentWave(savedRun.currentWave);
            setBankedUpgrades(savedRun.bankedUpgrades || 0);

            setInitialGameState(savedRun);
            setUiState('playing');
        } else {
            startNewRun();
        }
    };

    const quitToMenu = () => {
        soundManager.play(SoundType.GameQuit);
        if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
            const currentState = gameCanvasRef.current.getGameInstance()!.getCurrentState();
            const stateToSave: SavedGameState = {
                ...currentState,
                bankedUpgrades: bankedUpgrades + upgradesRemainingToSelect
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
            setCurrentWave(currentState.currentWave);
        }
        setUiState('menu');
        loadInitialData();
    };

    const resumeGame = () => {
        soundManager.play(SoundType.GameResume);
        setUiState('playing');
    };

    const handleResetData = async () => {
        soundManager.play(SoundType.ButtonClick);
        await resetAllUpgradeData();
        await clearGameState();
        localStorage.removeItem('rgBangHighScore');
        localStorage.removeItem('rgBangLastColor');
        setHighScore(0);
        resetGameAndUpgradeState();
        toast({
            title: "Progress Reset",
            description: "Your high score and all upgrade progress have to have been cleared.",
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

    const handleContextMenu = (e: React.MouseEvent) => {
        if (uiState !== 'playing') {
            e.preventDefault();
        }
    };

    return (
        <main
            className="flex flex-col items-center justify-center min-h-screen text-foreground p-4 relative bg-soft-gradient bg-200% animate-background-pan"
            onContextMenu={handleContextMenu}
        >
             <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                keybindings={keybindings}
                onKeybindingsChange={setKeybindings}
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={handleVolumeChange}
                onMuteChange={handleMuteChange}
            />
            <InfoModal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
            />
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                options={upgradeOptions}
                onSelect={handleUpgradeSelected}
                upgradeData={upgradeData}
                runUpgrades={runUpgrades}
                upgradesRemainingToSelect={upgradesRemainingToSelect}
                totalUpgradesToSelect={totalUpgradesToSelect}
            />
            <UpgradesOverviewModal
                isOpen={isUpgradeOverviewOpen}
                upgradeManager={gameCanvasRef.current?.getGameInstance()?.player.upgradeManager}
            />


            {uiState === 'menu' && (
                <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
                    <h1 className="text-8xl font-bold tracking-tighter font-headline">
                        <span className="bg-gradient-to-r from-red-400 via-green-400 to-blue-500 bg-clip-text text-transparent">RGB</span>
                        <span>ang</span>
                    </h1>
                    <div className="flex flex-col gap-4 w-64">
                        <Button size="lg" onClick={handlePlayClick} onMouseEnter={playHoverSound} className="font-bold text-lg btn-gradient btn-gradient-1 animate-gradient-shift">
                            <Gamepad2 className="mr-2" />
                            Play
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => { soundManager.play(SoundType.ButtonClick); setIsSettingsOpen(true); }} onMouseEnter={playHoverSound}>
                            <Settings className="mr-2" />
                            Settings
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => { soundManager.play(SoundType.ButtonClick); setIsInfoOpen(true); }} onMouseEnter={playHoverSound}>
                            <Info className="mr-2" />
                            How to Play
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="lg" variant="destructive" onMouseEnter={playHoverSound}>
                                    <Trash2 className="mr-2" />
                                    Reset Progress
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your high score and all upgrade progress.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => soundManager.play(SoundType.ButtonClick)} onMouseEnter={playHoverSound}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetData} onMouseEnter={playHoverSound}>
                                    Yes, reset everything
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                     <div className="pt-4 text-xl font-semibold text-foreground/80">
                        <div className="flex items-center justify-center gap-2">
                            <Award className="text-accent" />
                            <span>High Score: {highScore}</span>
                        </div>
                    </div>
                </div>
            )}

            {uiState === 'continuePrompt' && savedGame && (
                 <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
                    <h1 className="text-6xl font-bold tracking-tighter font-headline">
                        Welcome Back!
                    </h1>
                     <div className="text-2xl font-semibold text-foreground/80">
                        <p>You have a run in progress.</p>
                        <p>Score: <span className="font-bold text-accent">{Math.round(savedGame.score)}</span></p>
                        <p>Wave: <span className="font-bold text-accent">{savedGame.currentWave}</span></p>
                    </div>
                    <div className="flex flex-col gap-4 w-64">
                        <Button size="lg" onClick={continueRun} onMouseEnter={playHoverSound} className="font-bold text-lg btn-gradient btn-gradient-2 animate-gradient-shift">
                            <History className="mr-2" />
                            Continue Run
                        </Button>
                        <Button size="lg" variant="destructive" onClick={() => { soundManager.play(SoundType.ButtonClick); startNewRun(); }} onMouseEnter={playHoverSound}>
                            <Gamepad2 className="mr-2" />
                            Start Fresh
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => { soundManager.play(SoundType.ButtonClick); setUiState('menu'); }} onMouseEnter={playHoverSound}>
                            Main Menu
                        </Button>
                    </div>
                </div>
            )}


            {(uiState === 'playing' || uiState === 'paused' || uiState === 'upgrading' || uiState === 'betweenWaves') && (
                <div className="relative">
                    <GameCanvas
                        width={canvasSize.width}
                        height={canvasSize.height}
                        isGamePausedExternally={uiState === 'paused' || uiState === 'upgrading' || isUpgradeOverviewOpen || uiState === 'betweenWaves'}
                        initialGameState={initialGameState}
                        ref={gameCanvasRef}
                        currentWaveCountdown={betweenWaveCountdown}
                        currentWaveToDisplay={currentWave}
                        isGameBetweenWaves={uiState === 'betweenWaves'}
                    />
                    {uiState === 'paused' && (
                         <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20">
                             <div className="absolute top-4 right-4">
                                <Button size="icon" variant="ghost" onClick={resumeGame} onMouseEnter={playHoverSound}>
                                    <X/>
                                </Button>
                             </div>
                             <h2 className="text-6xl font-bold font-headline tracking-tighter mb-8 text-glow">Paused</h2>
                             <div className="flex flex-col space-y-4 w-52">
                                <Button size="lg" onClick={resumeGame} onMouseEnter={playHoverSound} className="font-bold text-lg btn-gradient btn-gradient-2 animate-gradient-shift">
                                    <Play className="mr-2" />
                                    Resume
                                </Button>
                                <Button size="lg" variant="secondary" onClick={() => { soundManager.play(SoundType.ButtonClick); setIsSettingsOpen(true); }} onMouseEnter={playHoverSound}>
                                    <Settings className="mr-2" />
                                    Settings
                                </Button>
                                <Button size="lg" onClick={quitToMenu} variant="destructive" onMouseEnter={playHoverSound} className="font-bold text-lg">
                                     <LogOut className="mr-2" />
                                     Save and Quit
                                 </Button>
                             </div>
                         </div>
                    )}
                    {uiState === 'betweenWaves' && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20">
                            <h2 className="text-6xl font-bold font-headline tracking-tighter mb-4 text-glow">WAVE {currentWave} CLEARED!</h2>
                            <p className="text-3xl font-semibold text-foreground/80 mb-6">Next Wave in: <span className="text-accent">{betweenWaveCountdown}</span></p>
                            <p className="text-xl font-medium text-muted-foreground">{nextWaveHint}</p>
                            {upgradesRemainingToSelect > 0 && (
                                <Button
                                    size="lg"
                                    onClick={() => openUpgradeSelection(gameStoreState.isBossWave)}
                                    onMouseEnter={playHoverSound}
                                    className="font-bold text-lg mt-6 btn-gradient btn-gradient-3 animate-gradient-shift"
                                >
                                    Choose Upgrades ({totalUpgradesToSelect - upgradesRemainingToSelect + 1}/{totalUpgradesToSelect} selected)
                                </Button>
                            )}
                            <Button
                                size="lg"
                                onClick={handleNextWaveStart}
                                onMouseEnter={playHoverSound}
                                className="font-bold text-lg mt-4 btn-gradient btn-gradient-1 animate-gradient-shift"
                            >
                                <Play className="mr-2" />
                                Start Next Wave Now
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {uiState === 'gameOver' && (
                 <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
                    <h2 className="text-7xl font-bold font-headline text-glow">Game Over</h2>
                    <p className="text-4xl font-semibold">
                        Final Score: <span className="font-bold text-accent">{Math.round(gameStoreState.score)}</span>
                    </p>
                    <div className="pt-4 text-2xl font-semibold text-foreground/80">
                        <div className="flex items-center gap-2">
                           <Award className="text-accent" />
                           <span>High Score: {highScore}</span>
                        </div>
                    </div>
                     <Button size="lg" onClick={() => { soundManager.play(SoundType.ButtonClick); loadInitialData();}} onMouseEnter={playHoverSound} className="font-bold text-lg mt-4 w-64 btn-gradient btn-gradient-4 animate-gradient-shift">
                        <Gamepad2 className="mr-2" />
                        Main Menu
                    </Button>
                </div>
            )}
        </main>
    );
}