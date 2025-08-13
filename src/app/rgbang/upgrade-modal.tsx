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
import { Upgrade } from "./upgrades";
import { GameColor, COLOR_DETAILS } from './color';
import { PlayerUpgradeData, UpgradeProgress } from './upgrade-data';
import { Zap, Shield, Gem, TrendingUp, PlusCircle, ChevronsRight, Bolt, Wind, Flame, Star, Gauge, Crosshair, Award } from "lucide-react";
import { cn } from '@/lib/utils';
import { soundManager, SoundType } from './sound-manager';

interface UpgradeModalProps {
    isOpen: boolean;
    options: Upgrade[];
    onSelect: (upgrade: Upgrade) => void;
    upgradeData: PlayerUpgradeData;
    runUpgrades: Map<string, number>;
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

    const cardClasses = cn(
        "text-center bg-card/80 backdrop-blur-sm border-border flex flex-col transition-all duration-300",
        isSelectable
            ? "cursor-pointer hover:border-primary hover:bg-card hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
            : "opacity-60 cursor-not-allowed"
    );

    const handleMouseEnter = () => {
        if (isSelectable) {
            soundManager.play(SoundType.UpgradeHover);
        }
    };

    return (
        <Card
            className={cardClasses}
            onClick={() => {
                if (isSelectable) {
                    onSelect(upgrade);
                }
            }}
            onMouseEnter={handleMouseEnter}
            style={{ '--card-glow-color': colorHex } as React.CSSProperties}
        >
            <CardHeader className="items-center pb-4">
                 <div className="p-3 rounded-full mb-2 bg-accent/20" style={{ boxShadow: `0 0 15px ${colorHex}` }}>
                    <Icon className="w-8 h-8" style={{ color: colorHex }}/>
                </div>
                <CardTitle className="text-lg text-primary">{upgrade.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <CardDescription className="mb-4">{upgrade.description}</CardDescription>
                {!isFallback && (
                    <div>
                        <div className="flex justify-center items-center mb-2">
                            {Array.from({ length: maxLevel }).map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < displayLevel ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                            ))}
                        </div>
                         {displayLevel >= maxLevel && (
                            <p className="text-sm font-bold text-yellow-400">MAX LEVEL</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function UpgradeModal({ isOpen, options, onSelect, upgradeData, runUpgrades }: UpgradeModalProps) {
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
                className="sm:max-w-4xl bg-background/90 backdrop-blur-lg border-primary/20 text-foreground"
                hideCloseButton={true}
            >
                <DialogHeader>
                    <DialogTitle className="text-3xl text-center font-headline text-primary tracking-wider">Choose Your Power</DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Your journey evolves. Select an upgrade to continue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
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