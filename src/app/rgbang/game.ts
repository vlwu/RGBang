import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy, PunishmentType } from './enemy';
import { Boss } from './boss';
import { UI } from './ui';
import { ParticleSystem } from './particle';
import { circleCollision, Vec2, distance } from './utils';
import { getRandomElement, PRIMARY_COLORS, GameColor, ALL_COLORS, COLOR_DETAILS } from './color';
import { PrismFragment } from './prism-fragment';
import { SavedGameState } from './save-state';
import InputHandler from './input-handler';
import { SoundManager, SoundType } from './sound-manager';
import { WAVE_CONFIGS, WaveConfig, EnemySpawnConfig, EnemyType, FALLBACK_WAVE_CONFIG, generateProceduralWave } from './wave-data';

class EnemySpawner {
    private spawnTimer = 0;
    private currentSpawnConfigIndex = 0;
    private currentWaveEnemiesToSpawn: EnemySpawnConfig[] = [];
    private soundManager: SoundManager;

    constructor(private canvasWidth: number, private canvasHeight: number, soundManager: SoundManager) {
        this.soundManager = soundManager;
    }

    initializeForWave(waveConfig: WaveConfig) {
        if (waveConfig.bossType) {
            this.currentWaveEnemiesToSpawn = waveConfig.enemySpawnPatterns || [];
        } else {
            this.currentWaveEnemiesToSpawn = generateProceduralWave(waveConfig.waveNumber);
        }
        this.currentSpawnConfigIndex = 0;
        this.spawnTimer = 0;
    }

