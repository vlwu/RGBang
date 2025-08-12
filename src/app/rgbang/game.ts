
import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { Boss } from './boss';
import { UI } from './ui';
import InputHandler from './input-handler';
import { ParticleSystem } from './particle';
import { circleCollision, Vec2, distance } from './utils';
import { getRandomElement, PRIMARY_COLORS, GameColor, ALL_COLORS } from './color';
import { PrismFragment } from './prism-fragment';
import { SavedGameState } from './save-state';

class EnemySpawner {
    private spawnInterval = 120; // frames
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
        if (edge === 0) { // Top
            x = Math.random() * this.canvasWidth;
            y = -30;
        } else if (edge === 1) { // Right
            x = this.canvasWidth + 30;
            y = Math.random() * this.canvasHeight;
        } else if (edge === 2) { // Bottom
            x = Math.random() * this.canvasWidth;
            y = this.canvasHeight + 30;
        } else { // Left
            x = -30;
            y = Math.random() * this.canvasHeight;
        }

        const availableColors = firstBossDefeated ? ALL_COLORS : PRIMARY_COLORS;
        const color = getRandomElement(availableColors);
        const radius = 15;
        
        // Dynamic difficulty scaling
        const healthMultiplier = 1 + upgradeCount * 0.15; // 15% more health per upgrade
        const speedMultiplier = 1 + upgradeCount * 0.05; // 5% more speed per upgrade
        const pointsMultiplier = 1 + upgradeCount * 0.2;  // 20% more points per upgrade
        
        const health = Math.round(30 * healthMultiplier);
        const speed = 1.5 * speedMultiplier;
        const points = Math.round(10 * pointsMultiplier);

