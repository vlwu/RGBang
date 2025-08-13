"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Game } from './rgbang/game';
import InputHandler, { Keybindings, defaultKeybindings } from './rgbang/input-handler';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Info, LogOut, Pause, Play, Settings, Trash2, History, X } from 'lucide-react';
import { SettingsModal } from './rgbang/settings-modal';
import { InfoModal } from './rgbang/info-modal';
import { GameColor } from './rgbang/color';
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

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const DEFAULT_GAME_STATE: SavedGameState = { score: 0, playerHealth: 100, activeUpgrades: new Map<string, number>(), nextBossScoreThreshold: 150, initialColor: GameColor.RED };

function GameCanvas({ onGameOver, onFragmentCollected, width, height, gameRef, initialGameState }: {
    onGameOver: (score: number) => void,
    onFragmentCollected: (color: GameColor | null) => void,
    width: number,
    height: number,
    gameRef: React.MutableRefObject<Game | null>,
    initialGameState: SavedGameState,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputHandler = InputHandler.getInstance();

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;


        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;

        inputHandler.setCanvas(canvas);

        const game = new Game(canvas, onGameOver, onFragmentCollected, initialGameState, soundManager);
        gameRef.current = game;
        game.start();

        return () => {
            game.stop();
        };

    }, [initialGameState, onGameOver, onFragmentCollected, gameRef, inputHandler]);

    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-black" />;
}

