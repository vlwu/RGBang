"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Game } from './chroma-clash/game';
import { Button } from '@/components/ui/button';
import { Award, Gamepad2, Github, Waves } from 'lucide-react';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

function GameCanvas({ onGameOver, setScore, setWave }: { 
    onGameOver: () => void, 
    setScore: (score: number) => void,
    setWave: (wave: number) => void 
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;
            
            const game = new Game(canvas, onGameOver, setScore, setWave);
            gameRef.current = game;
            game.start();

            return () => {
                game.stop();
            };
        }
    }, [onGameOver, setScore, setWave]);

    return <canvas ref={canvasRef} className="rounded-lg shadow-2xl shadow-primary/20 border-2 border-primary/20" />;
}

export default function Home() {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
    const [score, setScore] = useState(0);
    const [wave, setWave] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [bestWave, setBestWave] = useState(0);

    useEffect(() => {
        setHighScore(parseInt(localStorage.getItem('rgBangHighScore') || '0'));
        setBestWave(parseInt(localStorage.getItem('rgBangBestWave') || '0'));
    }, []);

    const handleGameOver = useCallback(() => {
        setGameState('gameOver');
        if (score > highScore) {
            localStorage.setItem('rgBangHighScore', score.toString());
            setHighScore(score);
        }
        if (wave > bestWave) {
            localStorage.setItem('rgBangBestWave', wave.toString());
            setBestWave(wave);
        }
    }, [score, highScore, wave, bestWave]);

    const startGame = () => {
        setScore(0);
        setWave(0);
        setGameState('playing');
    };
    
    const restartGame = () => {
        setGameState('menu');
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
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
                    </div>
                    <div className="flex gap-8 pt-4 text-lg">
                        <div className="flex items-center gap-2">
                            <Award className="text-accent" />
                            <span>High Score: {highScore}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Waves className="text-accent" />
                            <span>Best Wave: {bestWave}</span>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'playing' && (
                <GameCanvas onGameOver={handleGameOver} setScore={setScore} setWave={setWave} />
            )}

            {gameState === 'gameOver' && (
                <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
                    <h2 className="text-6xl font-bold text-primary/80 font-headline">Game Over</h2>
                    <div className="text-2xl space-y-2">
                        <p>Final Score: <span className="font-bold text-accent">{score}</span></p>
                        <p>You reached Wave: <span className="font-bold text-accent">{wave}</span></p>
                    </div>
                    <div className="flex gap-8 pt-4 text-lg">
                        <div className="flex items-center gap-2">
                            <Award className="text-accent" />
                            <span>High Score: {highScore}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Waves className="text-accent" />
                            <span>Best Wave: {bestWave}</span>
                        </div>
                    </div>
                     <Button size="lg" onClick={restartGame} className="font-bold text-lg mt-4">
                        <Gamepad2 className="mr-2" />
                        Main Menu
                    </Button>
                </div>
            )}
        </main>
    );
}
