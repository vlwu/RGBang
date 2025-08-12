
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

    getUpgradeOptions(color: GameColor | null, upgradeData: PlayerUpgradeData): Upgrade[] {
        let pool: Upgrade[];

        if (color === null) { // Boss/white fragment
            pool = ALL_UPGRADES.filter(u => u.type === UpgradeType.PLAYER_STAT);
        } else {
            const colorUpgrades = ALL_UPGRADES.filter(u => u.color === color);
            const generalUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.GENERAL);
            pool = [...colorUpgrades, ...generalUpgrades];
        }

        // Filter out upgrades the player already has at max level in the current run
        const availablePool = pool.filter(u => {
            const active = this.activeUpgrades.get(u.id);
            return !active || active.level < u.getMaxLevel();
        });

        // Separate into seen and unseen upgrades
        const seenUpgrades = availablePool.filter(u => upgradeData.unlockedUpgradeIds.has(u.id));
        const unseenUpgrades = availablePool.filter(u => !upgradeData.unlockedUpgradeIds.has(u.id));

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

        const options: Upgrade[] = [];
        
        // Prioritize showing at least one new upgrade
        if (unseenUpgrades.length > 0) {
            options.push(unseenUpgrades.pop()!);
        }

        // Fill the rest of the options
        while (options.length < 3) {
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
        
        return options;
    }

    apply(upgrade: Upgrade, level: number) {
        if (this.activeUpgrades.has(upgrade.id)) {
            // If it exists, we are just re-applying based on a level up,
            // so we don't need to re-add, just let the player stats recalculate.
            const existing = this.activeUpgrades.get(upgrade.id)!;
            existing.level = level;

        } else {
            this.activeUpgrades.set(upgrade.id, { upgrade, level });
        }
        
        // Re-calculate all stats based on active upgrades
        this.recalculatePlayerStats();
    }

    recalculatePlayerStats() {
        // Reset all modifiers to base values
        this.player.movementSpeedMultiplier = 1;
        this.player.bulletDamageMultiplier = 1;
        this.player.dashCooldownModifier = 1;
        this.player.shootCooldownModifier = 1;
        this.player.expGainMultiplier = 1;
        this.player.flatHealthIncrease = 0;
        this.player.maxHealth = 100;
        
        // Apply all active upgrades
        this.activeUpgrades.forEach(({ upgrade, level }) => {
            upgrade.apply(this.player, level);
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
}

    