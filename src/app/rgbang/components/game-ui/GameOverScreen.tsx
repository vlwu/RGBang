"use client";

import { Button } from "@/components/ui/button";
import { Award, Gamepad2 } from "lucide-react";

type GameOverScreenProps = {
    finalScore: number;
    highScore: number;
    onBackToMenu: () => void;
    playHoverSound: () => void;
};

export function GameOverScreen({ finalScore, highScore, onBackToMenu, playHoverSound }: GameOverScreenProps) {
    return (
        <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
            <h2 className="text-7xl font-bold font-headline text-glow">Game Over</h2>
            <p className="text-4xl font-semibold">
                Final Score: <span className="font-bold text-accent">{Math.round(finalScore)}</span>
            </p>
            <div className="pt-4 text-2xl font-semibold text-foreground/80">
                <div className="flex items-center gap-2">
                    <Award className="text-accent" />
                    <span>High Score: {highScore}</span>
                </div>
            </div>
            <Button size="lg" onClick={onBackToMenu} onMouseEnter={playHoverSound} className="font-bold text-lg mt-4 w-64 btn-liquid-glass btn-liquid-secondary">
                <Gamepad2 className="mr-2" />
                Main Menu
            </Button>
        </div>
    );
}