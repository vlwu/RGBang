"use client"

import { useState, useMemo, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EnemyType } from '../data/wave-data';
import { GameColor, PRIMARY_COLORS, getRandomElement } from '../data/color';
import { ALL_UPGRADES, Upgrade } from '../data/upgrades';
import { soundManager, SoundType } from '../managers/sound-manager';
import { Minus, Plus } from 'lucide-react';

interface SandboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameManager: {
        spawnEnemy: (type: EnemyType, color?: GameColor) => void;
        spawnBoss: () => void;
        killAllEnemies: () => void;
        clearAllBullets: () => void;
        addUpgrade: (upgradeId: string) => void;
        removeUpgrade: (upgradeId: string) => void;
        maxUpgrade: (upgradeId: string) => void;
        getRunUpgrades: () => Map<string, number>;
        togglePlayerCollision: (enabled: boolean) => void;
        getIsPlayerCollisionEnabled: () => boolean;
    };
    runUpgrades: Map<string, number>;
}

const UpgradeControl = ({ upgrade, level, gameManager }: { upgrade: Upgrade, level: number, gameManager: SandboxModalProps['gameManager']}) => {
    const playHover = () => soundManager.play(SoundType.ButtonHover);
    const playClick = () => soundManager.play(SoundType.ButtonClick);

    const handleAdd = () => {
        playClick();
        gameManager.addUpgrade(upgrade.id);
    }
    const handleRemove = () => {
        playClick();
        gameManager.removeUpgrade(upgrade.id);
    }
    const handleMax = () => {
        playClick();
        gameManager.maxUpgrade(upgrade.id);
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div>
                <p className="font-semibold text-primary">{upgrade.name}</p>
                <p className="text-xs text-muted-foreground">{`Level: ${level} / ${upgrade.getMaxLevel()}`}</p>
            </div>
            <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={handleRemove} disabled={level === 0} onMouseEnter={playHover} className="h-7 w-7"><Minus className="h-4 w-4"/></Button>
                <Button size="icon" variant="outline" onClick={handleAdd} disabled={level >= upgrade.getMaxLevel()} onMouseEnter={playHover} className="h-7 w-7"><Plus className="h-4 w-4"/></Button>
                <Button size="sm" variant="ghost" onClick={handleMax} disabled={level >= upgrade.getMaxLevel()} onMouseEnter={playHover} className="h-7">Max</Button>
            </div>
        </div>
    )
}

export function SandboxModal({ isOpen, onClose, gameManager, runUpgrades }: SandboxModalProps) {
    const [selectedEnemy, setSelectedEnemy] = useState<EnemyType>(EnemyType.RED_BLOB);
    const [selectedColor, setSelectedColor] = useState<GameColor | 'random'>('random');
    const [isPlayerCollisionEnabled, setIsPlayerCollisionEnabled] = useState(gameManager.getIsPlayerCollisionEnabled());

    useEffect(() => {
        if (isOpen) {
            setIsPlayerCollisionEnabled(gameManager.getIsPlayerCollisionEnabled());
        }
    }, [isOpen, gameManager]);

    const enemyTypes = useMemo(() => Object.values(EnemyType).filter(type => type !== EnemyType.MINI_BOSS_1 && type !== EnemyType.MAIN_BOSS_1), []);

    const playHover = () => soundManager.play(SoundType.ButtonHover);
    const playClick = () => soundManager.play(SoundType.ButtonClick);

    const handleSpawnEnemy = () => {
        playClick();
        const color = selectedColor === 'random' ? getRandomElement(PRIMARY_COLORS) : selectedColor;
        gameManager.spawnEnemy(selectedEnemy, color);
    }

    const handleToggleCollision = (enabled: boolean) => {
        playClick();
        gameManager.togglePlayerCollision(enabled);
        setIsPlayerCollisionEnabled(enabled);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-primary text-2xl font-headline">Sandbox Control Panel</DialogTitle>
                    <DialogDescription>
                        Control the simulation. Press `Tab` to toggle this panel.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                    <Tabs defaultValue="general" className="flex flex-col h-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general" onMouseEnter={playHover}>General</TabsTrigger>
                            <TabsTrigger value="spawning" onMouseEnter={playHover}>Spawning</TabsTrigger>
                            <TabsTrigger value="upgrades" onMouseEnter={playHover}>Upgrades</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="mt-4 flex-grow">
                            <Card>
                                <CardHeader><CardTitle>World Controls</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <Button onClick={() => { playClick(); gameManager.killAllEnemies(); }} onMouseEnter={playHover} className="w-full">Kill All Enemies</Button>
                                    <Button onClick={() => { playClick(); gameManager.clearAllBullets(); }} onMouseEnter={playHover} className="w-full">Clear All Bullets</Button>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="player-collision"
                                            checked={isPlayerCollisionEnabled}
                                            onCheckedChange={(checked) => handleToggleCollision(Boolean(checked))}
                                        />
                                        <label
                                            htmlFor="player-collision"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Enable Player Collision
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="spawning" className="mt-4 flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader><CardTitle>Spawn Enemy</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Enemy Type</Label>
                                            <Select value={selectedEnemy} onValueChange={(v) => setSelectedEnemy(v as EnemyType)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {enemyTypes.map(type => <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Color</Label>
                                            <Select value={selectedColor} onValueChange={(v) => setSelectedColor(v as GameColor | 'random')}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="random">Random Primary</SelectItem>
                                                    {PRIMARY_COLORS.map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleSpawnEnemy} onMouseEnter={playHover} className="w-full">Spawn</Button>
                                    </CardContent>
                                </Card>
                                <Card>
                                <CardHeader><CardTitle>Spawn Boss</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground">Spawns a main boss with scaled stats.</p>
                                        <Button onClick={() => { playClick(); gameManager.spawnBoss(); }} onMouseEnter={playHover} className="w-full">Spawn Main Boss</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="upgrades" className="mt-4 flex-grow min-h-0">
                            <Card className="h-full flex flex-col">
                                <CardHeader><CardTitle>Manage Upgrades</CardTitle></CardHeader>
                                <CardContent className="flex-grow min-h-0">
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-2">
                                            {ALL_UPGRADES.map(upgrade => (
                                                <UpgradeControl key={upgrade.id} upgrade={upgrade} level={runUpgrades.get(upgrade.id) || 0} gameManager={gameManager} />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} onMouseEnter={playHover} className="font-bold btn-liquid-glass btn-liquid-confirm">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}