
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Game } from './rgbang/game';
import InputHandler, { Keybindings, defaultKeybindings } from './rgbang/input-handler';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Github, Waves, Pause, Play, LogOut, Settings } from 'lucide-react';
import { SettingsModal } from './rgbang/settings-modal';

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;

function GameCanvas({ onGameOver, isPaused, inputHandler, width, height }: { 
    onGameOver: (score: number) => void, 
    isPaused: boolean,
    inputHandler: InputHandler,
    width: number,
    height: number
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            // Set the internal resolution
            canvas.width = GAME_WIDTH;
            canvas.height = GAME_HEIGHT;
            
            InputHandler.getInstance(canvas);
            
            const game = new Game(canvas, onGameOver, inputHandler);
            gameRef.current = game;
            game.start();

            return () => {
                game.stop();
            };
        }
    }, [onGameOver, inputHandler]);

    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.isRunning = !isPaused;
        }
    }, [isPaused]);


    return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px` }} className="rounded-lg shadow-2xl shadow-primary/20 border-2 border-primary/20" />;
}

export default function Home() {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [keybindings, setKeybindings] = useState<Keybindings>(defaultKeybindings);
    const inputHandlerRef = useRef<InputHandler | null>(null);
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

        setCanvasSize({ width: newWidth, height: newHeight });
    }, []);

    useEffect(() => {
        setHighScore(parseInt(localStorage.getItem('rgBangHighScore') || '0'));
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
                if (isSettingsOpen) {
                    setIsSettingsOpen(false);
                } else if (gameState === 'playing') {
                    setGameState('paused');
                } else if (gameState === 'paused') {
                    setGameState('playing');
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState, isSettingsOpen]);


    const handleGameOver = useCallback((finalScore: number) => {
        setScore(finalScore);
        setGameState('gameOver');
        if (finalScore > highScore) {
            localStorage.setItem('rgBangHighScore', finalScore.toString());
            setHighScore(finalScore);
        }
    }, [highScore]);

    const startGame = () => {
        setScore(0);
        setGameState('playing');
    };
    
    const quitToMenu = () => {
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

            {gameState === 'menu' && (
                <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
                    <h1 className="text-7xl font-bold tracking-tighter text-primary font-headline">RGBang</h1>
                    <p className="text-xl text-foreground/80 max-w-2xl">
                        An intense arcade shooter where you must mix colors to survive. Use <kbd className="p-1 rounded bg-muted">1</kbd> <kbd className="p-1 rounded bg-muted">2</kbd> <kbd className="p-1 rounded bg-muted">3</kbd> to select primary colors and hold <kbd className="p-1 rounded bg-muted">Shift</kbd> to combine them.
                    </p>
                    <div className="flex gap-4">
                        <Button size="lg" onClick={startGame} className="font-bold text-lg">
                            <Gamepad2 className="mr-2" />
                            Play Game
                        </Button>
                         <Button size="lg" variant="secondary" onClick={() => setIsSettingsOpen(true)} className="font-bold text-lg">
                            <Settings className="mr-2" />
                            Settings
                        </Button>
                    </div>
                    <div className="flex gap-8 pt-4 text-lg">
                        <div className="flex items-center gap-2">
                            <Award className="text-accent" />
                            <span>High Score: {highScore}</span>
                        </div>
                    </div>
                </div>
            )}

            {(gameState === 'playing' || gameState === 'paused') && inputHandlerRef.current && (
                <div className="relative">
                    <GameCanvas 
                        onGameOver={handleGameOver} 
                        isPaused={gameState === 'paused'}
                        inputHandler={inputHandlerRef.current}
                        width={canvasSize.width}
                        height={canvasSize.height}
                    />
                    {gameState === 'paused' && (
                         <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20">
                             <h2 className="text-6xl font-bold text-primary font-headline tracking-tighter mb-8">Paused</h2>
                             <div className="flex flex-col space-y-4 w-52">
                                <Button size="lg" onClick={resumeGame} className="font-bold text-lg">
                                    <Play className="mr-2" />
                                    Resume
                                </Button>
                                <Button size="lg" variant="secondary" onClick={() => setIsSettingsOpen(true)}>
                                    <Settings className="mr-2" />
                                    Settings
                                </Button>
                                <Button size="lg" onClick={quitToMenu} variant="destructive" className="font-bold text-lg">
                                     <LogOut className="mr-2" />
                                     Quit
                                 </Button>
                             </div>
                         </div>
                    )}
                </div>
            )}

            {gameState === 'gameOver' && (
                <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
                    <h2 className="text-6xl font-bold text-primary/80 font-headline">Game Over</h2>
                    <div className="text-2xl space-y-2">
                        <p>Final Score: <span className="font-bold text-accent">{score}</span></p>
                    </div>
                    <div className="flex gap-8 pt-4 text-lg">
                        <div className="flex items-center gap-2">
                            <Award className="text-accent" />
                            <span>High Score: {highScore}</span>
                        </div>
                    </div>
                     <Button size="lg" onClick={quitToMenu} className="font-bold text-lg mt-4">
                        <Gamepad2 className="mr-2" />
                        Main Menu
                    </Button>
                </div>
            )}
        </main>
    );
}