export default function Home() {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'continuePrompt'>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);
    const [upgradeData, setUpgradeData] = useState<PlayerUpgradeData>({ unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() });
    const [runUpgrades, setRunUpgrades] = useState<Map<string, number>>(new Map<string, number>());


    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isUpgradeOverviewOpen, setIsUpgradeOverviewOpen] = useState(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);

    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const gameRef = useRef<Game | null>(null);
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
        } else {
            setSavedGame(null);
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
            if (gameRef.current && (gameState === 'playing' || gameState === 'paused')) {
                const stateToSave = gameRef.current.getCurrentState();
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


    useEffect(() => {
        let animationFrameId: number | null = null;
        const inputHandler = inputHandlerRef.current;

        const gameLoop = () => {
            if (!gameRef.current) return;

            const isPausedForModal = gameState === 'paused' || gameState === 'upgrading' || isUpgradeOverviewOpen;


            if (!isPausedForModal) {
                gameRef.current.update(inputHandler);
            } else {


                const isInputPaused = gameRef.current.player.isRadialMenuOpen || isPausedForModal;
                gameRef.current.player.update(inputHandler, gameRef.current.createBullet, gameRef.current.particles, gameRef.current.canvas.width, gameRef.current.canvas.height, isInputPaused);
            }

            gameRef.current.draw();

            inputHandler.resetEvents();
            animationFrameId = requestAnimationFrame(gameLoop);
        };


        if(gameState === 'playing' || gameState === 'paused' || gameState === 'upgrading'){
            animationFrameId = requestAnimationFrame(gameLoop);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

    }, [gameState, isUpgradeOverviewOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isSettingsOpen || isInfoOpen || isUpgradeModalOpen) {
                    setIsSettingsOpen(false);
                    setIsInfoOpen(false);
                } else if (gameState === 'playing') {
                    setGameState('paused');
                    soundManager.play(SoundType.GamePause);
                } else if (gameState === 'paused') {
                    setGameState('playing');
                    soundManager.play(SoundType.GameResume);
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
    }, [gameState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen, isUpgradeOverviewOpen]);

    const handleFragmentCollected = useCallback((color: GameColor | null) => {
        if (gameRef.current) {
            const addScoreCallback = (amount: number) => {
                if (gameRef.current) {
                    gameRef.current.addScore(amount);
                }
            };
            const options = gameRef.current.player.upgradeManager.getUpgradeOptions(color, upgradeDataRef.current, addScoreCallback);
            setUpgradeOptions(options);
            setGameState('upgrading');
            setIsUpgradeModalOpen(true);
        }
    }, []);

    const handleUpgradeSelected = useCallback(async (upgrade: Upgrade) => {
        soundManager.play(SoundType.UpgradeSelect);
        if (gameRef.current) {
            const addScoreCallback = (amount: number) => {
                if (gameRef.current) {
                    gameRef.current.addScore(amount);
                }
            };

            if (upgrade.id.startsWith('max-out-')) {
                const originalId = upgrade.id.replace('max-out-', '');
                const originalUpgrade = ALL_UPGRADES.find(u => u.id === originalId);

                if (originalUpgrade) {
                    gameRef.current.player.upgradeManager.applyMax(originalUpgrade);
                    setRunUpgrades(new Map(runUpgrades.set(originalId, originalUpgrade.getMaxLevel())));

                    const data = await getPlayerUpgradeData();
                    data.unlockedUpgradeIds.add(originalId);
                    data.upgradeProgress.set(originalId, { level: originalUpgrade.getMaxLevel() });
                    await savePlayerUpgradeData(data);
                    setUpgradeData(data);
                    upgradeDataRef.current = data;
                }
            } else if (upgrade.id.startsWith('fallback-')) {
                upgrade.apply(gameRef.current.player, 1, addScoreCallback);
            } else {
                 gameRef.current.player.applyUpgrade(upgrade);
                 const currentLevel = runUpgrades.get(upgrade.id) || 0;
                 setRunUpgrades(new Map(runUpgrades.set(upgrade.id, currentLevel + 1)));

                 await unlockUpgrade(upgrade.id);
                 const finalData = await levelUpUpgrade(upgrade.id);
                 setUpgradeData(finalData);
                 upgradeDataRef.current = finalData;
            }
        }

        setIsUpgradeModalOpen(false);
        setGameState('playing');
        soundManager.play(SoundType.GameResume);
    }, [runUpgrades]);

    const handleGameOver = useCallback((finalScore: number) => {
        setScore(finalScore);
        setGameState('gameOver');
        if (finalScore > highScore) {
            localStorage.setItem('rgBangHighScore', finalScore.toString());
            setHighScore(finalScore);
        }
        clearGameState();
        gameRef.current = null;
    }, [highScore]);

    const resetGameAndUpgradeState = () => {
        const freshUpgradeData: PlayerUpgradeData = { unlockedUpgradeIds: new Set<string>(), upgradeProgress: new Map<string, UpgradeProgress>() };
        setUpgradeData(freshUpgradeData);
        upgradeDataRef.current = freshUpgradeData;
        setRunUpgrades(new Map<string, number>());
        setScore(0);
        setSavedGame(null);
    };

    const startNewRun = async () => {
        await clearGameState();
        resetGameAndUpgradeState();
        const lastColor = localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED;
        const uniqueKey = Math.random();
        setInitialGameState({ ...DEFAULT_GAME_STATE, initialColor: lastColor, score: uniqueKey });
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

            setInitialGameState(savedRun);
            setGameState('playing');
        } else {
            startNewRun();
        }
    };

    const quitToMenu = () => {
        soundManager.play(SoundType.GameQuit);
        if (gameRef.current) {
            const currentState = gameRef.current.getCurrentState();
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
        }
        gameRef.current = null;
        loadInitialData();
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
                onClose={() => setIsInfoOpen(false)}
            />
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                options={upgradeOptions}
                onSelect={handleUpgradeSelected}
                upgradeData={upgradeData}
                runUpgrades={runUpgrades}
            />
            <UpgradesOverviewModal
                isOpen={isUpgradeOverviewOpen}
                upgradeManager={gameRef.current?.player.upgradeManager}
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

            {gameState === 'continuePrompt' && savedGame && (
                 <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
                    <h1 className="text-6xl font-bold tracking-tighter font-headline">
                        Welcome Back!
                    </h1>
                     <div className="text-2xl font-semibold text-foreground/80">
                        <p>You have a run in progress.</p>
                        <p>Score: <span className="font-bold text-accent">{savedGame.score}</span></p>
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


            {(gameState === 'playing' || gameState === 'paused' || gameState === 'upgrading') && (
                <div className="relative">
                    <GameCanvas
                        key={`${initialGameState.score}-${initialGameState.playerHealth}-${initialGameState.initialColor}`}
                        onGameOver={handleGameOver}
                        onFragmentCollected={handleFragmentCollected}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gameRef={gameRef}
                        initialGameState={initialGameState}
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
                </div>
            )}

            {gameState === 'gameOver' && (
                 <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
                    <h2 className="text-7xl font-bold font-headline text-glow">Game Over</h2>
                    <p className="text-4xl font-semibold">
                        Final Score: <span className="font-bold text-accent">{score}</span>
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