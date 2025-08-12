
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const KeyDisplay = ({ children }: { children: React.ReactNode }) => (
    <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[12px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
);

export function InfoModal({ isOpen, onClose }: InfoModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-primary text-2xl">How to Play RGBang</DialogTitle>
                    <DialogDescription>
                        Master the colors and shapes to survive the onslaught!
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 text-sm">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-primary">Controls</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li><KeyDisplay>W</KeyDisplay> <KeyDisplay>A</KeyDisplay> <KeyDisplay>S</KeyDisplay> <KeyDisplay>D</KeyDisplay> - Move your character</li>
                            <li><KeyDisplay>Mouse</KeyDisplay> - Aim</li>
                            <li><KeyDisplay>Left Click</KeyDisplay> - Shoot</li>
                            <li><KeyDisplay>Spacebar</KeyDisplay> - Dash (provides temporary invulnerability)</li>
                        </ul>
                    </div>
                    
                     <div className="space-y-2">
                        <h3 className="font-semibold text-primary">Color & Shape System</h3>
                         <p>To damage an enemy, you must match your bullet's color and shape to the enemy's.</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>There are 3 primary colors: <span className="text-[#ff4d4d] font-bold">Red (Circle)</span>, <span className="text-[#ffff66] font-bold">Yellow (Triangle)</span>, and <span className="text-[#4d94ff] font-bold">Blue (Square)</span>.</li>
                             <li>Select a primary color with keys <KeyDisplay>1</KeyDisplay> <KeyDisplay>2</KeyDisplay> <KeyDisplay>3</KeyDisplay>.</li>
                             <li>Cycle through all available colors with the <KeyDisplay>Mouse Wheel</KeyDisplay>.</li>
                            <li>Hold <KeyDisplay>Q</KeyDisplay> to open a radial menu for secondary colors. Move your mouse to select one and release <KeyDisplay>Q</KeyDisplay> to fire.</li>
                            <li>Secondary colors are combinations of two primaries (e.g., Red + Yellow = <span className="text-[#ffc266] font-bold">Orange</span>).</li>
                            <li>Shooting the wrong color will eventually trigger a punishment, making the enemy stronger!</li>
                        </ul>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="font-semibold text-primary">Gameplay</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Enemies will spawn continuously from the edges of the screen.</li>
                            <li>For every <span className="font-bold text-accent">100 points</span>, a powerful Boss will spawn.</li>
                            <li>Defeat the Boss to earn a health prism, which restores all your health.</li>
                            <li>Survive as long as you can and set a new high score!</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Got it!</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
