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
import { Keybindings } from "../managers/input-handler";
import { getKeyDisplay } from "../common/utils";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    keybindings: Keybindings;
}

const KeyDisplay = ({ children }: { children: React.ReactNode }) => (
    <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[12px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
);

export function InfoModal({ isOpen, onClose, keybindings }: InfoModalProps) {

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
                            <li><KeyDisplay>{getKeyDisplay(keybindings.up)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.left)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.down)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.right)}</KeyDisplay> - Move your character</li>
                            <li><KeyDisplay>Mouse</KeyDisplay> - Aim</li>
                            <li><KeyDisplay>{getKeyDisplay(keybindings.shoot)}</KeyDisplay> - Shoot</li>
                            <li><KeyDisplay>{getKeyDisplay(keybindings.dash)}</KeyDisplay> - Dash (provides temporary invulnerability)</li>
                            <li><KeyDisplay>{getKeyDisplay(keybindings.viewUpgrades)}</KeyDisplay> - Toggle view of current upgrades during a run</li>
                        </ul>
                    </div>

                     <div className="space-y-2">
                        <h3 className="font-semibold text-primary">Color & Shape System</h3>
                         <p>To damage an enemy, you must match your bullet's color and shape to the enemy's.</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>There are 3 primary colors: <span className="text-[#ff4d4d] font-bold">Red (Circle)</span>, <span className="text-[#ffff66] font-bold">Yellow (Triangle)</span>, and <span className="text-[#4d94ff] font-bold">Blue (Square)</span>.</li>
                             <li>Select a primary color with keys <KeyDisplay>{getKeyDisplay(keybindings.primary1)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.primary2)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.primary3)}</KeyDisplay>, or cycle with the <KeyDisplay>Mouse Wheel</KeyDisplay>.</li>
                            <li>Hold <KeyDisplay>{getKeyDisplay(keybindings.comboRadial)}</KeyDisplay> to open a radial menu for secondary colors (Orange, Green, Purple).</li>
                            <li>Shooting an enemy with the wrong color 3 times will trigger a punishment, making it stronger!</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold text-primary">Gameplay & Upgrades</h3>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Survive procedurally generated waves of enemies that become progressively harder.</li>
                            <li>Defeating enemies drops colored fragments. Collecting these earns you upgrade choices at the end of a wave.</li>
                            <li>Powerful bosses and mini-bosses will appear on certain waves.</li>
                            <li>Defeat bosses to get special fragments which may offer more powerful upgrade choices!</li>
                            <li>Survive as long as you can and set a new high score! Your unlocked upgrades are persistent.</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} className="btn-liquid-glass btn-liquid-confirm">Got it!</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}