import { Player } from './player';
import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { WaveManager } from './wave-manager';
import { UI } from './ui';
import InputHandler from './input-handler';
import { ParticleSystem } from './particle';
import { circleCollision } from './utils';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private particles: ParticleSystem;
    private waveManager: WaveManager;
    private ui: UI;
    private inputHandler: InputHandler;

    private score = 0;
    public isRunning = false;
    private animationFrameId: number | null = null;
    
    private onGameOver: () => void;
    private setScore: (score: number) => void;
    private setWave: (wave: number) => void;

    constructor(
        canvas: HTMLCanvasElement, 
        onGameOver: () => void,
        setScore: (score: number) => void,
        setWave: (wave: number) => void,
        inputHandler: InputHandler
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onGameOver = onGameOver;
        this.setScore = setScore;
        this.setWave = setWave;
        this.inputHandler = inputHandler;

        this.player = new Player(canvas.width / 2, canvas.height / 2);
        this.waveManager = new WaveManager(canvas.width, canvas.height);
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
        
        this.bullets = this.bullets.filter((bullet) => {
            bullet.update();
            return !(bullet.pos.x < 0 || bullet.pos.x > this.canvas.width || bullet.pos.y < 0 || bullet.pos.y > this.canvas.height);
        });

        this.enemies.forEach((enemy) => {
            enemy.update(this.player);
            if (circleCollision({pos: this.player.pos, radius: this.player.radius}, {pos: enemy.pos, radius: enemy.radius})) {
                this.player.takeDamage(10);
                enemy.isAlive = false;
                this.particles.add(enemy.pos, enemy.color, 10);
            }
        });

        this.handleCollisions();
        
        this.enemies = this.enemies.filter(e => e.isAlive);

        this.waveManager.update(this.enemies, this.createEnemy);
        this.setWave(this.waveManager.currentWave);
        
        this.particles.update();
        
        if (this.player.health <= 0) {
            this.isRunning = false;
            this.onGameOver();
        }
    }

    private handleCollisions() {
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
    
    private draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0A020F';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.player.draw(this.ctx, this.inputHandler);
        this.bullets.forEach(b => b.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.particles.draw(this.ctx);
        
        this.ui.draw(this.player, this.score, this.waveManager.currentWave);

        // This is a bit of a hack to get the timer from wavemanager, should be refactored
        // @ts-ignore
        const waveTimer = this.waveManager.waveTimer;
        if (this.enemies.length === 0 && waveTimer > 0) {
            // @ts-ignore
            const maxTime = this.waveManager.timeBetweenWaves;
            this.ui.drawWaveAnnouncement(this.waveManager.currentWave + 1, waveTimer, maxTime);
        }
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
