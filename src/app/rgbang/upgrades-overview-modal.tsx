"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upgrade, UpgradeType } from "./upgrades";
import { COLOR_DETAILS } from './color';
import { UpgradeManager } from './upgrade-manager';
import { iconMap } from './upgrade-modal';
import { Star, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface UpgradesOverviewModalProps {
    isOpen: boolean;
    upgradeManager?: UpgradeManager;
    onClose: () => void;
}

const UpgradeInfoCard = ({ upgrade, level }: { upgrade: Upgrade, level: number }) => {
    const Icon = iconMap[upgrade.id] || iconMap['default'];
    const colorHex = upgrade.color ? COLOR_DETAILS[upgrade.color].hex : '#A9A9A9';

    return (
        <div className="border-liquid-glass h-full">
            <Card className="bg-card flex flex-col items-center p-3 !border-0 h-full w-full">
                <div className="p-2 rounded-full mb-2 bg-accent/10" style={{ boxShadow: `0 0 10px ${colorHex}` }}>
                    <Icon className="w-6 h-6" style={{ color: colorHex }} />
                </div>
                <CardHeader className="p-0 items-center">
                    <CardTitle className="text-base text-primary text-center">{upgrade.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2">
                     <div className="flex justify-center items-center">
                        {Array.from({ length: upgrade.getMaxLevel() }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function UpgradesOverviewModal({ isOpen, upgradeManager, onClose }: UpgradesOverviewModalProps) {
    if (!isOpen || !upgradeManager) return null;

    const activeUpgrades = upgradeManager.getActiveUpgradeDetails();

    const gunUpgrades = activeUpgrades.filter(u => u.type === UpgradeType.GUN);
    const playerUpgrades = activeUpgrades.filter(u => u.type === UpgradeType.PLAYER_STAT || u.type === UpgradeType.GENERAL);

    return (
        <div className="w-full max-w-4xl p-6 flex flex-col h-full relative">
            <Button size="icon" variant="ghost" onClick={onClose} className="absolute top-4 right-4">
                <X/>
            </Button>
            <h2 className="text-3xl font-bold text-center text-primary mb-8 font-headline tracking-wider shrink-0">Current Upgrades</h2>
            <div className="overflow-y-auto pr-4 flex-grow">
                {activeUpgrades.length > 0 ? (
                    <div className="space-y-8">
                        {gunUpgrades.length > 0 && (
                            <div>
                                <h3 className="text-2xl font-semibold text-center text-accent mb-4">Gun Upgrades</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {gunUpgrades.map(upgrade => (
                                        <UpgradeInfoCard
                                            key={upgrade.id}
                                            upgrade={upgrade}
                                            level={upgradeManager.getUpgradeLevel(upgrade.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {playerUpgrades.length > 0 && (
                            <div>
                                <h3 className="text-2xl font-semibold text-center text-accent mb-4">Player Upgrades</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {playerUpgrades.map(upgrade => (
                                        <UpgradeInfoCard
                                            key={upgrade.id}
                                            upgrade={upgrade}
                                            level={upgradeManager.getUpgradeLevel(upgrade.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground text-lg">No upgrades acquired yet. Collect fragments to get started!</p>
                )}
            </div>
        </div>
    );
}