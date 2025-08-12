
import { Vec2 } from './utils';
import { GameColor, COLOR_DETAILS } from './color';

interface IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
}


class Particle implements IParticle {
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
        ctx.globalAlpha = Math.max(0, this.lifespan / 60);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class DashParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    private color: string = '#FF0000';

    constructor(pos: Vec2) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 40 + 20; // smaller lifespan
        this.radius = Math.random() * 2 + 1;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        this.lifespan--;
        
        // Color cycling logic
        const lifeRatio = this.lifespan / this.maxLifespan;
        const hue = (1 - lifeRatio) * 360;
        this.color = `hsl(${hue}, 100%, 50%)`;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.lifespan / this.maxLifespan);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}


export class ParticleSystem {
    particles: IParticle[] = [];

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
    
    addDashParticle(pos: Vec2) {
        this.particles.push(new DashParticle(pos));
    }
}