        const newEnemy = new Enemy(x, y, color, radius, health, speed, points);
        createEnemy(newEnemy);
    }
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public player: Player;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private boss: Boss | null = null;
    private fragments: PrismFragment[] = [];
    private particles: ParticleSystem;
    private enemySpawner: EnemySpawner;
    private ui: UI;

    private score = 0;
    private nextBossScoreThreshold = 150;
    private firstBossDefeated = false;
    private isRunning = false;
    private animationFrameId: number | null = null;
    
    private onGameOver: (finalScore: number) => void;
    private onFragmentCollected: (color: GameColor | null) => void;

    constructor(
        canvas: HTMLCanvasElement, 
        onGameOver: (finalScore: number) => void,
        onFragmentCollected: (color: GameColor | null) => void,
        initialState: SavedGameState,
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onGameOver = onGameOver;
        this.onFragmentCollected = onFragmentCollected;

        this.player = new Player(canvas.width / 2, canvas.height / 2, initialState.initialColor);
        this.enemySpawner = new EnemySpawner(canvas.width, canvas.height);
        this.ui = new UI(canvas);
        this.particles = new ParticleSystem();
        
        // Restore state
        this.score = initialState.score;
        this.player.health = initialState.playerHealth;
        this.nextBossScoreThreshold = initialState.nextBossScoreThreshold;
        // This check is a bit of a hack, we should find a better way to check if it's a new game
        this.firstBossDefeated = initialState.score > 150; 
        initialState.activeUpgrades.forEach((level, id) => {
            this.player.upgradeManager.applyById(id, level);
        });
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

    private createBullet = (bullet: Bullet) => {
        this.bullets.push(bullet);
    }
    
    private createEnemy = (enemy: Enemy) => {
        enemy.onSplit = this.createEnemy; // Assign the callback here
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
            this.canvas.height
        );
        this.enemies = []; // Clear existing enemies
    }

    public update(inputHandler: InputHandler, isPaused: boolean) {
        if (!this.isRunning) return;
        
        if (!isPaused) {
            // 1. Update entities
            this.player.update(inputHandler, this.createBullet, this.particles, this.canvas.width, this.canvas.height);
            
            this.bullets.forEach(bullet => bullet.update());
            this.enemies.forEach(enemy => enemy.update(this.player));
            this.fragments.forEach(fragment => fragment.update(this.player));
            this.boss?.update();

            // 2. Handle collisions
            this.handleCollisions();
            
            // 3. Update particle effects
            this.particles.update();

            // 4. Remove dead entities and out-of-bounds bullets
            this.cleanupEntities();

            // 5. Spawn new enemies or boss
            if (this.boss) {
                if (!this.boss.isAlive) {
                    this.particles.add(this.boss.pos, this.boss.color, 100);
                    this.fragments.push(new PrismFragment(this.boss.pos.x, this.boss.pos.y, null)); // null for white/special
                    this.nextBossScoreThreshold = Math.round(this.nextBossScoreThreshold * 1.5); // Increase threshold by 50%
                    this.boss = null;
                    this.firstBossDefeated = true;
                }
            } else {
                // No boss active, spawn regular enemies
                const upgradeCount = this.player.upgradeManager.activeUpgrades.size;
                this.enemySpawner.update(this.enemies.length, upgradeCount, this.firstBossDefeated, this.createEnemy);
                // Check if it's time to spawn a boss
                if (this.score >= this.nextBossScoreThreshold) {
                    this.spawnBoss();
                }
            }
            
            // 6. Check for game over condition
            if (!this.player.isAlive) {
                this.stop();
                this.onGameOver(this.score);
            }
        } else {
            // If paused, we might still want to update some things, like the radial menu
            this.player.update(inputHandler, this.createBullet, this.particles, this.canvas.width, this.canvas.height);
        }

        // Always reset input events and draw
        inputHandler.resetEvents();
        this.draw();
    }
    
    private applySpecialEffects(bullet: Bullet, enemy: Enemy) {
        if (this.player.hasIgnite && bullet.color === GameColor.RED) {
            enemy.applyIgnite(2, 180); // 2 damage, 3 seconds
        }
        if (this.player.hasIceSpiker && bullet.color === GameColor.BLUE) {
            enemy.applyFreeze(90); // 1.5 seconds
        }
        if (this.player.hasChainLightning && bullet.color === GameColor.YELLOW) {
            this.handleChainLightning(enemy);
        }
    }
    
    private handleChainLightning(hitEnemy: Enemy) {
        const chainRange = 150;
        const chainDamage = 5;
        let closestEnemy: Enemy | null = null;
        let minDistance = Infinity;

        for (const otherEnemy of this.enemies) {
            if (otherEnemy === hitEnemy || !otherEnemy.isAlive) continue;

            const d = distance(hitEnemy, otherEnemy);
            if (d < chainRange && d < minDistance) {
                minDistance = d;
                closestEnemy = otherEnemy;
            }
        }

        if (closestEnemy) {
            this.particles.addLightning(hitEnemy.pos, closestEnemy.pos);
            closestEnemy.takeDamage(chainDamage, GameColor.YELLOW);
        }
    }


    private handleCollisions() {
        // Bullet-Enemy Collisions
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
            
            // Player bullet collisions
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (enemy.isAlive && circleCollision(bullet, enemy)) {
                    this.particles.add(bullet.pos, bullet.color, 10);
                    
                    const hitSuccess = enemy.takeDamage(bullet.damage, bullet.color);
                    
                    if (hitSuccess) {
                        this.applySpecialEffects(bullet, enemy);
                        if (!enemy.isAlive) {
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
            
            // Check collision with boss
            if (this.boss && this.boss.isAlive && circleCollision(bullet, this.boss)) {
                this.particles.add(bullet.pos, bullet.color, 15);
                this.boss.takeDamage(bullet.damage, bullet.color);
                this.bullets.splice(i, 1);
                continue;
            }
        }

        // Player-Enemy Collisions
        for (const enemy of this.enemies) {
            if (enemy.isAlive && this.player.isAlive && circleCollision(this.player, enemy)) {
                this.player.takeDamage(enemy.damage);
                enemy.isAlive = false; // Enemy dies on collision with player
                this.particles.add(enemy.pos, enemy.color, 10);
                // No fragment drop on collision
            }
        }

        // Player-Boss Collision
        if (this.boss && this.boss.isAlive && this.player.isAlive && circleCollision(this.player, this.boss)) {
            this.player.takeDamage(this.boss.damage);
            // Boss doesn't die from collision, just damages player
        }

        // Player-Fragment Collision
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const fragment = this.fragments[i];
            if (fragment.isAlive && this.player.isAlive && circleCollision(this.player, fragment)) {
                this.onFragmentCollected(fragment.color);
                this.particles.addPickupEffect(fragment.pos, fragment.color);
                fragment.isAlive = false;
            }
        }


        // Enemy-Enemy Collisions for separation
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

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.isAlive);
        this.fragments = this.fragments.filter(f => f.isAlive);
        
        // Remove off-screen bullets
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
    
    private draw() {
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
