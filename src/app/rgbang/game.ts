import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy, PunishmentType } from './enemy';
import { Boss } from './boss';
import { UI } from './ui';
import { ParticleSystem } from './particle';
import { circleCollision, Vec2, distance, Quadtree, QuadtreeObject } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color';
import { PrismFragment } from './prism-fragment';
import { SavedGameState } from './save-state';
import InputHandler from './input-handler';
import { SoundManager, SoundType } from './sound-manager';
import { WAVE_CONFIGS, FALLBACK_WAVE_CONFIG, EnemyType } from './wave-data';
import { gameStateStore } from './gameStateStore';
import { EntityManager } from './entityManager';
import { WaveManager } from './waveManager';
import { ALL_UPGRADES } from './upgrades';


export class Game {
    public canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    public player!: Player;
    private quadtree!: Quadtree;
    public particles: ParticleSystem;
    private ui!: UI;
    private soundManager!: SoundManager;

    private entityManager!: EntityManager;
    private waveManager!: WaveManager;
    public gameMode: 'normal' | 'freeplay' = 'normal';

    private score = 0;
    private nextBossScoreThreshold = 150;
    public isRunning = false;
    private bankedUpgrades = 0;

    private vortexes: {pos: Vec2, radius: number, strength: number, lifespan: number}[] = [];
    private slowingFields: {pos: Vec2, radius: number, lifespan: number}[] = [];

    constructor() {
        this.particles = new ParticleSystem();
    }

    public initialize(
        canvas: HTMLCanvasElement,
        initialState: SavedGameState,
        soundManager: SoundManager,
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.soundManager = soundManager;
        this.gameMode = initialState.gameMode || 'normal';

        this.quadtree = new Quadtree({ x: 0, y: 0, width: canvas.width, height: canvas.height }, 4);
        this.player = new Player(canvas.width / 2, canvas.height / 2, initialState.initialColor, this.soundManager);
        this.ui = new UI(canvas);

        this.entityManager = new EntityManager(this.particles, this.createVortex);
        this.waveManager = new WaveManager(canvas.width, canvas.height, this.soundManager, this.entityManager);

        this.score = initialState.score;
        this.player.health = initialState.playerHealth;
        this.nextBossScoreThreshold = initialState.nextBossScoreThreshold;
        this.waveManager.currentWave = initialState.currentWave || 0;
        this.bankedUpgrades = initialState.bankedUpgrades || 0;

        if (initialState.activeUpgrades) {
            initialState.activeUpgrades.forEach((level, id) => {
                this.player.upgradeManager.applyById(id, level);
            });
        }

        gameStateStore.resetState(this.getCurrentState());
    }

