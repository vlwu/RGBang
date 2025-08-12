
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Game } from './rgbang/game';
import InputHandler, { Keybindings, defaultKeybindings } from './rgbang/input-handler';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Info, LogOut, Pause, Play, Settings, Trash2, History } from 'lucide-react';
import { SettingsModal } from './rgbang/settings-modal';
import { InfoModal } from './rgbang/info-modal';
import { GameColor } from './rgbang/color';
import { UpgradeModal } from './rgbang/upgrade-modal';
import type { Upgrade } from './rgbang/upgrades';
import { getPlayerUpgradeData, unlockUpgrade, PlayerUpgradeData, levelUpUpgrade, resetAllUpgradeData } from './rgbang/upgrade-data';
import { SavedGameState, saveGameState, loadGameState, clearGameState } from './rgbang/save-state';
import { UpgradesOverviewModal } from './rgbang/upgrades-overview-modal';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const DEFAULT_GAME_STATE: SavedGameState = { score: 0, playerHealth: 100, activeUpgrades: new Map(), nextBossScoreThreshold: 150, initialColor: GameColor.RED };

function GameCanvas({ onGameOver, onFragmentCollected, isPaused, width, height, gameRef, initialGameState }: { 
    onGameOver: (score: number) => void, 
    onFragmentCollected: (color: GameColor | null) => void,
    isPaused: boolean,
    width: number,
    height: number,
    gameRef: React.MutableRefObject<Game | null>,
    initialGameState: SavedGameState
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputHandlerRef = useRef(InputHandler.getInstance());
    
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        inputHandlerRef.current.setCanvas(canvas);

        const game = new Game(canvas, onGameOver, onFragmentCollected, initialGameState);
        gameRef.current = game;
        game.start();

        let animationFrameId: number | null = null;
        
        const gameLoop = () => {
             if (gameRef.current) {
                gameRef.current.update(inputHandlerRef.current, isPaused);
             }
             inputHandlerRef.current.resetEvents();
             animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            game.stop();
            gameRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialGameState]);
    
    useEffect(() => {
        if (!canvasRef.current) return;
        canvasRef.current.width = GAME_WIDTH;
        canvasRef.current.height = GAME_HEIGHT;
    }, []);

    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-black" />;
}

