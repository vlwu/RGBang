"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Play } from "lucide-react";

type BetweenWavesUIProps = {
    currentWave: number;
    countdown: number;
    nextWaveHint: string;
    upgradesRemainingToSelect: number;
    totalUpgradesToSelect: number;
    onChooseUpgrades: () => void;
    onStartNextWave: () => void;
    playHoverSound: () => void;
    onQuit: () => void;
};

export function BetweenWavesUI({ currentWave, countdown, nextWaveHint, upgradesRemainingToSelect, totalUpgradesToSelect, onChooseUpgrades, onStartNextWave, playHoverSound, onQuit }: BetweenWavesUIProps) {
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in border-2 border-primary/20 select-none">
            <h2 className="text-6xl font-bold font-headline tracking-tighter mb-4 text-glow">WAVE {currentWave} CLEARED!</h2>
            <p className="text-3xl font-semibold text-foreground/80 mb-6">Next Wave in: <span className="text-accent">{countdown}</span></p>
            <p className="text-xl font-medium text-muted-foreground">{nextWaveHint}</p>
            {upgradesRemainingToSelect > 0 && (
                <Button
                    size="lg"
                    onClick={onChooseUpgrades}
                    onMouseEnter={playHoverSound}
                    className="font-bold text-lg mt-6 btn-liquid-glass btn-liquid-confirm"
                >
                    Choose Upgrades ({totalUpgradesToSelect - upgradesRemainingToSelect + 1}/{totalUpgradesToSelect} selected)
                </Button>
            )}
            <Button
                size="lg"
                onClick={onStartNextWave}
                onMouseEnter={playHoverSound}
                className="font-bold text-lg mt-4 btn-liquid-glass btn-liquid-primary"
            >
                <Play className="mr-2" />
                Start Next Wave Now
            </Button>
            <Button
                size="lg"
                variant="ghost"
                onClick={onQuit}
                onMouseEnter={playHoverSound}
                className="font-bold text-lg mt-2 text-muted-foreground"
            >
                <LogOut className="mr-2" />
                Save and Quit
            </Button>
        </div>
    );
}