import { Vec2, distance, getRandomElement } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS } from './color';
import { Player } from './player';
import { ParticleSystem } from './particle';

export abstract class Enemy {
    pos: Vec2;
    radius: number;
    health: number;
    maxHealth: number;
    color: GameColor;
    hexColor: string;
    speed: number;
    points: number;
    isAlive = true;

    constructor(x: number, y: number, color: GameColor, radius: number, health: number, speed: number, points: number) {
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.radius = radius;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.points = points;
    }

    abstract update(player: Player, particles: ParticleSystem, createEnemy: (enemy: Enemy) => void): void;

    draw(ctx: CanvasRenderingContext2D) {
        // Body
        ctx.fillStyle = this.hexColor;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 5;
            const barX = this.pos.x - this.radius;
            const barY = this.pos.y - this.radius - 10;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = 'red';
            const healthPercentage = this.health / this.maxHealth;
            ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        }
    }
    
    takeDamage(amount: number, damageColor: GameColor, particles: ParticleSystem, createEnemy: (enemy: Enemy) => void): number {
        if (damageColor === this.color) {
            this.health -= amount;
            if (this.health <= 0) {
                this.isAlive = false;
                particles.add(this.pos, this.color, 30);
                return this.points;
            }
        } else {
            this.onWrongHit(particles, createEnemy, damageColor);
        }
        return 0;
    }
    
    abstract onWrongHit(particles: ParticleSystem, createEnemy: (enemy: Enemy) => void, damageColor: GameColor): void;
}

export class BaseEnemy extends Enemy {
    constructor(x: number, y: number, color?: GameColor) {
        const c = color || getRandomElement(PRIMARY_COLORS);
        super(x, y, c, 15, 30, 1.5, 10);
    }
    
    update(player: Player) {
        const direction = player.pos.sub(this.pos).normalize();
        this.pos = this.pos.add(direction.scale(this.speed));
    }
    
    onWrongHit(particles: ParticleSystem) {
        particles.add(this.pos, GameColor.RED, 5); // show a "resist" effect
        this.speed *= 1.1; // becomes faster
    }
}

export class SplitterEnemy extends Enemy {
    constructor(x: number, y: number) {
        const color = getRandomElement([GameColor.ORANGE, GameColor.PURPLE, GameColor.GREEN]);
        super(x, y, color, 25, 50, 1, 25);
    }
    
    update(player: Player) {
        const direction = player.pos.sub(this.pos).normalize();
        this.pos = this.pos.add(direction.scale(this.speed));
    }

    onWrongHit(particles: ParticleSystem, createEnemy: (enemy: Enemy) => void) {
        this.isAlive = false;
        particles.add(this.pos, this.color, 15);
        const components = COLOR_DETAILS[this.color].components;
        if (components) {
            createEnemy(new BaseEnemy(this.pos.x - 20, this.pos.y, components[0]));
            createEnemy(new BaseEnemy(this.pos.x + 20, this.pos.y, components[1]));
        }
    }
}
