import { Enemy } from './enemy';
import { GameColor, PRIMARY_COLORS, getRandomElement } from './color';
import { EnemyType, WaveConfig, EnemySpawnConfig, WAVE_CONFIGS, FALLBACK_WAVE_CONFIG, generateProceduralWave } from './wave-data';
import { SoundManager } from './sound-manager';
import { EntityManager } from './entityManager';
import { Boss } from './boss';
import { gameStateStore } from './gameStateStore';

class EnemySpawner {
    private spawnTimer = 0;
    private currentSpawnConfigIndex = 0;
    private currentWaveEnemiesToSpawn: EnemySpawnConfig[] = [];
    private soundManager: SoundManager;

    private enemiesLeftInGroup = 0;
    private groupSpawnTimer = 0;

    constructor(private canvasWidth: number, private canvasHeight: number, soundManager: SoundManager) {
        this.soundManager = soundManager;
    }

    initializeForWave(waveConfig: WaveConfig, upgradeCount: number) {
        if (waveConfig.bossType) {
            this.currentWaveEnemiesToSpawn = waveConfig.enemySpawnPatterns || [];
        } else {
            this.currentWaveEnemiesToSpawn = generateProceduralWave(waveConfig.waveNumber, upgradeCount);
        }
        this.currentSpawnConfigIndex = 0;
        this.spawnTimer = 0;
        this.enemiesLeftInGroup = 0;
        this.groupSpawnTimer = 0;
    }

    update(createEnemy: (enemy: Enemy) => void, waveConfig: WaveConfig, currentEnemyCount: number) {
        if (this.enemiesLeftInGroup > 0) {
            this.groupSpawnTimer--;
            if (this.groupSpawnTimer <= 0) {
                const currentPattern = this.currentWaveEnemiesToSpawn[this.currentSpawnConfigIndex];
                this.spawnEnemy(createEnemy, currentPattern.type, currentPattern.color, waveConfig.waveNumber);
                this.enemiesLeftInGroup--;

                if (this.enemiesLeftInGroup === 0) {
                    this.currentSpawnConfigIndex++;
                    if (this.currentSpawnConfigIndex < this.currentWaveEnemiesToSpawn.length) {
                        this.spawnTimer = this.currentWaveEnemiesToSpawn[this.currentSpawnConfigIndex].delay ?? 0;
                    }
                } else {
                    const baseInterval = 8;
                    const dynamicInterval = baseInterval + Math.floor(currentEnemyCount * 0.4);
                    this.groupSpawnTimer = Math.max(5, dynamicInterval);
                }
            }
            return;
        }

        if (this.currentSpawnConfigIndex < this.currentWaveEnemiesToSpawn.length) {
            const currentPattern = this.currentWaveEnemiesToSpawn[this.currentSpawnConfigIndex];

            if (this.spawnTimer === 0 && currentPattern.delay !== undefined) {
                this.spawnTimer = currentPattern.delay;
            }

            this.spawnTimer--;

            if (this.spawnTimer <= 0) {
                this.enemiesLeftInGroup = currentPattern.count;
                this.groupSpawnTimer = 0;
            }
        }
    }

    private spawnEnemy(createEnemy: (enemy: Enemy) => void, enemyType: EnemyType, fixedColor: GameColor | undefined, waveNumber: number) {
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        if (edge === 0) {
            x = Math.random() * this.canvasWidth;
            y = -30;
        } else if (edge === 1) {
            x = this.canvasWidth + 30;
            y = Math.random() * this.canvasHeight;
        } else if (edge === 2) {
            x = Math.random() * this.canvasWidth;
            y = this.canvasHeight + 30;
        } else {
            x = -30;
            y = Math.random() * this.canvasHeight;
        }

        let color: GameColor;
        let radius: number;
        let health: number;
        let speed: number;
        let points: number;
        let damage: number;
        let isChromaSentinel = false;

        const healthMultiplier = 1 + waveNumber * 0.1;
        const speedMultiplier = 1 + waveNumber * 0.02;
        const pointsMultiplier = 1 + waveNumber * 0.05;

        switch (enemyType) {
            case EnemyType.RED_BLOB:
                color = fixedColor || getRandomElement(PRIMARY_COLORS);
                radius = 15;
                health = Math.round(30 * healthMultiplier);
                speed = 1.5 * speedMultiplier;
                points = Math.round(10 * pointsMultiplier);
                damage = 10;
                break;
            case EnemyType.BLUE_SHARD:
                color = fixedColor || getRandomElement(PRIMARY_COLORS);
                radius = 18;
                health = Math.round(50 * healthMultiplier);
                speed = 1.8 * speedMultiplier;
                points = Math.round(20 * pointsMultiplier);
                damage = 15;
                break;
            case EnemyType.CHROMA_SENTINEL:
                color = fixedColor || getRandomElement(PRIMARY_COLORS);
                radius = 20;
                health = Math.round(80 * healthMultiplier);
                speed = 1.2 * speedMultiplier;
                points = Math.round(30 * pointsMultiplier);
                damage = 20;
                isChromaSentinel = true;
                break;
            default:
                color = getRandomElement(PRIMARY_COLORS);
                radius = 15;
                health = Math.round(30 * healthMultiplier);
                speed = 1.5 * speedMultiplier;
                points = Math.round(10 * pointsMultiplier);
                damage = 10;
                break;
        }

        const newEnemy = new Enemy(x, y, color, radius, health, speed, points, this.soundManager, isChromaSentinel);
        newEnemy.damage = damage;
        createEnemy(newEnemy);
    }