export default function Home() {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading' | 'continuePrompt'>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [savedGame, setSavedGame] = useState<SavedGameState | null>(null);
    const [upgradeData, setUpgradeData] = useState<PlayerUpgradeData>({ unlockedUpgradeIds: new Set(), upgradeProgress: new Map() });
    
    // UI Modals State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isUpgradeOverviewOpen, setIsUpgradeOverviewOpen] = useState(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);
    
    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const gameRef = useRef<Game | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });
    const [initialGameState, setInitialGameState] = useState<SavedGameState>(DEFAULT_GAME_STATE);

    // Use a ref to store upgradeData to prevent callback recreation
    const upgradeDataRef = useRef(upgradeData);
    useEffect(() => {
        upgradeDataRef.current = upgradeData;
    }, [upgradeData]);

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
        setHighScore(parseInt(localStorage.getItem('rgBangHighScore') || '0'));
        const savedRun = await loadGameState();
        if (savedRun && savedRun.score > 0) {
            setSavedGame(savedRun);
        } else {
            setSavedGame(null); // Explicitly clear if no valid saved game
        }
        setGameState('menu'); // Always start at the menu

        const data = await getPlayerUpgradeData();
        setUpgradeData(data);
        upgradeDataRef.current = data;

        const savedKeybindings = localStorage.getItem('rgBangKeybindings');
        const currentKeybindings = savedKeybindings ? JSON.parse(savedKeybindings) : defaultKeybindings;
        setKeybindings(currentKeybindings);
        InputHandler.getInstance().setKeybindings(currentKeybindings);
    }, []);

    useEffect(() => {
        loadInitialData();
        window.addEventListener('resize', updateCanvasSize);
        updateCanvasSize();

        const handleBeforeUnload = () => {
             if (gameRef.current) {
                const stateToSave = gameRef.current.getCurrentState();
                if (stateToSave.score > 0) { // Don't save empty games
                    saveGameState(stateToSave);
                }
             }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [loadInitialData, updateCanvasSize]);

    useEffect(() => {
        InputHandler.getInstance().setKeybindings(keybindings);
        localStorage.setItem('rgBangKeybindings', JSON.stringify(keybindings));
    }, [keybindings]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isSettingsOpen || isInfoOpen || isUpgradeModalOpen) {
                    setIsSettingsOpen(false);
                    setIsInfoOpen(false);
                } else if (gameState === 'playing') {
                    setGameState('paused');
                } else if (gameState === 'paused') {
                    setGameState('playing');
                }
            }
             if (e.key.toLowerCase() === keybindings.viewUpgrades.toLowerCase()) {
                if(gameState === 'playing' || gameState === 'paused') {
                    setIsUpgradeOverviewOpen(true);
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === keybindings.viewUpgrades.toLowerCase()) {
                setIsUpgradeOverviewOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }
    }, [gameState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen, keybindings.viewUpgrades]);

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
        if (gameRef.current) {
            const addScoreCallback = (amount: number) => {
                if (gameRef.current) {
                    gameRef.current.addScore(amount);
                }
            };

            if (upgrade.id === 'fallback-score' || upgrade.id === 'fallback-heal') {
                 // The apply method is pre-configured with the right callbacks, just call it
                upgrade.apply(gameRef.current.player, 1, addScoreCallback);
            } else {
                 gameRef.current.player.applyUpgrade(upgrade);
            }

            const inputHandler = InputHandler.getInstance();
            inputHandler.keys.delete('mouse0');
            inputHandler.keys.delete('mouse2');
        }
        
        // Only level up real upgrades, not fallbacks
        if (!upgrade.id.startsWith('fallback-')) {
            await unlockUpgrade(upgrade.id); 
            const finalData = await levelUpUpgrade(upgrade.id);
            setUpgradeData(finalData);
        }

        setIsUpgradeModalOpen(false);
        setGameState('playing');
    }, []);

    const handleGameOver = useCallback((finalScore: number) => {
        setScore(finalScore);
        setGameState('gameOver');
        if (finalScore > highScore) {
            localStorage.setItem('rgBangHighScore', finalScore.toString());
            setHighScore(finalScore);
        }
        clearGameState(); // Clear saved run on game over
        gameRef.current = null; // Clear the game ref
    }, [highScore]);
    
    const startNewRun = async () => {
        await clearGameState();
        const lastColor = localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED;
        setInitialGameState({ ...DEFAULT_GAME_STATE, initialColor: lastColor });
        setScore(0);
        setGameState('playing');
    };
    
    const handlePlayClick = () => {
        if (savedGame) {
            setGameState('continuePrompt');
        } else {
            startNewRun();
        }
    };


    const continueRun = async () => {
        const savedRun = await loadGameState();
        if (savedRun) {
            setInitialGameState(savedRun);
            setGameState('playing');
        } else {
            // Failsafe in case saved data disappears
            startNewRun();
        }
    };
    
    const quitToMenu = () => {
        if (gameRef.current) {
            const currentState = gameRef.current.getCurrentState();
            if (currentState.score > 0) {
                 saveGameState(currentState);
            } else {
                 clearGameState(); // Clear if they quit with 0 score
            }

            if (currentState.score > highScore) {
                localStorage.setItem('rgBangHighScore', currentState.score.toString());
                setHighScore(currentState.score);
            }
            setScore(currentState.score);
            localStorage.setItem('rgBangLastColor', currentState.initialColor);
        }
        gameRef.current = null; // Clear the game ref
        setInitialGameState(DEFAULT_GAME_STATE); // Reset initial game state for the menu
        loadInitialData(); // Reload to check for saved games again
    };

    const resumeGame = () => {
        setGameState('playing');
    };

    const handleResetData = async () => {
        await resetAllUpgradeData();
        await clearGameState();
        localStorage.removeItem('rgBangHighScore');
        localStorage.removeItem('rgBangLastColor');
        await loadInitialData();
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 relative">
             <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                keybindings={keybindings}
                onKeybindingsChange={setKeybindings}
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
                        <Button size="lg" onClick={handlePlayClick} className="font-bold text-lg btn-gradient btn-gradient-1 animate-gradient-shift">
                            <Gamepad2 className="mr-2" />
                            Play
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => setIsSettingsOpen(true)}>
                            <Settings className="mr-2" />
                            Settings
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => setIsInfoOpen(true)}>
                            <Info className="mr-2" />
                            How to Play
                        </Button>
                        <Button size="lg" variant="destructive" onClick={handleResetData}>
                            <Trash2 className="mr-2" />
                            Reset Progress
                        </Button>
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
                        <Button size="lg" onClick={continueRun} className="font-bold text-lg btn-gradient btn-gradient-2 animate-gradient-shift">
                            <History className="mr-2" />
                            Continue Run
                        </Button>
                        <Button size="lg" variant="destructive" onClick={startNewRun}>
                            <Gamepad2 className="mr-2" />
                            Start Fresh
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => setGameState('menu')}>
                            Main Menu
                        </Button>
                    </div>
                </div>
            )}


            {(gameState === 'playing' || gameState === 'paused' || gameState === 'upgrading') && (
                <div className="relative">
                    <GameCanvas
                        key={initialGameState.score + initialGameState.playerHealth} 
                        onGameOver={handleGameOver} 
                        onFragmentCollected={handleFragmentCollected}
                        isPaused={gameState === 'paused' || gameState === 'upgrading' || isUpgradeOverviewOpen}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gameRef={gameRef}
                        initialGameState={initialGameState}
                    />
                    {gameState === 'paused' && (
                         <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20">
                             <h2 className="text-6xl font-bold font-headline tracking-tighter mb-8 text-glow">Paused</h2>
                             <div className="flex flex-col space-y-4 w-52">
                                <Button size="lg" onClick={resumeGame} className="font-bold text-lg btn-gradient btn-gradient-2 animate-gradient-shift">
                                    <Play className="mr-2" />
                                    Resume
                                </Button>
                                <Button size="lg" variant="secondary" onClick={() => setIsSettingsOpen(true)}>
                                    <Settings className="mr-2" />
                                    Settings
                                </Button>
                                <Button size="lg" onClick={quitToMenu} variant="destructive" className="font-bold text-lg">
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
                     <Button size="lg" onClick={() => setGameState('menu')} className="font-bold text-lg mt-4 w-64 btn-gradient btn-gradient-4 animate-gradient-shift">
                        <Gamepad2 className="mr-2" />
                        Main Menu
                    </Button>
                </div>
            )}
        </main>
    );
}
