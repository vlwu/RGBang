"use client";

import { Button } from "@/components/ui/button";
import { Gamepad2, History } from "lucide-react";
import { SavedGameState } from "../../core/save-state";

type ContinuePromptProps = {
    savedGame: SavedGameState;
    onContinue: () => void;
    onStartFresh: () => void;
    onBackToMenu: () => void;
    playHoverSound: () => void;
};

export function ContinuePrompt({ savedGame, onContinue, onStartFresh, onBackToMenu, playHoverSound }: ContinuePromptProps) {
    return (
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
                <Button size="lg" onClick={onContinue} onMouseEnter={playHoverSound} className="font-bold text-lg btn-liquid-glass btn-liquid-primary">
                    <History className="mr-2" />
                    Continue Run
                </Button>
                <Button size="lg" onClick={onStartFresh} onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-destructive">
                    <Gamepad2 className="mr-2" />
                    Start Fresh
                </Button>
                <Button size="lg" onClick={onBackToMenu} onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-secondary">
                    Main Menu
                </Button>
            </div>
        </div>
    );
}