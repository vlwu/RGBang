import { EntityManager } from "./entityManager";
import { Player } from "./player";
import { Enemy } from "./enemy";
import { Boss } from "./boss";
import { WaveManager } from "./waveManager";
import { SoundManager } from "./sound-manager";
import { EnemyType } from "./wave-data";
import { GameColor, PRIMARY_COLORS, getRandomElement } from "./color";
import { ALL_UPGRADES } from "./upgrades";
import { Vec2 } from "./utils";

interface SandboxManagerDependencies {
    entityManager: EntityManager;
    player: Player;
    waveManager: WaveManager;
    soundManager: SoundManager;
    canvas: HTMLCanvasElement;
}

export class SandboxManager {
    private entityManager: EntityManager;
    private player: Player;
    private waveManager: WaveManager;
    private soundManager: SoundManager;
    private canvas: HTMLCanvasElement;

    constructor(deps: SandboxManagerDependencies) {
        this.entityManager = deps.entityManager;
        this.player = deps.player;
        this.waveManager = deps.waveManager;
        this.soundManager = deps.soundManager;
        this.canvas = deps.canvas;
    }

    public spawnEnemy(enemyType: EnemyType, colorOverride?: GameColor) {
        const spawnPos = this.player.pos.add(new Vec2(
            (Math.random() - 0.5) * 400 + 200 * Math.sign(Math.random() - 0.5),
            (Math.random() - 0.5) * 400 + 200 * Math.sign(Math.random() - 0.5)
        ));
        const x = Math.max(0, Math.min(this.canvas.width, spawnPos.x));
        const y = Math.max(0, Math.min(this.canvas.height, spawnPos.y));


        let color: GameColor;
        let radius: number;
        let health: number;
        let speed: number;
        let points: number;
        let damage: number;
        let isChromaSentinel = false;

        const waveNumber = this.waveManager.currentWave > 0 ? this.waveManager.currentWave : 10;
        const healthMultiplier = 1 + waveNumber * 0.1;
        const speedMultiplier = 1 + waveNumber * 0.02;
        const pointsMultiplier = 1 + waveNumber * 0.05;

        switch (enemyType) {
            case EnemyType.RED_BLOB:
                color = colorOverride || getRandomElement(PRIMARY_COLORS);
                radius = 15;
                health = Math.round(30 * healthMultiplier);
                speed = 1.5 * speedMultiplier;
                points = Math.round(10 * pointsMultiplier);
                damage = 10;
                break;
            case EnemyType.BLUE_SHARD:
                color = colorOverride || getRandomElement(PRIMARY_COLORS);
                radius = 18;
                health = Math.round(50 * healthMultiplier);
                speed = 1.8 * speedMultiplier;
                points = Math.round(20 * pointsMultiplier);
                damage = 15;
                break;
            case EnemyType.CHROMA_SENTINEL:
                color = colorOverride || getRandomElement(PRIMARY_COLORS);
                radius = 20;
                health = Math.round(80 * healthMultiplier);
                speed = 1.2 * speedMultiplier;
                points = Math.round(30 * pointsMultiplier);
                damage = 20;
                isChromaSentinel = true;
                break;
            default:
                color = colorOverride || getRandomElement(PRIMARY_COLORS);
                radius = 15;
                health = Math.round(30 * healthMultiplier);
                speed = 1.5 * speedMultiplier;
                points = Math.round(10 * pointsMultiplier);
                damage = 10;
                break;
        }

        const newEnemy = new Enemy(x, y, color, radius, health, speed, points, this.soundManager, isChromaSentinel);
        newEnemy.damage = damage;
        this.entityManager.addEnemy(newEnemy);
    }

    public spawnBoss() {
        if (this.entityManager.boss) return;
        const bossX = this.canvas.width / 2;
        const bossY = 100;
        const waveMultiplier = Math.floor((this.waveManager.currentWave || 10) / 5);
        const scaledHealth = 800 + (waveMultiplier * 300);
        const scaledDamage = 25 + (waveMultiplier * 5);
        const scaledAttackInterval = Math.max(40, 100 - (waveMultiplier * 6));

        const boss = new Boss(
            bossX,
            bossY,
            (bullet) => this.entityManager.addBullet(bullet),
            this.canvas.width,
            this.canvas.height,
            this.soundManager,
            scaledHealth,
            scaledDamage,
            scaledAttackInterval
        );
        this.entityManager.setBoss(boss);
    }

    public killAllEnemies() {
        this.entityManager.enemies.forEach(e => e.isAlive = false);
        if(this.entityManager.boss) {
            this.entityManager.boss.health = 0;
            this.entityManager.boss.isAlive = false;
        }
    }

    public clearAllBullets() {
        this.entityManager.bullets.forEach(b => b.isActive = false);
    }

    public addUpgrade(upgradeId: string) {
        const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            const currentLevel = this.player.upgradeManager.getUpgradeLevel(upgradeId);
            if (currentLevel < upgrade.getMaxLevel()) {
                this.player.upgradeManager.apply(upgrade, 1);
            }
        }
    }

    public removeUpgrade(upgradeId: string) {
        const active = this.player.upgradeManager.activeUpgrades.get(upgradeId);
        if (active) {
            if (active.level > 1) {
                active.level--;
                this.player.upgradeManager.activeUpgrades.set(upgradeId, active);
            } else {
                this.player.upgradeManager.activeUpgrades.delete(upgradeId);
            }
            this.player.upgradeManager.recalculatePlayerStats();
        }
    }

    public maxUpgrade(upgradeId: string) {
        const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.player.upgradeManager.applyMax(upgrade);
        }
    }
}