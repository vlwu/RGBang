
import { Player } from './player';
import { ALL_UPGRADES, Upgrade, UpgradeType } from './upgrades';
import { GameColor } from './color';
import { PlayerUpgradeData } from './upgrade-data';

export class UpgradeManager {
    private player: Player;
    public activeUpgrades: Set<string> = new Set();
    
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

        // Filter out upgrades the player already has in the current run
        const availablePool = pool.filter(u => !this.activeUpgrades.has(u.id));

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
            if (unseenUpgrades.length > 0) {
                options.push(unseenUpgrades.pop()!);
            } else if (seenUpgrades.length > 0) {
                options.push(seenUpgrades.pop()!);
            } else {
                break; // No more upgrades to offer
            }
        }
        
        return options;
    }

    apply(upgrade: Upgrade) {
        if (!this.activeUpgrades.has(upgrade.id)) {
            this.activeUpgrades.add(upgrade.id);
            upgrade.apply(this.player);
        }
    }

    getActiveUpgradeDetails(): Upgrade[] {
        return ALL_UPGRADES.filter(u => this.activeUpgrades.has(u.id));
    }
}
