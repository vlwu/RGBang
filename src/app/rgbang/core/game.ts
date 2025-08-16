import { Player } from '../entities/player';
import { Bullet } from '../entities/bullet';
import { Enemy } from '../entities/enemy';
import { Boss } from '../entities/boss';
import { UI } from '../ui/ui';
import { ParticleSystem } from '../entities/particle';
import { Vec2, Quadtree, distance } from '../common/utils';
import { GameColor } from '../data/color';
import { PrismFragment } from '../entities/prism-fragment';
import { SavedGameState } from './save-state';
import InputHandler from '../managers/input-handler';
import { SoundManager, SoundType } from '../managers/sound-manager';
import { gameStateStore } from './gameStateStore';
import { EntityManager } from '../managers/entityManager';
import { WaveManager } from '../managers/waveManager';
import { CollisionManager } from '../managers/collisionManager';
import { SandboxManager } from '../managers/sandboxManager';
import { EnemyType } from '../data/wave-data';

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
    private collisionManager!: CollisionManager;
    private sandboxManager!: SandboxManager | null;
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

        this.collisionManager = new CollisionManager({
            player: this.player,
            entityManager: this.entityManager,
            waveManager: this.waveManager,
            quadtree: this.quadtree,
            particles: this.particles,
            soundManager: this.soundManager,
            gameMode: this.gameMode,
            dealAreaDamage: this.dealAreaDamage.bind(this),
            createBullet: this.createBullet.bind(this),
            addScore: this.addScore.bind(this)
        });

        if (this.gameMode === 'freeplay') {
            this.sandboxManager = new SandboxManager({
                entityManager: this.entityManager,
                player: this.player,
                waveManager: this.waveManager,
                soundManager: this.soundManager,
                canvas: this.canvas
            });
        } else {
            this.sandboxManager = null;
        }

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
        gameStateStore.updateState({
            bankedUpgrades: this.bankedUpgrades,
            runUpgrades: this.player.upgradeManager.getActiveUpgradeMap()
        });
    }

    public getSandboxManager(): SandboxManager | null {
        return this.sandboxManager;
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

    public setBankedUpgrades(amount: number): void {
        this.bankedUpgrades = amount;
        gameStateStore.updateState({ bankedUpgrades: this.bankedUpgrades });
    }

    public addBankedUpgrades(amount: number): void {
        this.bankedUpgrades += amount;
        gameStateStore.updateState({ bankedUpgrades: this.bankedUpgrades });
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
        if (this.sandboxManager) {
            if (inputHandler.wasKeyReleased('o')) {
                this.sandboxManager.spawnEnemy(EnemyType.RED_BLOB);
            }
            if (inputHandler.wasKeyReleased('p')) {
                gameStateStore.updateState({ requestOpenUpgradeModal: true });
            }
            if (inputHandler.wasKeyReleased('k')) {
                this.sandboxManager.killAllEnemies();
            }
            if (inputHandler.wasKeyReleased('c')) {
                this.sandboxManager.clearAllBullets();
            }
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
            this.collisionManager.checkCollisions();
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

    public draw(currentWaveToDisplay: number, currentWaveCountdown: number, isBetweenWaves: boolean, inputHandler: InputHandler) {
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

        this.ui.draw(this.player, this.score, this.entityManager.boss, currentWaveToDisplay, this.entityManager.enemies, currentWaveCountdown, isBetweenWaves, this.gameMode === 'freeplay', inputHandler);
    }
}