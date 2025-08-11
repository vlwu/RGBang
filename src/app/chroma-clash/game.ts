import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy, BaseEnemy } from './enemy';
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
            
            // Gradually decrease spawn interval to increase difficulty
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
        createEnemy(new BaseEnemy(x, y, color));
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
    
    private onGameOver: () => void;
    private setScore: (score: number) => void;

    constructor(
        canvas: HTMLCanvasElement, 
        onGameOver: () => void,
        setScore: (score: number) => void,
        inputHandler: InputHandler
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onGameOver = onGameOver;
        this.setScore = setScore;
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
        this.enemies.push(enemy);
    }

    private update() {
        this.player.update(this.inputHandler, this.createBullet, this.canvas.width, this.canvas.height);
        this.inputHandler.resetScroll();
        
        this.bullets = this.bullets.filter((bullet) => {
            bullet.update();
            return !(bullet.pos.x < 0 || bullet.pos.x > this.canvas.width || bullet.pos.y < 0 || bullet.pos.y > this.canvas.height);
        });

        this.enemies.forEach((enemy) => {
            enemy.update(this.player);
            if (enemy.isAlive && circleCollision({pos: this.player.pos, radius: this.player.radius}, {pos: enemy.pos, radius: enemy.radius})) {
                this.player.takeDamage(10);
                enemy.isAlive = false;
                this.particles.add(enemy.pos, enemy.color, 10);
            }
        });

        this.handleBulletCollisions();
        this.handleEnemyCollisions();
        
        this.enemies = this.enemies.filter(e => e.isAlive);

        this.enemySpawner.update(this.enemies.length, this.createEnemy);
        
        this.particles.update();
        
        if (this.player.health <= 0) {
            this.isRunning = false;
            this.onGameOver();
        }
    }

    private handleBulletCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const bullet = this.bullets[i];
                const enemy = this.enemies[j];
                
                if (bullet && enemy && enemy.isAlive && circleCollision({pos: bullet.pos, radius: bullet.radius}, {pos: enemy.pos, radius: enemy.radius})) {
                    const pointsGained = enemy.takeDamage(bullet.damage, bullet.color, this.particles);
                    if (pointsGained > 0) {
                        this.score += pointsGained;
                        this.setScore(this.score);
                    }
                    
                    this.particles.add(bullet.pos, bullet.color, 10);
                    this.bullets.splice(i, 1);
                    break; 
                }
            }
        }
    }

    private handleEnemyCollisions() {
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];

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
            enemy1.pos = enemy1.pos.add(resolveVec);
            enemy2.pos = enemy2.pos.sub(resolveVec);
        }
    }
    
    private draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0A020F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.player.draw(this.ctx, this.inputHandler);
        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.particles.draw(this.ctx);
        
        this.ui.draw(this.player, this.score);
    }

    private gameLoop = () => {
        if (!this.isRunning) {
             // Still draw the last frame when paused
             this.draw();
        } else {
            this.update();
            this.draw();
        }
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
}
