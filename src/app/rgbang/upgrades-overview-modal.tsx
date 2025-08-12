
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upgrade } from "./upgrades";
import { COLOR_DETAILS } from './color';
import { UpgradeManager } from './upgrade-manager';
import { iconMap } from './upgrade-modal';
import { Star } from 'lucide-react';

interface UpgradesOverviewModalProps {
    isOpen: boolean;
    upgradeManager?: UpgradeManager;
}

const UpgradeInfoCard = ({ upgrade, level }: { upgrade: Upgrade, level: number }) => {
    const Icon = iconMap[upgrade.id] || iconMap['default'];
    const colorHex = upgrade.color ? COLOR_DETAILS[upgrade.color].hex : '#A9A9A9';

    return (
        <Card className="bg-card/80 border-border/50 flex flex-col items-center p-3">
            <div className="p-2 rounded-full mb-2 bg-accent/10" style={{ boxShadow: `0 0 10px ${colorHex}` }}>
                <Icon className="w-6 h-6" style={{ color: colorHex }} />
            </div>
            <CardHeader className="p-0 items-center">
                <CardTitle className="text-base text-primary text-center">{upgrade.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
                 <div className="flex justify-center items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function UpgradesOverviewModal({ isOpen, upgradeManager }: UpgradesOverviewModalProps) {
    if (!isOpen || !upgradeManager) return null;

    const activeUpgrades = upgradeManager.getActiveUpgradeDetails();

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in z-50">
            <div className="w-full max-w-2xl p-6">
                <h2 className="text-3xl font-bold text-center text-primary mb-6 font-headline tracking-wider">Current Upgrades</h2>
                {activeUpgrades.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {activeUpgrades.map(upgrade => (
                            <UpgradeInfoCard
                                key={upgrade.id}
                                upgrade={upgrade}
                                level={upgradeManager.getUpgradeLevel(upgrade.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground text-lg">No upgrades acquired yet. Collect fragments to get started!</p>
                )}
            </div>
        </div>
    );
}

