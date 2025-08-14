"use client";

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { Game } from './rgbang/game';
import InputHandler, { Keybindings, defaultKeybindings } from './rgbang/input-handler';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Info, LogOut, Pause, Play, Settings, Trash2, History, X } from 'lucide-react';
import { SettingsModal } from './rgbang/settings-modal';
import { InfoModal } from './rgbang/info-modal'; // Correct import
import { GameColor, PRIMARY_COLORS, getRandomElement } from './rgbang/color';
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

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const DEFAULT_GAME_STATE: SavedGameState = { score: 0, playerHealth: 100, activeUpgrades: new Map<string, number>(), nextBossScoreThreshold: 150, initialColor: GameColor.RED, currentWave: 0 };


interface GameCanvasHandle {
    getGameInstance: () => Game | null;
    // Removed startGameLoop and stopGameLoop as GameCanvas now manages its own loop internally
}


const GameCanvas = React.forwardRef<GameCanvasHandle, {
    onGameOver: (score: number) => void,
    onFragmentCollected: (color: GameColor | null) => void,
    onWaveCompleted: (waveNumber: number, isBossWave: boolean, fragmentsToAward: number) => void,
    width: number,
    height: number,
    initialGameState: SavedGameState,
    isGamePausedExternally: boolean;
}> (({ onGameOver, onFragmentCollected, onWaveCompleted, width, height, initialGameState, isGamePausedExternally }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameInstanceRef = useRef<Game | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const inputHandler = InputHandler.getInstance();

    // NEW: Create a ref to hold the external pause state
    const isGamePausedRef = useRef(isGamePausedExternally);

    // NEW: Update the ref whenever the isGamePausedExternally prop changes
    useEffect(() => {
        isGamePausedRef.current = isGamePausedExternally;
    }, [isGamePausedExternally]);


    const gameLoop = useCallback(() => {
        if (!gameInstanceRef.current || !canvasRef.current) {
            animationFrameIdRef.current = null;
            return;
        }

        // Use the ref's current value for pausing, ensuring gameLoop's identity is stable
        gameInstanceRef.current.update(inputHandler, isGamePausedRef.current);
        gameInstanceRef.current.draw();

        inputHandler.resetEvents();
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    }, [inputHandler]); // Removed isGamePausedExternally from dependencies


    useImperativeHandle(ref, () => ({
        getGameInstance: () => gameInstanceRef.current,
    }));


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.warn("Canvas element not found on mount.");
            return;
        }

        canvas.width = width;
        canvas.height = height;

        inputHandler.setCanvas(canvas);

        // Only create a new Game instance if one doesn't exist,
        // or if the initialGameState object reference changes, implying a new game session.
        // The gameLoop function is now stable, so it won't cause this useEffect to re-run on pause/unpause.
        console.log("Creating new Game instance with initialGameState:", initialGameState);
        gameInstanceRef.current = new Game(
            canvas,
            onGameOver,
            onFragmentCollected,
            onWaveCompleted,
            initialGameState,
            soundManager
        );
        gameInstanceRef.current.start(); // This initializes the Game instance and its internal state


        if (animationFrameIdRef.current === null) {
             animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        }

        return () => {
            console.log("GameCanvas unmount cleanup.");
            if (animationFrameIdRef.current !== null) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
            if (gameInstanceRef.current) {
                gameInstanceRef.current.stop();
                gameInstanceRef.current = null;
            }
            // Ensure input handler listeners are cleaned up when the canvas unmounts
            inputHandler.destroy();
        };
    }, [width, height, onGameOver, onFragmentCollected, onWaveCompleted, initialGameState, inputHandler, gameLoop, soundManager]);


    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-black" />;
});

GameCanvas.displayName = 'GameCanvas';

