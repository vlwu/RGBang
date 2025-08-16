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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Award, Gamepad2, Shield, Zap } from "lucide-react";

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

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <h3 className="font-semibold text-primary text-lg tracking-wide">{title}</h3>
        <div className="text-muted-foreground space-y-2">{children}</div>
    </div>
);

export function InfoModal({ isOpen, onClose, keybindings }: InfoModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl w-[90vw] bg-background text-foreground p-0 h-[90vh] flex flex-col">
                <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
                    <DialogTitle className="text-primary text-2xl font-headline">How to Play RGBang</DialogTitle>
                    <DialogDescription>
                        Master the colors and shapes to survive the chromatic onslaught!
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="grid gap-8 py-4 text-sm">
                        <Section title="Core Objective">
                            <p>Survive for as long as you can against procedurally generated waves of enemies. Defeat them by matching your bullet's color and shape to theirs. Collect fragments they drop to earn powerful, persistent upgrades and achieve a new high score.</p>
                        </Section>

                        <Section title="Controls">
                            <ul className="list-disc list-inside space-y-2">
                                <li><KeyDisplay>{getKeyDisplay(keybindings.up)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.left)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.down)}</KeyDisplay> <KeyDisplay>{getKeyDisplay(keybindings.right)}</KeyDisplay> - Move your character.</li>
                                <li><KeyDisplay>Mouse</KeyDisplay> - Aim your weapon.</li>
                                <li><KeyDisplay>{getKeyDisplay(keybindings.shoot)}</KeyDisplay> - Fire your currently selected color.</li>
                                <li><KeyDisplay>{getKeyDisplay(keybindings.dash)}</KeyDisplay> - Perform a quick dash, granting temporary invulnerability.</li>
                                <li><KeyDisplay>{getKeyDisplay(keybindings.viewUpgrades)}</KeyDisplay> - During a run, toggle a panel to view your active upgrades.</li>
                            </ul>
                        </Section>

                        <Section title="The Color & Shape System">
                             <p>To damage an enemy, you must hit it with the correct color. Each color is paired with a unique shape for better visual distinction.</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>There are 3 primary colors: <span className="text-[#ff4d4d] font-bold">Red (Circle)</span>, <span className="text-[#ffff66] font-bold">Yellow (Triangle)</span>, and <span className="text-[#4d94ff] font-bold">Blue (Square)</span>.</li>
                                 <li>Select a primary color with keys <KeyDisplay>{getKeyDisplay(keybindings.primary1)}</KeyDisplay>, <KeyDisplay>{getKeyDisplay(keybindings.primary2)}</KeyDisplay>, <KeyDisplay>{getKeyDisplay(keybindings.primary3)}</KeyDisplay>, or cycle through all available colors with the <KeyDisplay>Mouse Wheel</KeyDisplay>.</li>
                                <li>Hold <KeyDisplay>{getKeyDisplay(keybindings.comboRadial)}</KeyDisplay> to open a radial menu for powerful secondary colors: Orange, Green, and Purple.</li>
                                <li><span className="font-bold text-destructive">Punishment System:</span> Hitting an enemy with the wrong color 3 times will trigger a punishment, making it more dangerous! It might gain speed, reflect bullets, split into two, or deal more damage.</li>
                            </ul>
                        </Section>

                        <Section title="Upgrades & Progression">
                             <p>Collecting fragments from defeated enemies is key to your survival and power.</p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>At the end of each wave, you can spend your collected fragments to choose from a selection of upgrades.</li>
                                <li>Upgrades are persistent! Unlocked abilities and stat boosts carry over to future runs, allowing you to get stronger over time.</li>
                                <li><span className="font-bold text-accent">Upgrade Types:</span> Look for upgrades that boost your Player Stats (<Shield className="inline-block h-4 w-4" />), enhance your Gun's properties (<Zap className="inline-block h-4 w-4" />), or provide General utility (<Award className="inline-block h-4 w-4" />).</li>
                                <li>Powerful bosses appear every 5 waves. They drop special fragments that offer a chance to instantly <span className="font-bold text-yellow-400">MAX OUT</span> an upgrade to its highest level!</li>
                            </ul>
                        </Section>

                        <Section title="Game Modes">
                            <ul className="list-disc list-inside space-y-2">
                                <li><span className="font-bold text-primary">Normal Mode:</span> The standard game mode. Survive waves, collect upgrades, and set a high score.</li>
                                <li><span className="font-bold text-yellow-400">Sandbox Mode:</span> A practice arena where you have full control. Spawn any enemy, give yourself any upgrade, and test out mechanics without pressure. Access it from the main menu.</li>
                            </ul>
                        </Section>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t border-border flex-shrink-0">
                    <Button onClick={onClose} className="w-full sm:w-auto btn-liquid-glass btn-liquid-confirm">Got it!</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}