    hasMoreEnemiesToSpawn(): boolean {
        return this.currentSpawnConfigIndex < this.currentWaveEnemiesToSpawn.length || this.enemiesLeftInGroup > 0;
    }
}


export class WaveManager {
    public currentWave = 0;
    private waveInProgress = false;
    private fragmentsCollectedThisWave: number = 0;
    private isBossSpawning = false;
    private enemySpawner: EnemySpawner;
    private currentWaveConfig: WaveConfig = FALLBACK_WAVE_CONFIG;

    constructor(
        private canvasWidth: number,
        private canvasHeight: number,
        private soundManager: SoundManager,
        private entityManager: EntityManager
    ) {
        this.enemySpawner = new EnemySpawner(canvasWidth, canvasHeight, soundManager);
    }

    public startWave(waveNumber: number, upgradeCount: number) {
        this.currentWave = waveNumber;
        this.entityManager.resetForNewWave();
        this.isBossSpawning = false;
        this.fragmentsCollectedThisWave = 0;

        if (waveNumber > 0 && waveNumber % 5 === 0) {
            this.currentWaveConfig = {
                waveNumber: waveNumber,
                name: `Giga-Threat Level ${waveNumber / 5}`,
                bossType: EnemyType.MAIN_BOSS_1,
                enemySpawnPatterns: [],
                nextWaveHint: "The chromatic chaos intensifies...",
                fragmentsAwarded: 5,
            };
        } else {
            this.currentWaveConfig = WAVE_CONFIGS.find(w => w.waveNumber === waveNumber) || { ...FALLBACK_WAVE_CONFIG, waveNumber };
        }

        this.enemySpawner.initializeForWave(this.currentWaveConfig, upgradeCount);
        this.waveInProgress = true;

        if (this.currentWaveConfig.bossType) {
            this.spawnBossByType(this.currentWaveConfig.bossType);
        }
        gameStateStore.updateState({ currentWave: this.currentWave, isBetweenWaves: false });
    }

    private endWave() {
        this.waveInProgress = false;
        const isBossWave = !!this.entityManager.boss;
        gameStateStore.updateState({
            isBetweenWaves: true,
            waveCompletedFragments: this.fragmentsCollectedThisWave,
            isBossWave
        });
        this.entityManager.setBoss(null);
        this.isBossSpawning = false;
    }

    public update() {
        if (this.waveInProgress && !this.isBossSpawning) {
            this.enemySpawner.update(
                (enemy) => this.entityManager.addEnemy(enemy),
                this.currentWaveConfig,
                this.entityManager.getLiveEnemyCount()
            );
        }

        if (this.entityManager.boss) {
            if (!this.entityManager.boss.isAlive) {
                this.endWave();
            }
        } else {
            if (this.waveInProgress && !this.enemySpawner.hasMoreEnemiesToSpawn() && this.entityManager.getLiveEnemyCount() === 0 && !this.entityManager.hasActiveFragments()) {
                this.endWave();
            }
        }
    }

    public onFragmentCollected() {
        this.fragmentsCollectedThisWave++;
    }

    private spawnBossByType(bossType: EnemyType.MINI_BOSS_1 | EnemyType.MAIN_BOSS_1) {
        const bossX = this.canvasWidth / 2;
        const bossY = 100;

        if (bossType === EnemyType.MAIN_BOSS_1) {
            const waveMultiplier = Math.floor(this.currentWave / 5);
            const scaledHealth = 800 + (waveMultiplier * 300);
            const scaledDamage = 25 + (waveMultiplier * 5);
            const scaledAttackInterval = Math.max(40, 100 - (waveMultiplier * 6));

            const boss = new Boss(
                bossX,
                bossY,
                (bullet) => this.entityManager.addBullet(bullet),
                this.canvasWidth,
                this.canvasHeight,
                this.soundManager,
                scaledHealth,
                scaledDamage,
                scaledAttackInterval
            );
            this.entityManager.setBoss(boss);
        } else if (bossType === EnemyType.MINI_BOSS_1) {
            let bossHealthMultiplier = 1 + (this.currentWave * 0.1);
            const miniBossRadius = 30;
            const miniBossHealth = Math.round(300 * bossHealthMultiplier);
            const miniBossSpeed = 2.0;
            const miniBossPoints = Math.round(100 * (this.currentWave / 2));
            const miniBossColor = getRandomElement(PRIMARY_COLORS);

            const miniBoss = new Enemy(bossX, bossY, miniBossColor, miniBossRadius, miniBossHealth, miniBossSpeed, miniBossPoints, this.soundManager);
            miniBoss.damage = 20;
            this.entityManager.addEnemy(miniBoss);
        }
        this.isBossSpawning = true;
    }
}