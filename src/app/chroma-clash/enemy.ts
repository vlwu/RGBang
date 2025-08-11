
import { Vec2 } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color';
import { Player } from './player';

export class Enemy {
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

    update(player: Player) {
        const direction = player.pos.sub(this.pos).normalize();
        this.pos = this.pos.add(direction.scale(this.speed));
    }

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
            
            const healthPercentage = this.health / this.maxHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        }
    }
    
    takeDamage(amount: number, damageColor: GameColor): boolean {
        if (damageColor !== this.color) {
            return false;
        }

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
        return true;
    }
}