export default function Home() {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'continuePrompt' | 'betweenWaves'>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);
    const [upgradeData, setUpgradeData] = useState<PlayerUpgradeData>({ unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() });
    const [runUpgrades, setRunUpgrades] = useState<Map<string, number>>(new Map<string, number>());
    const [currentWave, setCurrentWave] = useState(0);
    const [nextWaveHint, setNextWaveHint] = useState("");
    const [betweenWaveCountdown, setBetweenWaveCountdown] = useState(0);
    const [upgradesRemainingToSelect, setUpgradesRemainingToSelect] = useState(0);
    const [totalUpgradesToSelect, setTotalUpgradesToSelect] = useState(0);


    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Correct state variable name
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

        if(newWidth > GAME_WIDTH) {
            newWidth = GAME_WIDTH;
            newHeight = GAME_HEIGHT;
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
        } else {
            setSavedGame(null);
            setCurrentWave(0);
        }

        const data = await getPlayerUpgradeData();
        setUpgradeData(data);
        upgradeDataRef.current = data;

        const savedKeybindings = localStorage.getItem('rgBangKeybindings');
        const currentKeybindings = savedKeybindings ? JSON.parse(savedKeybindings) : defaultKeybindings;
        setKeybindings(currentKeybindings);
        inputHandlerRef.current.setKeybindings(currentKeybindings);
        setGameState('menu');
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
            if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance() && (gameState === 'playing' || gameState === 'paused' || gameState === 'betweenWaves' || gameState === 'upgrading')) {
                const stateToSave = gameCanvasRef.current.getGameInstance()!.getCurrentState();
                if (stateToSave.score > 0) {
                    saveGameState(stateToSave);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [gameState]);


    useEffect(() => {
        inputHandlerRef.current.setKeybindings(keybindings);
        localStorage.setItem('rgBangKeybindings', JSON.stringify(keybindings));
    }, [keybindings]);

    const handleNextWaveStart = useCallback(() => {
        if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
            const nextWaveNum = currentWave + 1;
            setCurrentWave(nextWaveNum);
            gameCanvasRef.current.getGameInstance()!.startWave(nextWaveNum);
            setGameState('playing');
            soundManager.play(SoundType.GameResume);
        }
    }, [currentWave]);

    const startCountdown = useCallback(() => {
        let countdownInterval: NodeJS.Timeout | null = null;
        // Clear any existing interval to prevent multiple countdowns
        if (countdownInterval) clearInterval(countdownInterval);
        setBetweenWaveCountdown(5);
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

        return () => {
            if (countdownInterval) clearInterval(countdownInterval);
        };
    }, [handleNextWaveStart]);


    // Effect to manage the overall game loop start/stop based on gameState
    // This effect ensures the GameCanvas component is mounted/unmounted based on game state
    // and handles the between-waves countdown.
    useEffect(() => {
        // If the game is in a state where GameCanvas should be rendered and between waves
        if (gameState === 'betweenWaves' && betweenWaveCountdown === 0) {
            // Initiate countdown for next wave
            const cleanupCountdown = startCountdown();
            return cleanupCountdown;
        }

    }, [gameState, isUpgradeOverviewOpen, betweenWaveCountdown, startCountdown]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isSettingsOpen || isInfoOpen || isUpgradeModalOpen) {
                    // Close any open modals
                    setIsSettingsOpen(false);
                    setIsInfoOpen(false);
                    if (isUpgradeModalOpen) {
                        setIsUpgradeModalOpen(false);
                        // If upgrade modal was open, go back to between waves state
                        setGameState('betweenWaves');
                        setBetweenWaveCountdown(0); // Restart countdown or ensure it proceeds
                        soundManager.play(SoundType.GamePause); // Play pause sound for consistency
                    }
                } else if (gameState === 'playing') {
                    setGameState('paused');
                    soundManager.play(SoundType.GamePause);
                } else if (gameState === 'paused') {
                    setGameState('playing');
                    soundManager.play(SoundType.GameResume);
                } else if (gameState === 'betweenWaves') {
                    // Allow skipping the countdown from betweenWaves state
                    handleNextWaveStart();
                }
            }
             if (e.key.toLowerCase() === keybindingsRef.current.viewUpgrades.toLowerCase() && !isUpgradeOverviewOpen) {
                 if(gameState === 'playing' || gameState === 'paused') {
                    setIsUpgradeOverviewOpen(true);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === keybindingsRef.current.viewUpgrades.toLowerCase()) {
                setIsUpgradeOverviewOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }
    }, [gameState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen, isUpgradeOverviewOpen, handleNextWaveStart]);


    const handleFragmentCollected = useCallback((color: GameColor | null) => {
        console.log(`Fragment of color ${color} collected. (No immediate effect in wave mode)`);
    }, []);

    const handleWaveCompleted = useCallback((waveNumber: number, isBossWave: boolean, fragmentsToAward: number) => {
        setScore(gameCanvasRef.current?.getGameInstance()?.getCurrentState().score || 0);

        const waveConfig = WAVE_CONFIGS.find(w => w.waveNumber === waveNumber + 1) || FALLBACK_WAVE_CONFIG;
        setNextWaveHint(waveConfig.nextWaveHint);

        if (fragmentsToAward > 0) {
            setUpgradesRemainingToSelect(fragmentsToAward);
            setTotalUpgradesToSelect(fragmentsToAward);
            if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
                const options = gameCanvasRef.current.getGameInstance()!.player.upgradeManager.getUpgradeOptions(
                    isBossWave ? null : getRandomElement(PRIMARY_COLORS),
                    upgradeDataRef.current,
                    gameCanvasRef.current.getGameInstance()!.addScore
                );
                setUpgradeOptions(options);
            }
            setIsUpgradeModalOpen(true);
            setGameState('upgrading');
            soundManager.play(SoundType.GamePause);
        } else {
            setGameState('betweenWaves');
            setBetweenWaveCountdown(0);
            soundManager.play(SoundType.GamePause);
        }
        setCurrentWave(waveNumber);
    }, []);

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

            // Decrement the counter and check if more upgrades are left
            setUpgradesRemainingToSelect(prev => {
                const newCount = prev - 1;
                if (newCount <= 0) {
                    // No more upgrades to select, close modal and proceed to next wave phase
                    setIsUpgradeModalOpen(false);
                    setGameState('betweenWaves');
                    setBetweenWaveCountdown(0);
                    soundManager.play(SoundType.GamePause);
                } else {
                    // Still more upgrades to select, generate new options
                    if (gameInstance) {
                        const currentWaveConfig = WAVE_CONFIGS.find(w => w.waveNumber === currentWave) || FALLBACK_WAVE_CONFIG;
                        const nextFragmentColor = currentWaveConfig.bossType ? null : getRandomElement(PRIMARY_COLORS);

                        const newOptions = gameInstance.player.upgradeManager.getUpgradeOptions(
                            nextFragmentColor,
                            upgradeDataRef.current,
                            gameInstance.addScore
                        );
                        setUpgradeOptions(newOptions);
                    }
                }
                return newCount;
            });
        }
    }, [runUpgrades, currentWave, soundManager, upgradeDataRef]);

    const handleGameOver = useCallback((finalScore: number) => {
        setScore(finalScore);
        setGameState('gameOver');
        if (finalScore > highScore) {
            localStorage.setItem('rgBangHighScore', finalScore.toString());
            setHighScore(finalScore);
        }
        clearGameState();
    }, [highScore]);

    const resetGameAndUpgradeState = () => {
        const freshUpgradeData: PlayerUpgradeData = { unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() };
        setUpgradeData(freshUpgradeData);
        upgradeDataRef.current = freshUpgradeData;
        setRunUpgrades(new Map<string, number>());
        setScore(0);
        setSavedGame(null);
        setCurrentWave(0);
    };

    const startNewRun = async () => {
        await clearGameState();
        resetGameAndUpgradeState();
        const lastColor = localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED;
        // Set a new object identity for initialGameState to ensure GameCanvas re-initializes
        const newInitialGameState = { ...DEFAULT_GAME_STATE, initialColor: lastColor, currentWave: 0 };
        setInitialGameState(newInitialGameState);
        setGameState('playing');
    };

    const handlePlayClick = () => {
        soundManager.play(SoundType.ButtonClick);
        if (savedGame) {
            setGameState('continuePrompt');
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

            setInitialGameState(savedRun); // This will cause GameCanvas to re-render and re-initialize
            setGameState('playing');
        } else {
            startNewRun();
        }
    };

    const quitToMenu = () => {
        soundManager.play(SoundType.GameQuit);
        if (gameCanvasRef.current && gameCanvasRef.current.getGameInstance()) {
            const currentState = gameCanvasRef.current.getGameInstance()!.getCurrentState();
            if (currentState.score > 0) {
                 saveGameState(currentState);
            } else {
                 clearGameState();
            }

            if (currentState.score > highScore) {
                localStorage.setItem('rgBangHighScore', currentState.score.toString());
                setHighScore(currentState.score);
            }
            setScore(currentState.score);
            localStorage.setItem('rgBangLastColor', currentState.initialColor);
            setCurrentWave(currentState.currentWave);
        }
        setGameState('menu'); // This will cause GameCanvas to unmount
        loadInitialData(); // Load menu specific data
    };

    const resumeGame = () => {
        soundManager.play(SoundType.GameResume);
        setGameState('playing');
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

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 relative">
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
                onClose={() => setIsInfoOpen(false)} // Corrected: setIsInfoExample -> setIsInfoOpen
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


            {gameState === 'menu' && (
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
                         <Button size="lg" variant="secondary" onClick={() => { soundManager.play(SoundType.ButtonClick); setIsInfoOpen(true); }} onMouseEnter={playHoverSound}> {/* Corrected: setIsInfoExample -> setIsInfoOpen */}
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

            {gameState === 'continuePrompt' && savedGame && (
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
                         <Button size="lg" variant="secondary" onClick={() => { soundManager.play(SoundType.ButtonClick); setGameState('menu'); }} onMouseEnter={playHoverSound}>
                            Main Menu
                        </Button>
                    </div>
                </div>
            )}


            {(gameState === 'playing' || gameState === 'paused' || gameState === 'upgrading' || gameState === 'betweenWaves') && (
                <div className="relative">
                    <GameCanvas
                        onGameOver={handleGameOver}
                        onFragmentCollected={handleFragmentCollected}
                        onWaveCompleted={handleWaveCompleted}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        isGamePausedExternally={gameState === 'paused' || gameState === 'upgrading' || isUpgradeOverviewOpen || gameState === 'betweenWaves'}
                        initialGameState={initialGameState}
                        ref={gameCanvasRef}
                    />
                    {gameState === 'paused' && (
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
                    {gameState === 'betweenWaves' && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20">
                            <h2 className="text-6xl font-bold font-headline tracking-tighter mb-4 text-glow">WAVE {currentWave} CLEARED!</h2>
                            <p className="text-3xl font-semibold text-foreground/80 mb-6">Next Wave in: <span className="text-accent">{betweenWaveCountdown}</span></p>
                            <p className="text-xl font-medium text-muted-foreground">{nextWaveHint}</p>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'gameOver' && (
                 <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
                    <h2 className="text-7xl font-bold font-headline text-glow">Game Over</h2>
                    <p className="text-4xl font-semibold">
                        Final Score: <span className="font-bold text-accent">{Math.round(score)}</span>
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