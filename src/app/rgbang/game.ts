import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { Boss } from './boss';
import { UI } from './ui';
import { ParticleSystem } from './particle';
import { circleCollision, Vec2 } from './utils';
import { getRandomElement, PRIMARY_COLORS, GameColor, ALL_COLORS } from './color';
import { PrismFragment } from './prism-fragment';
import { SavedGameState } from './save-state';
import InputHandler from './input-handler';
import { SoundManager, SoundType } from './sound-manager';

class EnemySpawner {
    private spawnInterval = 120;
    private spawnTimer = 0;
    private maxEnemies = 20;

    constructor(private canvasWidth: number, private canvasHeight: number) {}

    update(currentEnemyCount: number, upgradeCount: number, firstBossDefeated: boolean, createEnemy: (enemy: Enemy) => void) {
        this.spawnTimer--;
        if (this.spawnTimer <= 0 && currentEnemyCount < this.maxEnemies) {
            this.spawnEnemy(createEnemy, upgradeCount, firstBossDefeated);
            this.spawnTimer = this.spawnInterval;

            if (this.spawnInterval > 30) {
                this.spawnInterval *= 0.995;
            }
        }
    }

    private spawnEnemy(createEnemy: (enemy: Enemy) => void, upgradeCount: number, firstBossDefeated: boolean) {
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

        const availableColors = firstBossDefeated ? ALL_COLORS : PRIMARY_COLORS;
        const color = getRandomElement(availableColors);
        const radius = 15;


        const healthMultiplier = 1 + upgradeCount * 0.15;
        const speedMultiplier = 1 + upgradeCount * 0.05;
        const pointsMultiplier = 1 + upgradeCount * 0.2;

        const health = Math.round(30 * healthMultiplier);
        const speed = 1.5 * speedMultiplier;
        const points = Math.round(10 * pointsMultiplier);

        const newEnemy = new Enemy(x, y, color, radius, health, speed, points);
        createEnemy(newEnemy);
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

    private onGameOver: (finalScore: number) => void;
    private onFragmentCollected: (color: GameColor | null) => void;

    constructor(
        canvas: HTMLCanvasElement,
        onGameOver: (finalScore: number) => void,
        onFragmentCollected: (color: GameColor | null) => void,
        initialState: SavedGameState,
        soundManager: SoundManager,
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onGameOver = onGameOver;
        this.onFragmentCollected = onFragmentCollected;
        this.soundManager = soundManager;

        this.player = new Player(canvas.width / 2, canvas.height / 2, initialState.initialColor, this.soundManager);
        this.enemySpawner = new EnemySpawner(canvas.width, this.canvas.height);
        this.ui = new UI(canvas);
        this.particles = new ParticleSystem();


        this.score = initialState.score;
        this.player.health = initialState.playerHealth;
        this.nextBossScoreThreshold = initialState.nextBossScoreThreshold;
        this.firstBossDefeated = initialState.nextBossScoreThreshold > 150;


        if (initialState.activeUpgrades) {
            initialState.activeUpgrades.forEach((level, id) => {
                this.player.upgradeManager.applyById(id, level);
            });
        }
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
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
            this.soundManager.play(SoundType.EnemySplit);
            this.createEnemy(newEnemy);
        };
        this.enemies.push(enemy);
    }

    private spawnBoss() {
        if (this.boss) return;
        const bossX = this.canvas.width / 2;
        const bossY = 100;
        this.boss = new Boss(
            bossX,
            bossY,
            this.createBullet,
            this.canvas.width,
            this.canvas.height,
            this.soundManager
        );
        this.enemies = [];
    }

    public update(inputHandler: InputHandler) {

        this.player.update(inputHandler, this.createBullet, this.particles, this.canvas.width, this.canvas.height);

        this.bullets.forEach(bullet => bullet.update());
        this.enemies.forEach(enemy => enemy.update(this.player, this.enemies, this.particles));
        this.boss?.update();


        this.handleCollisions();


        this.particles.update();


        this.cleanupEntities();


        if (this.boss) {
            if (!this.boss.isAlive) {
                this.soundManager.play(SoundType.BossDestroy);
                this.particles.add(this.boss.pos, this.boss.color, 100);
                this.fragments.push(new PrismFragment(this.boss.pos.x, this.boss.pos.y, null));
                this.nextBossScoreThreshold = Math.round(this.nextBossScoreThreshold * 1.5);
                this.boss = null;
                this.firstBossDefeated = true;
                this.isBossSpawning = false;
            }
        } else if (!this.isBossSpawning) {

            const upgradeCount = this.player.upgradeManager.activeUpgrades.size;
            this.enemySpawner.update(this.enemies.length, upgradeCount, this.firstBossDefeated, this.createEnemy);

            if (this.score >= this.nextBossScoreThreshold) {
                this.isBossSpawning = true;
                this.spawnBoss();
            }
        }


        if (!this.player.isAlive) {
            this.stop();
            this.onGameOver(this.score);
        }
    }

    private applySpecialEffects(bullet: Bullet, enemy: Enemy) {
        const chainRange = 100 + this.player.chainLightningLevel * 20;

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

                if (enemy.isAlive && circleCollision(bullet, enemy)) {
                    this.particles.add(bullet.pos, bullet.color, 10);

                    const hitSuccess = enemy.takeDamage(bullet.damage, bullet.color);

                    if (hitSuccess) {
                        this.soundManager.play(SoundType.EnemyHit);
                        this.applySpecialEffects(bullet, enemy);
                        if (!enemy.isAlive) {
                           this.soundManager.play(SoundType.EnemyDestroy);
                           this.score += enemy.points;
                           this.fragments.push(new PrismFragment(enemy.pos.x, enemy.pos.y, enemy.color));
                        }
                    }

                    this.bullets.splice(i, 1);
                    bulletRemoved = true;
                    break;
                }
            }
            if (bulletRemoved) continue;


            if (this.boss && this.boss.isAlive && circleCollision(bullet, this.boss)) {
                this.particles.add(bullet.pos, bullet.color, 15);
                this.boss.takeDamage(bullet.damage, bullet.color);
                this.bullets.splice(i, 1);
                continue;
            }
        }


        for (const enemy of this.enemies) {
            if (enemy.isAlive && this.player.isAlive && circleCollision(this.player, enemy)) {
                this.player.takeDamage(enemy.damage);
                enemy.isAlive = false;
                this.soundManager.play(SoundType.EnemyDestroy);
                this.particles.add(enemy.pos, enemy.color, 10);

            }
        }


        if (this.boss && this.boss.isAlive && this.player.isAlive && circleCollision(this.player, this.boss)) {
            this.player.takeDamage(this.boss.damage);

        }


        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            if (fragment.isAlive && this.player.isAlive && circleCollision(this.player, fragment)) {
                this.soundManager.play(SoundType.FragmentCollect);
                this.onFragmentCollected(fragment.color);
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
            !(bullet.pos.x < 0 || bullet.pos.x > this.canvas.width || bullet.pos.y < 0 || bullet.pos.y > this.canvas.height)
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

    public draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0A020F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.draw(this.ctx);
        this.boss?.draw(this.ctx);
        this.enemies.forEach(e => e.draw(this.ctx));
        this.fragments.forEach(p => p.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.player.draw(this.ctx);

        this.ui.draw(this.player, this.score, this.boss);
    }
}