    update(createEnemy: (enemy: Enemy) => void, waveConfig: WaveConfig) {
        if (this.currentSpawnConfigIndex < this.currentWaveEnemiesToSpawn.length) {
            const currentPattern = this.currentWaveEnemiesToSpawn[this.currentSpawnConfigIndex];

            if (this.spawnTimer === 0 && currentPattern.delay !== undefined) {
                this.spawnTimer = currentPattern.delay;
            }

            this.spawnTimer--;

            if (this.spawnTimer <= 0) {
                for (let i = 0; i < currentPattern.count; i++) {
                    this.spawnEnemy(createEnemy, currentPattern.type, currentPattern.color, waveConfig.waveNumber);
                }
                this.currentSpawnConfigIndex++;
                if (this.currentSpawnConfigIndex < this.currentWaveEnemiesToSpawn.length && this.currentWaveEnemiesToSpawn[this.currentSpawnConfigIndex].delay !== undefined) {
                    this.spawnTimer = this.currentWaveEnemiesToSpawn[this.currentSpawnConfigIndex].delay!;
                } else {
                    this.spawnTimer = 0;
                }
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
        return this.currentSpawnConfigIndex < this.currentWaveEnemiesToSpawn.length;
    }
}

export class Game {
    public canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public player: Player;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private boss: Boss | null = null;
    private fragments: PrismFragment[] = [];
    public particles: ParticleSystem;
    private enemySpawner: EnemySpawner;
    private ui: UI;
    private soundManager: SoundManager;

    private score = 0;
    private nextBossScoreThreshold = 150;
    private firstBossDefeated = false;
    public isRunning = false;
    private isBossSpawning = false;

    // New upgrade-related entities
    private vortexes: {pos: Vec2, radius: number, strength: number, lifespan: number}[] = [];

    public currentWave = 0;
    private waveInProgress = false;
    private fragmentsCollectedThisWave: number = 0;

    private onGameOver: (finalScore: number) => void;
    private onFragmentCollected: (color: GameColor | null) => void;
    public onWaveCompleted: (waveNumber: number, isBossWave: boolean, fragmentsToAward: number) => void;

    constructor(
        canvas: HTMLCanvasElement,
        onGameOver: (finalScore: number) => void,
        onFragmentCollected: (color: GameColor | null) => void,
        onWaveCompleted: (waveNumber: number, isBossWave: boolean, fragmentsToAward: number) => void,
        initialState: SavedGameState,
        soundManager: SoundManager,
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onGameOver = onGameOver;
        this.onFragmentCollected = onFragmentCollected;
        this.onWaveCompleted = onWaveCompleted;
        this.soundManager = soundManager;

        this.player = new Player(canvas.width / 2, canvas.height / 2, initialState.initialColor, this.soundManager);

        this.enemySpawner = new EnemySpawner(canvas.width, this.canvas.height, this.soundManager);
        this.ui = new UI(canvas);
        this.particles = new ParticleSystem();

        this.score = initialState.score;
        this.player.health = initialState.playerHealth;
        this.nextBossScoreThreshold = initialState.nextBossScoreThreshold;
        this.firstBossDefeated = initialState.nextBossScoreThreshold > 150;
        this.currentWave = initialState.currentWave || 0;

        if (initialState.activeUpgrades) {
            initialState.activeUpgrades.forEach((level, id) => {
                this.player.upgradeManager.applyById(id, level);
            });
        }
    }

    public start() {
        this.isRunning = true;
        if (this.currentWave === 0) {
            this.startWave(1);
        } else {
            const waveConfig = WAVE_CONFIGS.find(w => w.waveNumber === this.currentWave) || { ...FALLBACK_WAVE_CONFIG, waveNumber: this.currentWave };
            this.enemySpawner.initializeForWave(waveConfig);
            this.waveInProgress = true;
            if (waveConfig.bossType) {
                this.spawnBossByType(waveConfig.bossType);
            }
        }
    }

    public stop() {
        this.isRunning = false;
    }

    public getCurrentState(): SavedGameState {
        return {
            score: this.score,
            playerHealth: this.player.health,
            activeUpgrades: this.player.upgradeManager.getActiveUpgradeMap(),
            nextBossScoreThreshold: this.nextBossScoreThreshold,
            initialColor: this.player.currentColor,
            currentWave: this.currentWave,
        };
    }

    public addScore(amount: number) {
        this.score += amount;
    }

    public createBullet = (bullet: Bullet) => {
        this.bullets.push(bullet);
    }

    private createEnemy = (enemy: Enemy) => {
        enemy.onSplit = (newEnemy) => {
            this.createEnemy(newEnemy);
        };
        this.enemies.push(enemy);
    }

    public startWave(waveNumber: number) {
        this.currentWave = waveNumber;
        this.enemies = [];
        this.bullets = [];
        this.fragments = [];
        this.vortexes = [];
        this.isBossSpawning = false;
        this.boss = null;
        this.fragmentsCollectedThisWave = 0;

        const waveConfig = WAVE_CONFIGS.find(w => w.waveNumber === waveNumber) || { ...FALLBACK_WAVE_CONFIG, waveNumber };

        this.enemySpawner.initializeForWave(waveConfig);
        this.waveInProgress = true;

        if (waveConfig.bossType) {
            this.spawnBossByType(waveConfig.bossType);
        }
    }

    private endWave() {
        this.waveInProgress = false;
        this.onWaveCompleted(this.currentWave, !!this.boss, this.fragmentsCollectedThisWave);
        this.boss = null;
        this.isBossSpawning = false;
    }

    private spawnBossByType(bossType: EnemyType.MINI_BOSS_1 | EnemyType.MAIN_BOSS_1) {
        const bossX = this.canvas.width / 2;
        const bossY = 100;

        let bossHealthMultiplier = 1 + (this.currentWave * 0.1);

        if (bossType === EnemyType.MAIN_BOSS_1) {
            this.boss = new Boss(
                bossX,
                bossY,
                this.createBullet,
                this.canvas.width,
                this.canvas.height,
                this.soundManager
            );
            this.boss.maxHealth = Math.round(1000 * bossHealthMultiplier);
            this.boss.health = this.boss.maxHealth;
        } else if (bossType === EnemyType.MINI_BOSS_1) {
            const miniBossRadius = 30;
            const miniBossHealth = Math.round(300 * bossHealthMultiplier);
            const miniBossSpeed = 2.0;
            const miniBossPoints = Math.round(100 * (this.currentWave / 2));
            const miniBossColor = getRandomElement(PRIMARY_COLORS);

            const miniBoss = new Enemy(bossX, bossY, miniBossColor, miniBossRadius, miniBossHealth, miniBossSpeed, miniBossPoints, this.soundManager);
            miniBoss.damage = 20;
            miniBoss.onSplit = (newEnemy) => {
                this.createEnemy(newEnemy);
            };
            this.enemies.push(miniBoss);
        }
        this.isBossSpawning = true;
    }

    public update(inputHandler: InputHandler, isGamePaused: boolean) {
        if (!this.isRunning) return;

        this.player.update(inputHandler, this.createBullet, this.particles, this.canvas.width, this.canvas.height, isGamePaused);
        this.particles.update();
        this.vortexes.forEach((v, i) => {
            v.lifespan--;
            if (v.lifespan <= 0) this.vortexes.splice(i, 1);
        });

        if (!isGamePaused) {
            this.bullets.forEach(bullet => bullet.update(this.enemies, this.canvas.width, this.canvas.height));
            this.enemies.forEach(enemy => enemy.update(this.player, this.enemies, this.particles, this.vortexes));
            this.boss?.update();
            this.fragments.forEach(fragment => fragment.update(this.player, this.particles));

            if (this.waveInProgress && !this.isBossSpawning) {
                const waveConfig = WAVE_CONFIGS.find(w => w.waveNumber === this.currentWave) || { ...FALLBACK_WAVE_CONFIG, waveNumber: this.currentWave };
                this.enemySpawner.update(this.createEnemy, waveConfig);
            }

            this.handleCollisions();
            this.cleanupEntities();

            if (this.boss) {
                if (!this.boss.isAlive) {
                    this.soundManager.play(SoundType.BossDestroy);
                    this.particles.add(this.boss.pos, this.boss.color, 100);
                    this.fragments.push(new PrismFragment(this.boss.pos.x, this.boss.pos.y, null));
                    this.nextBossScoreThreshold = Math.round(this.nextBossScoreThreshold * 1.5);

                    this.endWave();
                }
            } else {
                if (this.waveInProgress && !this.enemySpawner.hasMoreEnemiesToSpawn() && this.enemies.length === 0 && this.bullets.length === 0 && this.fragments.length === 0) {
                    this.endWave();
                }
            }
        }

        if (!this.player.isAlive) {
            this.soundManager.play(SoundType.GameOver);
            this.stop();
            this.onGameOver(this.score);
        }
    }

    private dealAreaDamage(pos: Vec2, radius: number, damage: number, color: GameColor) {
        this.particles.add(pos, color, 40);
        this.enemies.forEach(enemy => {
            if (enemy.isAlive && distance({pos}, enemy) < radius + enemy.radius) {
                const result = enemy.takeDamage(damage, color);
                if (result.hit && this.player.lifestealPercent > 0) {
                    this.player.heal(result.damageDealt * this.player.lifestealPercent);
                }
            }
        });
    }

    private applySpecialEffects(bullet: Bullet, enemy: Enemy) {
        // This is called on a successful hit
        if (bullet.isVoid) {
            enemy.applyVoid(120 + this.player.voidLevel * 60);
        }
        if (bullet.isSlowing) {
            this.enemies.forEach(e => {
                if(distance(e, {pos: bullet.pos}) < 50) {
                     e.applySlow(120 + this.player.slowingTrailLevel * 30, 0.5);
                }
            });
        }
        if (this.player.gravityWellLevel > 0 && bullet.color === GameColor.BLUE) {
            this.vortexes.push({
                pos: enemy.pos,
                radius: 80 + this.player.gravityWellLevel * 20,
                strength: 0.5 + this.player.gravityWellLevel * 0.2,
                lifespan: 180
            });
        }
        if (this.player.igniteLevel > 0 && bullet.color === GameColor.RED) {
            const igniteDamage = 1 + this.player.igniteLevel;
            const igniteDuration = 120 + this.player.igniteLevel * 30;
            enemy.applyIgnite(igniteDamage, igniteDuration);
        }
        if (this.player.iceSpikerLevel > 0 && bullet.color === GameColor.BLUE) {
            const freezeDuration = 60 + this.player.iceSpikerLevel * 15;
            enemy.applyFreeze(freezeDuration);
        }
        if (this.player.chainLightningLevel > 0 && bullet.color === GameColor.YELLOW) {
            const chainRange = 100 + this.player.chainLightningLevel * 20;
            const maxChains = this.player.chainLightningLevel;
            const chainDamage = 5 + this.player.chainLightningLevel;
            enemy.triggerChainLightning(maxChains, chainDamage, chainRange);
        }
    }

    private handleCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let bulletRemoved = false;

            if (bullet.isFromBoss) {
                if (this.player.isAlive && circleCollision(bullet, this.player)) {
                    this.player.takeDamage(bullet.damage);
                    this.particles.add(bullet.pos, bullet.color, 10);
                    this.bullets.splice(i, 1);
                }
                continue;
            }

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (!enemy.isAlive || bullet.hitEnemies.has(enemy)) continue;

                if (circleCollision(bullet, enemy)) {
                    if (bullet.penetrationsLeft === 0) bulletRemoved = true;
                    else bullet.penetrationsLeft--;
                    bullet.hitEnemies.add(enemy);

                    let damageToDeal = bullet.damage;
                    const reversalDamage = this.player.tryPunishmentReversal();
                    if (reversalDamage > 0) {
                        damageToDeal += reversalDamage;
                        this.particles.add(this.player.pos, GameColor.YELLOW, 30);
                    }
                    const result = enemy.takeDamage(damageToDeal, bullet.color);

                    if (result.hit) {
                        this.soundManager.play(SoundType.EnemyHit);
                        this.applySpecialEffects(bullet, enemy);
                        if (this.player.lifestealPercent > 0) {
                            this.player.heal(result.damageDealt * this.player.lifestealPercent);
                        }
                        if (bullet.isFission && Math.random() < this.player.fissionLevel * 0.15) {
                            const [c1, c2] = COLOR_DETAILS[bullet.color].components!;
                            const dir1 = new Vec2(Math.random() - 0.5, Math.random() - 0.5);
                            const dir2 = new Vec2(Math.random() - 0.5, Math.random() - 0.5);
                            this.createBullet(new Bullet(enemy.pos, dir1, c1));
                            this.createBullet(new Bullet(enemy.pos, dir2, c2));
                        }
                    } else {
                        this.player.addPunishmentMeter();
                        if (enemy.activePunishment === PunishmentType.REFLECT_BULLET) {
                            this.soundManager.play(SoundType.EnemyReflect, 0.7);
                            const reflectedDirection = this.player.pos.sub(bullet.pos).normalize();
                            this.createBullet(new Bullet(enemy.pos, reflectedDirection, bullet.color, true));
                        }
                    }
                    
                    if (result.killed) {
                        this.score += enemy.points * this.player.scoreMultiplier;
                        this.fragments.push(new PrismFragment(enemy.pos.x, enemy.pos.y, enemy.color));
                        if (this.player.fragmentDuplicationChance > 0 && Math.random() < this.player.fragmentDuplicationChance) {
                             this.fragments.push(new PrismFragment(enemy.pos.x + 10, enemy.pos.y, enemy.color));
                        }
                        if (this.player.explosiveFinishLevel > 0 && Math.random() < this.player.explosiveFinishLevel * 0.1) {
                            this.dealAreaDamage(enemy.pos, 50 + this.player.explosiveFinishLevel * 10, 10 + this.player.explosiveFinishLevel * 5, enemy.color);
                        }
                    }
                    
                    this.particles.add(bullet.pos, bullet.color, 10);
                    if(bulletRemoved) break;
                }
            }
            if (bulletRemoved) {
                this.bullets.splice(i, 1);
                continue;
            }

            if (this.boss && this.boss.isAlive && circleCollision(bullet, this.boss)) {
                this.particles.add(bullet.pos, bullet.color, 15);
                this.boss.takeDamage(bullet.damage, bullet.color);
                this.bullets.splice(i, 1);
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.isAlive && this.player.isAlive && circleCollision(this.player, enemy)) {
                this.player.takeDamage(enemy.damage);
                enemy.isAlive = false;
                this.particles.add(enemy.pos, enemy.color, 10);
            }
        }

