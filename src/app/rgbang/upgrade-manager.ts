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
        const shuffle = (arr: Upgrade[]) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        if (color === null) {
            const choicePool = ALL_UPGRADES.filter(u => {
                if (u.type !== UpgradeType.GENERAL && u.type !== UpgradeType.PLAYER_STAT) {
                    return false;
                }
                const currentLevel = this.getUpgradeLevel(u.id);
                return currentLevel < u.getMaxLevel();
            });

            const options = shuffle(choicePool).slice(0, 3);

            return options.map(opt => ({
                ...opt,
                id: `max-out-${opt.id}`,
                name: `MAX ${opt.name}`,
                description: `Instantly raises ${opt.name} to Level ${opt.getMaxLevel()}.`,
            }));
        }

        let pool: Upgrade[];
        const gunUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.GUN && u.color === color);
        const generalUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.GENERAL);
        const playerStatUpgrades = ALL_UPGRADES.filter(u => u.type === UpgradeType.PLAYER_STAT);
        pool = [...gunUpgrades, ...generalUpgrades, ...playerStatUpgrades];


        const availablePool = pool.filter(u => {
            const runLevel = this.getUpgradeLevel(u.id);
            const maxLevel = u.getMaxLevel();
            return runLevel < maxLevel;
        });

        const options: Upgrade[] = [];


        if (gunUpgrades.length > 0) {
            const gunUpgradeInPool = availablePool.find(u => u.type === UpgradeType.GUN);
            if (gunUpgradeInPool && !options.some(opt => opt.id === gunUpgradeInPool.id)) {
                options.push(gunUpgradeInPool);
            }
        }


        const remainingPool = availablePool.filter(u => !options.some(opt => opt.id === u.id));


        const seenUpgrades = remainingPool.filter(u => upgradeData.unlockedUpgradeIds.has(u.id));
        const unseenUpgrades = remainingPool.filter(u => !upgradeData.unlockedUpgradeIds.has(u.id));

        shuffle(seenUpgrades);
        shuffle(unseenUpgrades);


        if (unseenUpgrades.length > 0 && options.length < 3) {
            options.push(unseenUpgrades.pop()!);
        }


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
                break;
            }
        }


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

        this.player.movementSpeedMultiplier = 1;
        this.player.bulletDamageMultiplier = 1;
        this.player.dashCooldownModifier = 1;
        this.player.shootCooldownModifier = 1;
        this.player.expGainMultiplier = 1;
        this.player.accuracyModifier = 1;
        this.player.flatHealthIncrease = 0;


        this.player.chainLightningLevel = 0;
        this.player.igniteLevel = 0;
        this.player.iceSpikerLevel = 0;


        this.activeUpgrades.forEach(({ upgrade, level }) => {
            for(let i = 0; i < level; i++) {
                upgrade.apply(this.player, i + 1);
            }
        });

        const newMaxHealth = this.player.getMaxHealth();
        const healthIncrease = newMaxHealth - oldMaxHealth;

        if (healthIncrease > 0) {
            this.player.health += healthIncrease;
        }
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