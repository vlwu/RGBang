
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upgrade } from "./upgrades";
import { GameColor, COLOR_DETAILS } from './color';
import { Zap, Shield, Gem, TrendingUp, PlusCircle, ChevronsRight } from "lucide-react";

interface UpgradeModalProps {
    isOpen: boolean;
    options: Upgrade[];
    onSelect: (upgrade: Upgrade) => void;
}

const iconMap: { [key: string]: React.ElementType } = {
    'default': Gem,
    'chain-lightning': Zap,
    'max-health': PlusCircle,
    'dash-cooldown': ChevronsRight
};


const UpgradeCard = ({ upgrade, onSelect }: { upgrade: Upgrade, onSelect: (upgrade: Upgrade) => void }) => {
    const Icon = iconMap[upgrade.id] || iconMap['default'];
    const colorHex = upgrade.color ? COLOR_DETAILS[upgrade.color].hex : '#FFFFFF';
    
    return (
        <Card 
            className="text-center bg-card/80 backdrop-blur-sm border-border hover:border-primary hover:bg-card transition-all cursor-pointer"
            onClick={() => onSelect(upgrade)}
            style={{ '--card-glow-color': colorHex } as React.CSSProperties}
        >
            <CardHeader className="items-center pb-4">
                 <div className="p-3 rounded-full mb-2 bg-accent/20" style={{ boxShadow: `0 0 15px ${colorHex}` }}>
                    <Icon className="w-8 h-8" style={{ color: colorHex }}/>
                </div>
                <CardTitle className="text-lg text-primary">{upgrade.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>{upgrade.description}</CardDescription>
            </CardContent>
        </Card>
    )
}

export function UpgradeModal({ isOpen, options, onSelect }: UpgradeModalProps) {
    return (
        <Dialog open={isOpen}>
            <DialogContent 
                className="sm:max-w-4xl bg-background/90 backdrop-blur-lg border-primary/20 text-foreground"
                hideCloseButton={true}
            >
                <DialogHeader>
                    <DialogTitle className="text-3xl text-center font-headline text-primary tracking-wider">Choose Your Upgrade</DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Select one of the following powers. Choose wisely.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                    {options.map(opt => (
                        <UpgradeCard key={opt.id} upgrade={opt} onSelect={onSelect} />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}


    