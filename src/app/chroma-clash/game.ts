
import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { UI } from './ui';
import InputHandler from './input-handler';
import { ParticleSystem } from './particle';
import { circleCollision, Vec2 } from './utils';
import { getRandomElement, PRIMARY_COLORS } from './color';

class EnemySpawner {
    private spawnInterval = 120; // frames
    private spawnTimer = 0;
    private maxEnemies = 20;

    constructor(private canvasWidth: number, private canvasHeight: number) {}

    update(currentEnemyCount: number, createEnemy: (enemy: Enemy) => void) {
        this.spawnTimer--;
        if (this.spawnTimer <= 0 && currentEnemyCount < this.maxEnemies) {
            this.spawnEnemy(createEnemy);
            this.spawnTimer = this.spawnInterval;
            
            if (this.spawnInterval > 30) {
                this.spawnInterval *= 0.995;
            }
        }
    }

    private spawnEnemy(createEnemy: (enemy: Enemy) => void) {
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

        const color = getRandomElement(PRIMARY_COLORS);
        const radius = 15;
        const health = 30;
        const speed = 1.5;
        const points = 10;
        const newEnemy = new Enemy(x, y, color, radius, health, speed, points);
        createEnemy(newEnemy);
    }
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private particles: ParticleSystem;
    private enemySpawner: EnemySpawner;
    private ui: UI;
    private inputHandler: InputHandler;

    private score = 0;
    public isRunning = false;
    private animationFrameId: number | null = null;
    
    private onGameOver: (finalScore: number) => void;

    constructor(
        canvas: HTMLCanvasElement, 
        onGameOver: (finalScore: number) => void,
        inputHandler: InputHandler
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onGameOver = onGameOver;
        this.inputHandler = inputHandler;

        this.player = new Player(canvas.width / 2, canvas.height / 2);
        this.enemySpawner = new EnemySpawner(canvas.width, canvas.height);
        this.ui = new UI(canvas);
        this.particles = new ParticleSystem();
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.gameLoop();
    }

    public stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    private createBullet = (bullet: Bullet) => {
        this.bullets.push(bullet);
    }
    
    private createEnemy = (enemy: Enemy) => {
        enemy.onSplit = this.createEnemy; // Assign the callback here
        this.enemies.push(enemy);
    }

    private update() {
        // 1. Update player, bullets, and enemies
        this.player.update(this.inputHandler, this.createBullet, this.canvas.width, this.canvas.height);
        this.inputHandler.resetScroll();
        
        this.bullets.forEach(bullet => bullet.update());
        this.enemies.forEach(enemy => enemy.update(this.player));

        // 2. Handle collisions
        this.handleCollisions();
        
        // 3. Update particle effects
        this.particles.update();

        // 4. Remove dead entities and out-of-bounds bullets
        this.cleanupEntities();

        // 5. Spawn new enemies
        this.enemySpawner.update(this.enemies.length, this.createEnemy);
        
        // 6. Check for game over condition
        if (!this.player.isAlive) {
            this.isRunning = false;
            this.onGameOver(this.score);
        }
    }

    private handleCollisions() {
        // Bullet-Enemy Collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let bulletRemoved = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (enemy.isAlive && circleCollision(bullet, enemy)) {
                    this.particles.add(bullet.pos, bullet.color, 10);
                    
                    const hitSuccess = enemy.takeDamage(bullet.damage, bullet.color);
                    
                    if (hitSuccess && !enemy.isAlive) {
                        this.score += enemy.points;
                    }
                    
                    // Always remove bullet on hit
                    this.bullets.splice(i, 1);
                    bulletRemoved = true;
                    break; 
                }
            }
            if (bulletRemoved) continue;
        }

        // Player-Enemy Collisions
        for (const enemy of this.enemies) {
            if (enemy.isAlive && circleCollision(this.player, enemy)) {
                this.player.takeDamage(enemy.damage); // Use enemy's damage property
                enemy.isAlive = false; 
                this.particles.add(enemy.pos, enemy.color, 10);
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
         // Create particles for dead enemies before removing them
        const deadEnemies = this.enemies.filter(e => !e.isAlive);
        deadEnemies.forEach(enemy => this.particles.add(enemy.pos, enemy.color, 30));

        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.isAlive);
        
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
        this.enemies.forEach(e => e.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.player.draw(this.ctx, this.inputHandler);
        
        this.ui.draw(this.player, this.score);
    }

    private gameLoop = () => {
        if (!this.isRunning) {
             this.draw();
        } else {
            this.update();
            this.draw();
        }
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
}
