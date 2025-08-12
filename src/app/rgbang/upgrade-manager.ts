
import { Player } from './player';
import { ALL_UPGRADES, Upgrade, UpgradeType } from './upgrades';
import { GameColor } from './color';

export class UpgradeManager {
    private player: Player;
    public activeUpgrades: Set<string> = new Set();
    
    constructor(player: Player) {
        this.player = player;
    }

    getUpgradeOptions(color: GameColor | null): Upgrade[] {
        let pool: Upgrade[];

        if (color === null) { // Boss/white fragment
            pool = ALL_UPGRADES.filter(u => u.type === UpgradeType.PLAYER_STAT);
        } else {
            const colorUpgrades = ALL_UPGRADES.filter(u => u.color === color);
            const generalUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.GENERAL);
            pool = [...colorUpgrades, ...generalUpgrades];
        }

        // Filter out upgrades the player already has if they are not stackable
        const availablePool = pool.filter(u => !this.activeUpgrades.has(u.id));

        // Fisher-Yates shuffle
        for (let i = availablePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
        }

        return availablePool.slice(0, 3);
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
