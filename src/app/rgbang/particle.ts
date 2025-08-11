import { Vec2 } from './utils';
import { GameColor, COLOR_DETAILS } from './color';

class Particle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    color: string;

    constructor(pos: Vec2, color: GameColor) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.lifespan = Math.random() * 60 + 30; // 0.5 to 1.5 seconds
        this.radius = Math.random() * 3 + 2;
        this.color = COLOR_DETAILS[color].hex;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.scale(0.97); // friction
        this.lifespan--;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.lifespan / 60;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleSystem {
    particles: Particle[] = [];

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].lifespan <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.draw(ctx));
    }

    add(pos: Vec2, color: GameColor, count: number) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(pos, color));
        }
    }
}