    public start() {
        this.isRunning = true;
        this.startWave(this.waveManager.currentWave || 1);
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
            currentWave: this.waveManager.currentWave,
            bankedUpgrades: this.bankedUpgrades,
            gameMode: this.gameMode
        };
    }

    public addScore(amount: number) {
        if (this.gameMode === 'freeplay') return;
        this.score += amount;
        gameStateStore.updateState({ score: this.score });
    }

    public createBullet = (bullet: Bullet) => {
        this.entityManager.addBullet(bullet);
    }

    public startWave(waveNumber: number) {
        if (this.gameMode === 'freeplay') {
            this.waveManager.currentWave = 1;
            gameStateStore.updateState({ currentWave: 1, isBetweenWaves: false });
            return;
        }
        const upgradeCount = this.player.upgradeManager.getActiveUpgradeMap().size;
        this.waveManager.startWave(waveNumber, upgradeCount);
        this.vortexes = [];
        this.slowingFields = [];
        gameStateStore.updateState({ currentWave: this.waveManager.currentWave, isBetweenWaves: false });
    }

    private handleFreeplayControls(inputHandler: InputHandler) {
        if (inputHandler.wasKeyReleased('o')) {
            const enemy = new Enemy(inputHandler.mousePos.x, inputHandler.mousePos.y, getRandomElement(PRIMARY_COLORS), 15, 30, 1.5, 10, this.soundManager);
            this.entityManager.addEnemy(enemy);
        }
        if (inputHandler.wasKeyReleased('p')) {
            gameStateStore.updateState({ requestOpenUpgradeModal: true });
        }
        if (inputHandler.wasKeyReleased('k')) {
            this.entityManager.enemies.forEach(e => e.isAlive = false);
        }
        if (inputHandler.wasKeyReleased('c')) {
            this.entityManager.bullets.forEach(b => b.isActive = false);
        }
    }

    public update(inputHandler: InputHandler, isGamePaused: boolean) {
        if (!this.isRunning) return;

        if (this.gameMode === 'freeplay') {
            this.handleFreeplayControls(inputHandler);
        }

        this.player.update(inputHandler, this.createBullet, this.particles, this.canvas.width, this.canvas.height, isGamePaused, this.slowingFields);
        this.particles.update();
        this.vortexes.forEach((v, i) => {
            v.lifespan--;
            if (v.lifespan <= 0) this.vortexes.splice(i, 1);
        });
        this.slowingFields.forEach((f, i) => {
            f.lifespan--;
            if (f.lifespan <= 0) this.slowingFields.splice(i, 1);
        });

        this.quadtree.clear();
        for (const enemy of this.entityManager.enemies) {
            if (enemy.isAlive) {
                this.quadtree.insert({
                    x: enemy.pos.x,
                    y: enemy.pos.y,
                    width: enemy.radius * 2,
                    height: enemy.radius * 2,
                    entity: enemy
                });
            }
        }

        if (!isGamePaused) {
            const actionCallbacks = {
                dealAreaDamage: this.dealAreaDamage,
                createSlowField: this.createSlowField,
            };

            this.entityManager.updateAll(this.player, this.canvas.width, this.canvas.height, this.vortexes, actionCallbacks);
            if (this.gameMode !== 'freeplay') {
                this.waveManager.update();
            }
            this.handleCollisions();
            this.entityManager.cleanup(this.canvas.width, this.canvas.height);

            if (this.entityManager.boss && !this.entityManager.boss.isAlive) {
                this.soundManager.play(SoundType.BossDestroy);
                this.particles.add(this.entityManager.boss.pos, this.entityManager.boss.color, 100);
                this.entityManager.addFragment(new PrismFragment(this.entityManager.boss.pos.x, this.entityManager.boss.pos.y, null));
                this.nextBossScoreThreshold = Math.round(this.nextBossScoreThreshold * 1.5);
            }
        }

        gameStateStore.updateState({
            playerHealth: this.player.health,
            playerMaxHealth: this.player.getMaxHealth()
        });

        if (!this.player.isAlive && this.gameMode !== 'freeplay') {
            this.soundManager.play(SoundType.GameOver);
            this.stop();
            gameStateStore.updateState({ isGameOver: true, score: this.score });
        }
    }

    public createVortex = (pos: Vec2, radius: number, strength: number, lifespan: number) => {
        this.vortexes.push({ pos, radius, strength, lifespan });
    }

    private createSlowField = (pos: Vec2, radius: number, lifespan: number) => {
        this.slowingFields.push({ pos, radius, lifespan });
    }

    private dealAreaDamage = (pos: Vec2, radius: number, damage: number, color: GameColor) => {
        this.particles.add(pos, color, 40);
        this.particles.addExplosionRipple(pos, radius);
        this.entityManager.enemies.forEach(enemy => {
            if (enemy.isAlive && distance({pos}, enemy) < radius + enemy.radius) {
                const result = enemy.takeDamage(damage, color, true);
                if (result.hit && this.player.lifestealPercent > 0) {
                    this.player.heal(result.damageDealt * this.player.lifestealPercent);
                }

                if (result.killed) {
                    this.particles.addExplosionRipple(enemy.pos, enemy.radius * 2.5);

                    this.addScore(enemy.points * this.player.scoreMultiplier);
                    this.entityManager.addFragment(new PrismFragment(enemy.pos.x, enemy.pos.y, enemy.color));
                    if (this.player.fragmentDuplicationChance > 0 && Math.random() < this.player.fragmentDuplicationChance) {
                         this.entityManager.addFragment(new PrismFragment(enemy.pos.x + 10, enemy.pos.y, enemy.color));
                    }
                }
            }
        });
    }

    private applySpecialEffects(bullet: Bullet, enemy: Enemy) {
        if (bullet.isVoid) {
            enemy.applyVoid(120 + this.player.voidLevel * 60);
        }
        if (bullet.isSlowing) {
            this.entityManager.enemies.forEach(e => {
                if(distance(e, {pos: bullet.pos}) < 50) {
                     e.applySlow(120 + this.player.slowingTrailLevel * 30, 0.5);
                }
            });
        }
        if (this.player.gravityWellLevel > 0 && bullet.color === GameColor.PURPLE) {
            this.vortexes.push({
                pos: enemy.pos,
                radius: 60 + this.player.gravityWellLevel * 15,
                strength: 0.3 + this.player.gravityWellLevel * 0.1,
                lifespan: 120
            });
        }
        if (bullet.color === GameColor.RED) {
            const igniteDamage = 1 + this.player.igniteLevel;
            const igniteDuration = 120 + this.player.igniteLevel * 30;
            enemy.applyIgnite(igniteDamage, igniteDuration);
        }
        if (bullet.color === GameColor.BLUE) {
            const freezeDuration = 60 + this.player.iceSpikerLevel * 15;
            enemy.applyFreeze(freezeDuration);
        }
        if (bullet.color === GameColor.YELLOW) {
            const chainRange = 100 + this.player.chainLightningLevel * 20;
            const maxChains = 1 + this.player.chainLightningLevel;
            const chainDamage = 5 + this.player.chainLightningLevel;
            enemy.triggerChainLightning(maxChains, chainDamage, chainRange);
        }
    }

    private handleCollisions() {
        for (const bullet of this.entityManager.bullets) {
            if (!bullet.isActive) continue;

            if (bullet.isFromBoss || bullet.isEnemyProjectile) {
                if (this.player.isAlive && circleCollision(bullet, this.player)) {
                    if (this.gameMode !== 'freeplay') {
                        this.player.takeDamage(bullet.damage);
                        if (bullet.slowsPlayer) {
                            this.player.applySlow(180);
                        }
                    }
                    this.particles.add(bullet.pos, bullet.color, 10);
                    bullet.isActive = false;
                }
                continue;
            }

            const potentialColliders = this.quadtree.query({
                x: bullet.pos.x,
                y: bullet.pos.y,
                width: bullet.radius * 2,
                height: bullet.radius * 2
            });

            for (const quadObj of potentialColliders) {
                const enemy = quadObj.entity as Enemy;
                if (!enemy.isAlive || bullet.hitEnemies.has(enemy)) continue;

                if (circleCollision(bullet, enemy)) {
                    if (bullet.penetrationsLeft <= 0) {
                        bullet.isActive = false;
                    } else {
                        bullet.penetrationsLeft--;
                    }
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
                        this.addScore(enemy.points * this.player.scoreMultiplier);
                        this.entityManager.addFragment(new PrismFragment(enemy.pos.x, enemy.pos.y, enemy.color));
                        if (this.player.fragmentDuplicationChance > 0 && Math.random() < this.player.fragmentDuplicationChance) {
                             this.entityManager.addFragment(new PrismFragment(enemy.pos.x + 10, enemy.pos.y, enemy.color));
                        }
                        if (this.player.explosiveFinishLevel > 0 && Math.random() < this.player.explosiveFinishLevel * 0.1) {
                            this.dealAreaDamage(enemy.pos, 50 + this.player.explosiveFinishLevel * 10, 10 + this.player.explosiveFinishLevel * 5, enemy.color);
                        }
                    }

                    this.particles.add(bullet.pos, bullet.color, 10);
                    if(!bullet.isActive) break;
                }
            }
            if (!bullet.isActive) continue;

            const boss = this.entityManager.boss;
            if (boss && boss.isAlive && circleCollision(bullet, boss)) {
                this.particles.add(bullet.pos, bullet.color, 15);
                boss.takeDamage(bullet.damage, bullet.color);
                bullet.isActive = false;
            }
        }

        for (const enemy of this.entityManager.enemies) {
            if (enemy.isAlive && this.player.isAlive && circleCollision(this.player, enemy)) {
                if (this.gameMode !== 'freeplay') {
                    this.player.takeDamage(enemy.damage);
                    this.player.applyKnockback(enemy.pos, 10);
                }
                enemy.takeDamage(enemy.health * 0.5, enemy.color, true);
                this.particles.add(enemy.pos, enemy.color, 10);
            }
        }

        const boss = this.entityManager.boss;
        if (boss && boss.isAlive && this.player.isAlive && circleCollision(this.player, boss)) {
            if (this.gameMode !== 'freeplay') {
                this.player.takeDamage(boss.damage);
                this.player.applyKnockback(boss.pos, 15);
            }
        }

        for (let i = this.entityManager.fragments.length - 1; i >= 0; i--) {
            const fragment = this.entityManager.fragments[i];
            if (fragment.isAlive && this.player.isAlive && circleCollision(this.player, fragment)) {
                this.soundManager.play(SoundType.FragmentCollect);
                const currentState = gameStateStore.getSnapshot();
                gameStateStore.updateState({
                    lastFragmentCollected: fragment.color || 'special',
                    fragmentCollectCount: currentState.fragmentCollectCount + 1,
                });
                if (this.gameMode !== 'freeplay') {
                    this.waveManager.onFragmentCollected();
                }
                this.particles.addPickupEffect(fragment.pos, fragment.color);
                this.player.triggerCollectionEffect(fragment.color);
                fragment.isAlive = false;
            }
        }

        for (const enemy1 of this.entityManager.enemies) {
            if (!enemy1.isAlive) continue;

            const queryBounds = {
                x: enemy1.pos.x, y: enemy1.pos.y,
                width: enemy1.radius * 2, height: enemy1.radius * 2
            };

            const potentialColliders = this.quadtree.query(queryBounds);

            for (const quadObj of potentialColliders) {
                const enemy2 = quadObj.entity as Enemy;

                if (!enemy2.isAlive || enemy1.id >= enemy2.id) {
                    continue;
                }

                if (circleCollision(enemy1, enemy2)) {
                    this.resolveEnemyCollision(enemy1, enemy2);
                }
            }
        }
    }

    private resolveEnemyCollision(enemy1: Enemy, enemy2: Enemy) {
        const distVec = enemy1.pos.sub(enemy2.pos);
        const dist = distVec.magnitude();
        const overlap = (enemy1.radius + enemy2.radius) - dist;

        if (overlap > 0) {
            const resolveVec = dist > 0 ? distVec.normalize().scale(overlap / 2) : new Vec2(0.1, 0);
            enemy1.pos.addInPlace(resolveVec);
            enemy2.pos.subInPlace(resolveVec);
        }
    }

    public draw(currentWaveToDisplay: number, currentWaveCountdown: number, isBetweenWaves: boolean) {
        if (!this.ctx) return;
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

        this.slowingFields.forEach(f => {
            this.ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 250 + f.pos.x));
            const progress = f.lifespan / 300;
            this.ctx.fillStyle = `rgba(102, 255, 140, ${0.1 + pulse * 0.2 * progress})`;
            this.ctx.strokeStyle = `rgba(102, 255, 140, ${0.3 + pulse * 0.2 * progress})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(f.pos.x, f.pos.y, f.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        });

        this.entityManager.drawAll(this.ctx);
        this.player.draw(this.ctx);

        this.ui.draw(this.player, this.score, this.entityManager.boss, currentWaveToDisplay, this.entityManager.enemies, currentWaveCountdown, isBetweenWaves, this.gameMode === 'freeplay');
    }

    public sandbox_spawnEnemy(enemyType: EnemyType, colorOverride?: GameColor) {
        if (this.gameMode !== 'freeplay' || !this.player) return;

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

    public sandbox_spawnBoss() {
        if (this.gameMode !== 'freeplay' || this.entityManager.boss) return;
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

    public sandbox_killAllEnemies() {
        if (this.gameMode !== 'freeplay') return;
        this.entityManager.enemies.forEach(e => e.isAlive = false);
        if(this.entityManager.boss) {
            this.entityManager.boss.health = 0;
            this.entityManager.boss.isAlive = false;
        }
    }

    public sandbox_clearAllBullets() {
        if (this.gameMode !== 'freeplay') return;
        this.entityManager.bullets.forEach(b => b.isActive = false);
    }

    public sandbox_addUpgrade(upgradeId: string) {
        if (this.gameMode !== 'freeplay') return;
        const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            const currentLevel = this.player.upgradeManager.getUpgradeLevel(upgradeId);
            if (currentLevel < upgrade.getMaxLevel()) {
                this.player.upgradeManager.apply(upgrade, 1);
            }
        }
    }

    public sandbox_removeUpgrade(upgradeId: string) {
        if (this.gameMode !== 'freeplay') return;
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

    public sandbox_maxUpgrade(upgradeId: string) {
        if (this.gameMode !== 'freeplay') return;
        const upgrade = ALL_UPGRADES.find(u => u.id === upgradeId);
        if (upgrade) {
            this.player.upgradeManager.applyMax(upgrade);
        }
    }
}