        if (this.boss && this.boss.isAlive && this.player.isAlive && circleCollision(this.player, this.boss)) {
            this.player.takeDamage(this.boss.damage);
            this.player.applyKnockback(this.boss.pos, 15);
        }

        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            if (fragment.isAlive && this.player.isAlive && circleCollision(this.player, fragment)) {
                this.soundManager.play(SoundType.FragmentCollect);
                this.onFragmentCollected(fragment.color);
                this.fragmentsCollectedThisWave++;
                this.particles.addPickupEffect(fragment.pos, fragment.color);
                fragment.isAlive = false;
            }
        }

        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];
                if (enemy1.isAlive && enemy2.isAlive && circleCollision(enemy1, enemy2)) {
                    this.resolveEnemyCollision(enemy1, enemy2);
                }
            }
        }
    }

    private cleanupEntities() {
        this.enemies.forEach(enemy => {
            if (!enemy.isAlive) {
                this.particles.add(enemy.pos, enemy.color, 30);
                if (enemy.isIgnited) {
                   this.particles.add(enemy.pos, GameColor.RED, 15);
                }
            }
        });

        this.enemies = this.enemies.filter(e => e.isAlive);
        this.fragments = this.fragments.filter(f => f.isAlive);

        this.bullets = this.bullets.filter((bullet) =>
            (bullet.pos.x >= 0 && bullet.pos.x <= this.canvas.width && bullet.pos.y >= 0 && bullet.pos.y <= this.canvas.height) || bullet.ricochetsLeft > 0
        );
    }

    private resolveEnemyCollision(enemy1: Enemy, enemy2: Enemy) {
        const distVec = enemy1.pos.sub(enemy2.pos);
        const dist = distVec.magnitude();
        const overlap = (enemy1.radius + enemy2.radius) - dist;

        if (overlap > 0) {
            const resolveVec = dist > 0 ? distVec.normalize().scale(overlap / 2) : new Vec2(0.1, 0);
            enemy1.pos = enemy1.pos.add(resolveVec);
            enemy2.pos = enemy2.pos.sub(resolveVec);
        }
    }

    public draw(currentWaveToDisplay: number, currentWaveCountdown: number, isBetweenWaves: boolean) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0A020F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.draw(this.ctx);
        this.vortexes.forEach(v => {
            this.ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 200 + v.pos.x));
            this.ctx.fillStyle = `rgba(120, 80, 220, ${0.1 + pulse * 0.2})`;
            this.ctx.beginPath();
            this.ctx.arc(v.pos.x, v.pos.y, v.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        this.boss?.draw(this.ctx);
        this.enemies.forEach(e => e.draw(this.ctx));
        this.fragments.forEach(p => p.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ui.draw(this.player, this.score, this.boss, currentWaveToDisplay, this.enemies.length, currentWaveCountdown, isBetweenWaves);
    }
}