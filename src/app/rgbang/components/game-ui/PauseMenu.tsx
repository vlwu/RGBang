"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Play, Settings, X } from "lucide-react";

type PauseMenuProps = {
    onResume: () => void;
    onSettings: () => void;
    onQuit: () => void;
    playHoverSound: () => void;
};

export function PauseMenu({ onResume, onSettings, onQuit, playHoverSound }: PauseMenuProps) {
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20 select-none">
            <div className="absolute top-4 right-4">
                <Button size="icon" variant="ghost" onClick={onResume} onMouseEnter={playHoverSound}>
                    <X />
                </Button>
            </div>
            <h2 className="text-6xl font-bold font-headline tracking-tighter mb-8 text-glow">Paused</h2>
            <div className="flex flex-col space-y-4 w-52">
                <Button size="lg" onClick={onResume} onMouseEnter={playHoverSound} className="font-bold text-lg btn-liquid-glass btn-liquid-primary">
                    <Play className="mr-2" />
                    Resume
                </Button>
                <Button size="lg" onClick={onSettings} onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-secondary">
                    <Settings className="mr-2" />
                    Settings
                </Button>
                <Button size="lg" onClick={onQuit} onMouseEnter={playHoverSound} className="font-bold text-lg btn-liquid-glass btn-liquid-destructive">
                    <LogOut className="mr-2" />
                    Save and Quit
                </Button>
            </div>
        </div>
    );
}