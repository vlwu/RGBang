// src/app/rgbang/upgrade-manager.ts
import { Player } from './player';
import { ALL_UPGRADES, Upgrade, UpgradeType } from './upgrades';
import { GameColor, PRIMARY_COLORS, getRandomElement } from './color'; // MODIFIED: Import PRIMARY_COLORS and getRandomElement
import { PlayerUpgradeData } from './upgrade-data';

export class UpgradeManager {
    private player: Player;
    public activeUpgrades: Map<string, { upgrade: Upgrade, level: number }> = new Map();

    constructor(player: Player) {
        this.player = player;
    }

    // MODIFIED: Refined logic for getting upgrade options based on fragment color/type
    getUpgradeOptions(fragmentColor: GameColor | null, upgradeData: PlayerUpgradeData, addScoreCallback: (amount: number) => void): Upgrade[] {
        const shuffle = (arr: Upgrade[]) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        const options: Upgrade[] = [];
        const availableUpgrades = ALL_UPGRADES.filter(u => this.getUpgradeLevel(u.id) < u.getMaxLevel());

        // Scenario 1: Boss Fragment (fragmentColor === null)
        if (fragmentColor === null) {
            const maxOutCandidates = availableUpgrades.filter(u => u.type === UpgradeType.GENERAL || u.type === UpgradeType.PLAYER_STAT);

            // Create 'max out' versions of up to 3 random candidates
            const shuffledMaxOutCandidates = shuffle(maxOutCandidates);
            for (let i = 0; i < Math.min(3, shuffledMaxOutCandidates.length); i++) {
                const originalUpgrade = shuffledMaxOutCandidates[i];
                options.push({
                    ...originalUpgrade,
                    id: `max-out-${originalUpgrade.id}`,
                    name: `MAX: ${originalUpgrade.name}`,
                    description: `Instantly raises '${originalUpgrade.name}' to Level ${originalUpgrade.getMaxLevel()}.`,
                    apply: () => {}, // Apply logic handled by applyMax in Game/Home
                    getValue: originalUpgrade.getValue,
                    getMaxLevel: originalUpgrade.getMaxLevel,
                });
            }
        } else {
            // Scenario 2: Regular Fragment (specific fragmentColor)

            // 1. Try to offer one relevant GUN upgrade (matching fragmentColor)
            const relevantGunUpgrades = availableUpgrades.filter(u => u.type === UpgradeType.GUN && u.color === fragmentColor);
            if (relevantGunUpgrades.length > 0) {
                options.push(getRandomElement(relevantGunUpgrades));
            }

            // 2. Fill remaining slots with General and Player Stat upgrades, prioritizing unseen
            const otherUpgrades = availableUpgrades.filter(u =>
                (u.type === UpgradeType.GENERAL || u.type === UpgradeType.PLAYER_STAT) &&
                !options.some(opt => opt.id === u.id) // Ensure no duplicates
            );

            const seenUpgrades = otherUpgrades.filter(u => upgradeData.unlockedUpgradeIds.has(u.id));
            const unseenUpgrades = otherUpgrades.filter(u => !upgradeData.unlockedUpgradeIds.has(u.id));

            shuffle(unseenUpgrades);
            shuffle(seenUpgrades);

            while (options.length < 3 && (unseenUpgrades.length > 0 || seenUpgrades.length > 0)) {
                if (unseenUpgrades.length > 0) {
                    options.push(unseenUpgrades.pop()!);
                } else if (seenUpgrades.length > 0) {
                    options.push(seenUpgrades.pop()!);
                }
            }
        }

        // 3. Ensure exactly 3 options, filling with fallback upgrades if necessary
        const fallbackHeal: Upgrade = {
            id: 'fallback-heal',
            name: 'First Aid',
            description: 'Instantly recover 25 HP.',
            type: UpgradeType.GENERAL,
            color: null,
            apply: (player) => {
                player.health = Math.min(player.getMaxHealth(), player.health + 25);
            },
            getValue: () => 25,
            getMaxLevel: () => 1
        };

        const fallbackScore: Upgrade = {
            id: 'fallback-score',
            name: 'Bonus Points',
            description: 'Instantly gain 500 score.',
            type: UpgradeType.GENERAL,
            color: null,
            apply: (player, level, addScore) => {
                if (addScore) { // Use the addScoreCallback passed from Game/Home
                    addScore(500);
                }
            },
            getValue: () => 500,
            getMaxLevel: () => 1
        };

        if (options.length < 3 && !options.some(opt => opt.id === fallbackHeal.id)) {
            options.push(fallbackHeal);
        }
        if (options.length < 3 && !options.some(opt => opt.id === fallbackScore.id)) {
            options.push(fallbackScore);
        }

        // Ensure we always return 3 options, even if it means duplicating fallbacks
        while (options.length < 3) {
            options.push(fallbackHeal); // Or choose a random fallback if more are added
        }

        return shuffle(options.slice(0,3)); // Shuffle final options and take top 3
    }

    apply(upgrade: Upgrade, level: number) {
        const currentLevel = this.getUpgradeLevel(upgrade.id);

        if (upgrade.id.startsWith('fallback-')) {
            // Fallback upgrades are applied immediately and don't affect stored activeUpgrades map
            upgrade.apply(this.player, 1);
            return;
        }

        // Apply regular upgrades
        this.activeUpgrades.set(upgrade.id, { upgrade, level: currentLevel + 1 });
        this.recalculatePlayerStats();
    }

    applyMax(upgradeToMax: Upgrade) {
        const maxLevel = upgradeToMax.getMaxLevel();
        this.activeUpgrades.set(upgradeToMax.id, { upgrade: upgradeToMax, level: maxLevel });
        this.recalculatePlayerStats();
    }

    applyById(upgradeId: string, level: number) {
        const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.activeUpgrades.set(upgradeId, { upgrade, level });
            this.recalculatePlayerStats();
        }
    }

    recalculatePlayerStats() {
        const oldMaxHealth = this.player.getMaxHealth();

        // Reset all player stats to base values or default multipliers
        this.player.movementSpeedMultiplier = 1;
        this.player.bulletDamageMultiplier = 1;
        this.player.dashCooldownModifier = 1;
        this.player.shootCooldownModifier = 1;
        this.player.expGainMultiplier = 1; // Currently unused, will be used later
        this.player.accuracyModifier = 1;
        this.player.flatHealthIncrease = 0;

        this.player.chainLightningLevel = 0;
        this.player.igniteLevel = 0;
        this.player.iceSpikerLevel = 0;

        // Apply active upgrades
        this.activeUpgrades.forEach(({ upgrade, level }) => {
            upgrade.apply(this.player, level);
        });

        const newMaxHealth = this.player.getMaxHealth();
        const healthIncrease = newMaxHealth - oldMaxHealth;

        // Adjust current health if max health increased
        if (healthIncrease > 0) {
            this.player.health += healthIncrease;
        }
        // Ensure health doesn't exceed new max
        this.player.health = Math.min(this.player.health, newMaxHealth);
    }

    getUpgradeLevel(upgradeId: string): number {
        return this.activeUpgrades.get(upgradeId)?.level || 0;
    }

    getActiveUpgradeDetails(): Upgrade[] {
        return Array.from(this.activeUpgrades.values()).map(item => item.upgrade);
    }

    getActiveUpgradeMap(): Map<string, number> {
        const map = new Map<string, number>();
        this.activeUpgrades.forEach(({level}, id) => {
            map.set(id, level);
        });
        return map;
    }
}