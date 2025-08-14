import { Player } from './player';
import { ALL_UPGRADES, Upgrade, UpgradeType } from './upgrades';
import { GameColor, PRIMARY_COLORS, getRandomElement } from './color';
import { PlayerUpgradeData } from './upgrade-data';

export class UpgradeManager {
    private player: Player;
    public activeUpgrades: Map<string, { upgrade: Upgrade, level: number }> = new Map();

    constructor(player: Player) {
        this.player = player;
    }


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


        if (fragmentColor === null) {
            const maxOutCandidates = availableUpgrades.filter(u => u.type === UpgradeType.GENERAL || u.type === UpgradeType.PLAYER_STAT);


            const shuffledMaxOutCandidates = shuffle(maxOutCandidates);
            for (let i = 0; i < Math.min(3, shuffledMaxOutCandidates.length); i++) {
                const originalUpgrade = shuffledMaxOutCandidates[i];
                options.push({
                    ...originalUpgrade,
                    id: `max-out-${originalUpgrade.id}`,
                    name: `MAX: ${originalUpgrade.name}`,
                    description: `Instantly raises '${originalUpgrade.name}' to Level ${originalUpgrade.getMaxLevel()}.`,
                    apply: () => {},
                    getValue: originalUpgrade.getValue,
                    getMaxLevel: originalUpgrade.getMaxLevel,
                });
            }
        } else {



            const relevantGunUpgrades = availableUpgrades.filter(u => u.type === UpgradeType.GUN && u.color === fragmentColor);
            if (relevantGunUpgrades.length > 0) {
                options.push(getRandomElement(relevantGunUpgrades));
            }


            const otherUpgrades = availableUpgrades.filter(u =>
                (u.type === UpgradeType.GENERAL || u.type === UpgradeType.PLAYER_STAT) &&
                !options.some(opt => opt.id === u.id)
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
                if (addScore) {
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


        while (options.length < 3) {
            options.push(fallbackHeal);
        }

        return shuffle(options.slice(0,3));
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
        this.player.scoreMultiplier = 1;
        this.player.accuracyModifier = 1;
        this.player.flatHealthIncrease = 0;

        this.player.chainLightningLevel = 0;
        this.player.igniteLevel = 0;
        this.player.iceSpikerLevel = 0;


        this.activeUpgrades.forEach(({ upgrade, level }) => {
            for (let i = 0; i < level; i++) {
                upgrade.apply(this.player, 1);
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