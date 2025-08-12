
import { Player } from './player';
import { ALL_UPGRADES, Upgrade, UpgradeType } from './upgrades';
import { GameColor } from './color';
import { PlayerUpgradeData } from './upgrade-data';

export class UpgradeManager {
    private player: Player;
    public activeUpgrades: Map<string, { upgrade: Upgrade, level: number }> = new Map();
    
    constructor(player: Player) {
        this.player = player;
    }

    getUpgradeOptions(color: GameColor | null, upgradeData: PlayerUpgradeData, addScoreCallback: (amount: number) => void): Upgrade[] {
        let pool: Upgrade[];

        if (color === null) { // Boss/white fragment
            const playerStatUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.PLAYER_STAT);
            pool = [...playerStatUpgrades];
        } else {
            const gunUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.GUN && u.color === color);
            const generalUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.GENERAL);
            pool = [...gunUpgrades, ...generalUpgrades];
        }

        // Filter out upgrades the player has at max level for this run
        const availablePool = pool.filter(u => {
            const runLevel = this.getUpgradeLevel(u.id);
            const maxLevel = u.getMaxLevel();
            return runLevel < maxLevel;
        });
        
        const options: Upgrade[] = [];

        // Special handling for unique gun upgrades to ensure they appear
        const gunUpgrades = availablePool.filter(u => u.type === UpgradeType.GUN);
        if (gunUpgrades.length > 0) {
            // Only add if not already in options
            if (!options.some(opt => opt.id === gunUpgrades[0].id)) {
                options.push(gunUpgrades[0]);
            }
        }

        // Filter out the gun upgrades from the main pool to avoid duplication
        const remainingPool = availablePool.filter(u => !options.some(opt => opt.id === u.id));

        // Separate into seen and unseen upgrades from the remaining pool
        const seenUpgrades = remainingPool.filter(u => upgradeData.unlockedUpgradeIds.has(u.id));
        const unseenUpgrades = remainingPool.filter(u => !upgradeData.unlockedUpgradeIds.has(u.id));

        // Fisher-Yates shuffle for both pools
        const shuffle = (arr: Upgrade[]) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        shuffle(seenUpgrades);
        shuffle(unseenUpgrades);
        
        // Prioritize showing at least one new upgrade
        if (unseenUpgrades.length > 0 && options.length < 3) {
            options.push(unseenUpgrades.pop()!);
        }

        // Fill the rest of the options
        while (options.length < 3 && (seenUpgrades.length > 0 || unseenUpgrades.length > 0)) {
            if (seenUpgrades.length > 0) {
                 const next = seenUpgrades.pop()!;
                 if (!options.some(opt => opt.id === next.id)) {
                    options.push(next);
                 }
            } else if (unseenUpgrades.length > 0) {
                const next = unseenUpgrades.pop()!;
                if (!options.some(opt => opt.id === next.id)) {
                   options.push(next);
                }
            } else {
                break; // No more upgrades to offer
            }
        }
        
        // If there are still not enough options, add fallbacks.
        if (options.length < 3) {
            const healUpgrade: Upgrade = {
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

            const scoreUpgrade: Upgrade = {
                id: 'fallback-score',
                name: 'Bonus Points',
                description: 'Instantly gain 500 score.',
                type: UpgradeType.GENERAL,
                color: null,
                apply: (player, level, addScore) => {
                    if (addScore) {
                        addScore(500);
                    }
                },
                getValue: () => 500,
                getMaxLevel: () => 1
            };
            
            // Pass the callback to the apply function
            scoreUpgrade.apply = scoreUpgrade.apply.bind(null, this.player, 1, addScoreCallback);
            
            if (options.length === 0) return [healUpgrade, scoreUpgrade];

            if (!options.some(opt => opt.id === healUpgrade.id)) options.push(healUpgrade);
            if (options.length < 3 && !options.some(opt => opt.id === scoreUpgrade.id)) options.push(scoreUpgrade);
        }


        return shuffle(options);
    }

    apply(upgrade: Upgrade, level: number) {
        const currentLevel = this.getUpgradeLevel(upgrade.id);

        if (upgrade.id.startsWith('fallback-')) {
            upgrade.apply(this.player, 1);
            return;
        }
        
        this.activeUpgrades.set(upgrade.id, { upgrade, level: currentLevel + 1 });
        this.recalculatePlayerStats();
    }
    
    applyById(upgradeId: string, level: number) {
        const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            // This is for loading from save state, so we set the level directly
            this.activeUpgrades.set(upgradeId, { upgrade, level });
            this.recalculatePlayerStats();
        }
    }

    recalculatePlayerStats() {
        // Reset all modifiers to base values
        this.player.movementSpeedMultiplier = 1;
        this.player.bulletDamageMultiplier = 1;
        this.player.dashCooldownModifier = 1;
        this.player.shootCooldownModifier = 1;
        this.player.expGainMultiplier = 1;
        this.player.accuracyModifier = 1;
        this.player.flatHealthIncrease = 0;
        this.player.maxHealth = 100;

        // Reset gun-specific effects
        this.player.chainLightningLevel = 0;
        this.player.igniteLevel = 0;
        this.player.iceSpikerLevel = 0;
        
        // Apply all active upgrades
        this.activeUpgrades.forEach(({ upgrade, level }) => {
            // The apply function in upgrades.ts should handle the logic based on the new total level.
            // We call apply with the level to ensure stats are recalculated correctly based on the new total level.
             for(let i = 0; i < level; i++) {
                upgrade.apply(this.player, i + 1);
            }
        });

        // Recalculate max health
        this.player.maxHealth += this.player.flatHealthIncrease;
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
