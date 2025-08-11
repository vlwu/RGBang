import { Vec2 } from './utils';
import { GameColor, COLOR_DETAILS } from './color';

export class Bullet {
    pos: Vec2;
    vel: Vec2;
    radius = 5;
    color: GameColor;
    hexColor: string;
    damage = 10;
    isFromBoss: boolean;
    
    constructor(pos: Vec2, direction: Vec2, color: GameColor, isFromBoss = false) {
        this.pos = new Vec2(pos.x, pos.y);
        this.vel = direction.normalize().scale(isFromBoss ? 4 : 10);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.isFromBoss = isFromBoss;
        if(isFromBoss) this.radius = 8;
    }

    update() {
        this.pos = this.pos.add(this.vel);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.fillStyle = this.hexColor;
        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
