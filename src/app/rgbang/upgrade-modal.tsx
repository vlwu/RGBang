
"use client"

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
import { Zap, Shield, Gem, TrendingUp, PlusCircle, ChevronsRight, Bolt, Wind, Flame, Star, Gauge, Crosshair } from "lucide-react";

interface UpgradeModalProps {
    isOpen: boolean;
    options: Upgrade[];
    onSelect: (upgrade: Upgrade) => void;
    upgradeData: PlayerUpgradeData;
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
};


const UpgradeCard = ({ upgrade, onSelect, progress }: { upgrade: Upgrade, onSelect: (upgrade: Upgrade) => void, progress?: UpgradeProgress }) => {
    const Icon = iconMap[upgrade.id] || iconMap['default'];
    const colorHex = upgrade.color ? COLOR_DETAILS[upgrade.color].hex : '#FFFFFF';
    
    const level = progress?.level || 0;

    return (
        <Card 
            className="text-center bg-card/80 backdrop-blur-sm border-border hover:border-primary hover:bg-card transition-all cursor-pointer flex flex-col hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
            onClick={() => onSelect(upgrade)}
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
                <div>
                    <div className="flex justify-center items-center mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                    </div>
                     {level >= 5 && (
                        <p className="text-sm font-bold text-yellow-400">MAX LEVEL</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function UpgradeModal({ isOpen, options, onSelect, upgradeData }: UpgradeModalProps) {
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
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
