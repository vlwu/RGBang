"use client"

import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upgrade, UpgradeType } from "../data/upgrades";
import { COLOR_DETAILS } from '../data/color';
import { UpgradeManager } from '../managers/upgrade-manager';
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
    const uniqueId = useId();
    const maxLevel = upgrade.getMaxLevel();
    const fillPercentage = maxLevel > 0 ? (level / maxLevel) * 100 : 0;

    return (
        <div className="border-liquid-glass h-full">
            <Card className="bg-card flex flex-col items-center p-3 !border-0 h-full w-full">
                <div className="p-2 rounded-full mb-2 bg-accent/10" style={{ boxShadow: `0 0 10px ${colorHex}` }}>
                    <Icon className="w-6 h-6" style={{ color: colorHex }} />
                </div>
                <CardHeader className="p-0 items-center">
                    <CardTitle className="text-base text-primary text-center">{upgrade.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-2 flex flex-col items-center">
                     <div className="flex justify-center items-center h-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id={`starGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f87171" />
                                    <stop offset="25%" stopColor="#fde047" />
                                    <stop offset="50%" stopColor="#4ade80" />
                                    <stop offset="75%" stopColor="#38bdf8" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                                <mask id={`starMask-${uniqueId}`}>
                                    <rect x="0" y="0" width={`${fillPercentage}%`} height="100%" fill="white" />
                                </mask>
                            </defs>
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                fill="hsl(var(--muted-foreground))"
                                opacity="0.3"
                            />
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                fill={`url(#starGradient-${uniqueId})`}
                                mask={`url(#starMask-${uniqueId})`}
                            />
                        </svg>
                    </div>
                    {level >= maxLevel ? (
                        <p className="text-xs font-bold text-yellow-400 mt-1">MAX LEVEL</p>
                    ) : (
                        <p className="text-xs text-muted-foreground mt-1">{`Level ${level}/${maxLevel}`}</p>
                    )}
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