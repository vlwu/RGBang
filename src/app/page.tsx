
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Game } from './rgbang/game';
import InputHandler, { Keybindings, defaultKeybindings } from './rgbang/input-handler';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Info, LogOut, Pause, Play, Settings } from 'lucide-react';
import { SettingsModal } from './rgbang/settings-modal';
import { InfoModal } from './rgbang/info-modal';
import { GameColor } from './rgbang/color';
import { UpgradeModal } from './rgbang/upgrade-modal';
import type { Upgrade } from './rgbang/upgrades';
import { getUnlockedUpgrades, unlockUpgrade } from './rgbang/persistent-unlocks';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

function GameCanvas({ onGameOver, onFragmentCollected, isPaused, inputHandler, width, height, gameRef, initialColor }: { 
    onGameOver: (score: number) => void, 
    onFragmentCollected: (color: GameColor | null) => void,
    isPaused: boolean,
    inputHandler: InputHandler,
    width: number,
    height: number,
    gameRef: React.MutableRefObject<Game | null>,
    initialColor: GameColor
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = GAME_WIDTH;
            canvas.height = GAME_HEIGHT;
            
            InputHandler.getInstance(canvas);
            
            const game = new Game(canvas, onGameOver, onFragmentCollected, inputHandler, initialColor);
            gameRef.current = game;
            game.start();

            return () => {
                game.stop();
            };
        }
    }, [onGameOver, onFragmentCollected, inputHandler, gameRef, initialColor]);

    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.isRunning = !isPaused;
        }
    }, [isPaused, gameRef]);


    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-black" />;
}

export default function Home() {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'upgrading'>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lastSelectedColor, setLastSelectedColor] = useState<GameColor>(GameColor.RED);
    const [unlockedUpgrades, setUnlockedUpgrades] = useState<Set<string>>(new Set());
    
    // UI Modals State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);
    
    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const inputHandlerRef = useRef<InputHandler | null>(null);
    const gameRef = useRef<Game | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });

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

    useEffect(() => {
        setHighScore(parseInt(localStorage.getItem('rgBangHighScore') || '0'));
        setLastSelectedColor(localStorage.getItem('rgBangLastColor') as GameColor || GameColor.RED);
        setUnlockedUpgrades(getUnlockedUpgrades());

        inputHandlerRef.current = InputHandler.getInstance();
        const savedKeybindings = localStorage.getItem('rgBangKeybindings');
        if (savedKeybindings) {
            setKeybindings(JSON.parse(savedKeybindings));
        } else {
            setKeybindings(defaultKeybindings);
        }

        window.addEventListener('resize', updateCanvasSize);
        updateCanvasSize();

        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [updateCanvasSize]);

    useEffect(() => {
        if(inputHandlerRef.current) {
            inputHandlerRef.current.setKeybindings(keybindings);
        }
        localStorage.setItem('rgBangKeybindings', JSON.stringify(keybindings));
    }, [keybindings]);
    
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isSettingsOpen || isInfoOpen || isUpgradeModalOpen) {
                    setIsSettingsOpen(false);
                    setIsInfoOpen(false);
                    // Do not close upgrade modal with Esc for now to prevent accidental skips
                } else if (gameState === 'playing') {
                    setGameState('paused');
                } else if (gameState === 'paused') {
                    setGameState('playing');
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState, isSettingsOpen, isInfoOpen, isUpgradeModalOpen]);

    const handleFragmentCollected = useCallback((color: GameColor | null) => {
        if (gameRef.current) {
            const options = gameRef.current.player.upgradeManager.getUpgradeOptions(color, unlockedUpgrades);
            setUpgradeOptions(options);
            setGameState('upgrading');
            setIsUpgradeModalOpen(true);
        }
    }, [unlockedUpgrades]);
    
    const handleUpgradeSelected = useCallback((upgrade: Upgrade) => {
        if (gameRef.current) {
            gameRef.current.player.applyUpgrade(upgrade);
        }
        // Update the unlocked upgrades state
        unlockUpgrade(upgrade.id);
        setUnlockedUpgrades(getUnlockedUpgrades());

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
        if (gameRef.current?.player) {
            localStorage.setItem('rgBangLastColor', gameRef.current.player.currentColor);
        }
    }, [highScore]);

    const startGame = () => {
        setScore(0);
        setGameState('playing');
    };
    
    const quitToMenu = () => {
        if (gameRef.current) {
            const currentScore = gameRef.current.getCurrentScore();
            if (currentScore > highScore) {
                localStorage.setItem('rgBangHighScore', currentScore.toString());
                setHighScore(currentScore);
            }
            setScore(currentScore);
            if(gameRef.current.player) {
                localStorage.setItem('rgBangLastColor', gameRef.current.player.currentColor);
                setLastSelectedColor(gameRef.current.player.currentColor);
            }
        }
        setGameState('menu');
    };

    const resumeGame = () => {
        setGameState('playing');
    };

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
            />

            {gameState === 'menu' && (
                <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
                    <h1 className="text-8xl font-bold tracking-tighter font-headline">
                        <span className="bg-gradient-to-r from-red-400 via-green-400 to-blue-500 bg-clip-text text-transparent">RGB</span>
                        <span>ang</span>
                    </h1>
                    <div className="flex flex-col gap-4 w-64">
                        <Button size="lg" onClick={startGame} className="font-bold text-lg btn-gradient btn-gradient-1 animate-gradient-shift">
                            <Gamepad2 className="mr-2" />
                            Play Game
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => setIsSettingsOpen(true)}>
                            <Settings className="mr-2" />
                            Settings
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => setIsInfoOpen(true)}>
                            <Info className="mr-2" />
                            How to Play
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

            {(gameState === 'playing' || gameState === 'paused' || gameState === 'upgrading') && inputHandlerRef.current && (
                <div className="relative">
                    <GameCanvas 
                        onGameOver={handleGameOver} 
                        onFragmentCollected={handleFragmentCollected}
                        isPaused={gameState === 'paused' || gameState === 'upgrading'}
                        inputHandler={inputHandlerRef.current}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        gameRef={gameRef}
                        initialColor={lastSelectedColor}
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
                     <Button size="lg" onClick={quitToMenu} className="font-bold text-lg mt-4 w-64 btn-gradient btn-gradient-4 animate-gradient-shift">
                        <Gamepad2 className="mr-2" />
                        Main Menu
                    </Button>
                </div>
            )}
        </main>
    );
}
