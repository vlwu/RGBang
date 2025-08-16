"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upgrade } from "../data/upgrades";
import { GameColor, COLOR_DETAILS } from '../data/color';
import { PlayerUpgradeData, UpgradeProgress } from '../data/upgrade-data';
import { Zap, Shield, Gem, TrendingUp, PlusCircle, ChevronsRight, Bolt, Wind, Flame, Star, Gauge, Crosshair, Award, HeartPulse, ShieldCheck, Sunrise, ShieldPlus, Copy, RefreshCcw, ArrowRightFromLine, Bomb, CircleDot, Reply, LocateFixed, Sprout, GitFork, Eraser } from "lucide-react";
import { cn } from '@/lib/utils';
import { soundManager, SoundType } from '../managers/sound-manager';

interface UpgradeModalProps {
    isOpen: boolean;
    options: Upgrade[];
    onSelect: (upgrade: Upgrade) => void;
    upgradeData: PlayerUpgradeData;
    runUpgrades: Map<string, number>;
    upgradesRemainingToSelect: number;
    totalUpgradesToSelect: number;
}

export const iconMap: { [key: string]: React.ElementType } = {
    'default': Gem,
    'chain-lightning': Zap,
    'max-health': Shield,
    'dash-cooldown': ChevronsRight,
    'bullet-damage': Bolt,
    'movement-speed': Wind,
    'ignite': Flame,
    'faster-reload': Gauge,
    'prism-exp-gain': Star,
    'accuracy': Crosshair,
    'ice-spiker': Star,
    'fallback-heal': PlusCircle,
    'fallback-score': Award,
    'vampirism': HeartPulse,
    'resilience': ShieldCheck,
    'adrenaline-rush': Sunrise,
    'kinetic-shielding': ShieldPlus,
    'fragment-duplication': Copy,
    'punishment-reversal': RefreshCcw,
    'bullet-penetration': ArrowRightFromLine,
    'explosive-finish': Bomb,
    'gravity-well': CircleDot,
    'ricochet-rounds': Reply,
    'seeking-shards': LocateFixed,
    'growth-catalyst': Sprout,
    'fission-catalyst': GitFork,
    'void-catalyst': Eraser,
};


const UpgradeCard = ({ upgrade, onSelect, progress, isSelectable, runLevel }: {
    upgrade: Upgrade,
    onSelect: (upgrade: Upgrade) => void,
    progress?: UpgradeProgress,
    isSelectable: boolean,
    runLevel: number
}) => {
    const Icon = iconMap[upgrade.id] || iconMap['default'];
    const colorHex = upgrade.color ? COLOR_DETAILS[upgrade.color].hex : '#FFFFFF';

    const isFallback = upgrade.id.startsWith('fallback-');
    const displayLevel = isFallback ? 0 : runLevel;
    const maxLevel = upgrade.getMaxLevel();
    const nextLevel = runLevel + 1;

    const handleMouseEnter = () => {
        if (isSelectable) {
            soundManager.play(SoundType.UpgradeHover);
        }
    };

    return (
        <div
            className={cn(
                "border-liquid-glass group/wrapper transition-all duration-300 select-none",
                isSelectable
                    ? "cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
                    : "opacity-60 cursor-not-allowed"
            )}
            onClick={() => {
                if (isSelectable) {
                    onSelect(upgrade);
                }
            }}
            onMouseEnter={handleMouseEnter}
            style={{ '--card-glow-color': colorHex } as React.CSSProperties}
        >
            <Card
                className={cn(
                    "h-full w-full text-center bg-card flex flex-col transition-all duration-300 !border-0",
                     isSelectable && "group-hover/wrapper:bg-secondary"
                )}
            >
                <CardHeader className="items-center pt-4 px-4 pb-2">
                     <div className="p-2 rounded-full mb-2 bg-accent/20" style={{ boxShadow: `0 0 12px ${colorHex}` }}>
                        <Icon className="w-6 h-6" style={{ color: colorHex }}/>
                    </div>
                    <CardTitle className="text-base font-bold text-primary">{upgrade.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between px-4 pb-4">
                    <div>
                        <CardDescription className="mb-2 text-xs min-h-[2.5rem]">{upgrade.description}</CardDescription>
                        {!isFallback && upgrade.getEffectDescription && (
                            <div className="text-xs text-left bg-black/20 p-2 rounded-md space-y-1 mb-2">
                                {runLevel > 0 ? (
                                    <p>Current: <span className="font-semibold text-accent">{upgrade.getEffectDescription(runLevel)}</span></p>
                                ) : (
                                    <p>Current: <span className="font-semibold text-muted-foreground">Not acquired</span></p>
                                )}
                                {nextLevel <= maxLevel && (
                                    <p>Next Lvl: <span className="font-semibold text-primary">{upgrade.getEffectDescription(nextLevel)}</span></p>
                                )}
                            </div>
                        )}
                    </div>
                    {!isFallback && (
                        <div>
                            <div className="flex justify-center items-center mb-1">
                                {Array.from({ length: maxLevel }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < displayLevel ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                ))}
                            </div>
                             {displayLevel >= maxLevel && (
                                <p className="text-xs font-bold text-yellow-400">MAX LEVEL</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function UpgradeModal({ isOpen, options, onSelect, upgradeData, runUpgrades, upgradesRemainingToSelect, totalUpgradesToSelect }: UpgradeModalProps) {
    const [isSelectable, setIsSelectable] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSelectable(false);
            const timer = setTimeout(() => {
                setIsSelectable(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="sm:max-w-4xl h-[580px] flex flex-col bg-background/90 backdrop-blur-lg border-primary/20 text-foreground"
                hideCloseButton={true}
            >
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-3xl text-center font-headline text-primary tracking-wider">
                        Choose Your Power ({totalUpgradesToSelect - upgradesRemainingToSelect + 1}/{totalUpgradesToSelect})
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Your journey evolves. Select an upgrade to continue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 px-6 flex-grow">
                    {options.map(opt => (
                        <UpgradeCard
                            key={opt.id}
                            upgrade={opt}
                            onSelect={onSelect}
                            progress={upgradeData.upgradeProgress.get(opt.id)}
                            isSelectable={isSelectable}
                            runLevel={runUpgrades.get(opt.id) || 0}
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}