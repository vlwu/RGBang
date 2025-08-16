"use client";

import { Button } from "@/components/ui/button";
import { Award, Gamepad2, Info, Settings, TestTube, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

type MainMenuProps = {
    highScore: number;
    onPlay: () => void;
    onSandbox: () => void;
    onSettings: () => void;
    onInfo: () => void;
    onReset: () => void;
    playHoverSound: () => void;
};

export function MainMenu({ highScore, onPlay, onSandbox, onSettings, onInfo, onReset, playHoverSound }: MainMenuProps) {
    return (
        <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <h1 className="text-8xl font-bold tracking-tighter font-headline">
                <span className="bg-gradient-to-r from-red-400 via-green-400 to-blue-500 bg-clip-text text-transparent">RGB</span>
                <span>ang</span>
            </h1>
            <div className="flex flex-col gap-4 w-64">
                <Button size="lg" onClick={onPlay} onMouseEnter={playHoverSound} className="font-bold text-lg btn-liquid-glass btn-liquid-primary">
                    <Gamepad2 className="mr-2" />
                    Play
                </Button>
                <Button size="lg" onClick={onSandbox} onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-sandbox">
                    <TestTube className="mr-2" />
                    Sandbox
                </Button>
                <Button size="lg" onClick={onSettings} onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-secondary">
                    <Settings className="mr-2" />
                    Settings
                </Button>
                <Button size="lg" onClick={onInfo} onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-secondary">
                    <Info className="mr-2" />
                    How to Play
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="lg" onMouseEnter={playHoverSound} className="btn-liquid-glass btn-liquid-destructive">
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
                        <AlertDialogCancel onClick={playHoverSound}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onReset} onMouseEnter={playHoverSound}>
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
    );
}