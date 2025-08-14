// src/app/rgbang/particle.ts
import { Vec2 } from './utils';
import { GameColor, COLOR_DETAILS } from './color';

interface IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void; // FIXED: Typo here
    isAlive(): boolean;
    reset?(pos: Vec2, color: GameColor): void;
}


class Particle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    color: string;
    private active: boolean = true;

    constructor(pos: Vec2, color: GameColor) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.lifespan = Math.random() * 60 + 30;
        this.radius = Math.random() * 3 + 2;
        this.color = COLOR_DETAILS[color].hex;
        this.active = true;
    }

    reset(pos: Vec2, color: GameColor) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vel.x = Math.cos(angle) * speed;
        this.vel.y = Math.sin(angle) * speed;
        this.lifespan = Math.random() * 60 + 30;
        this.radius = Math.random() * 3 + 2;
        this.color = COLOR_DETAILS[color].hex;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.scale(0.97);
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.lifespan / 60);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isAlive(): boolean {
        return this.active;
    }
}


class LightningParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    private endPos: Vec2;
    private active: boolean = true;

    constructor(startPos: Vec2, endPos: Vec2) {
        this.pos = startPos;
        this.endPos = endPos;
        this.lifespan = 20;
        this.vel = new Vec2(0, 0);
        this.radius = 0;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.lifespan / 20);
        ctx.strokeStyle = '#ffff66';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffff66';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.endPos.x, this.endPos.y);
        ctx.stroke();

        ctx.restore();
    }

    isAlive(): boolean {
        return this.active;
    }
}


class FragmentParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    color: string;
    private active: boolean = true;

    constructor(pos: Vec2, color: string) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.5 + 0.2;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 50 + 40;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = color;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.pos = this.pos.add(this.vel);
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, (this.lifespan / this.maxLifespan) * 0.7);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isAlive(): boolean {
        return this.active;
    }
}

class PickupParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    color: string;
    private active: boolean = true;

    constructor(pos: Vec2, color: string) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 30 + 20;
        this.radius = Math.random() * 2 + 1;
        this.color = color;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.scale(0.95);
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
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

    isAlive(): boolean {
        return this.active;
    }
}


class DashParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    private color: string = '#FF0000';
    private active: boolean = true;

    constructor(pos: Vec2) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 40 + 20;
        this.radius = Math.random() * 2 + 1;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.pos = this.pos.add(this.vel);
        this.lifespan--;


        const lifeRatio = this.lifespan / this.maxLifespan;
        const hue = (1 - lifeRatio) * 360;
        this.color = `hsl(${hue}, 100%, 50%)`;

        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
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

    isAlive(): boolean {
        return this.active;
    }
}


export class ParticleSystem {
    particles: IParticle[] = [];
    private particlePool: Particle[] = [];
    private readonly MAX_PARTICLES = 500;
    private readonly POOL_SIZE = 200;

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].isAlive()) {
                const p = this.particles.splice(i, 1)[0];
                if (p instanceof Particle && this.particlePool.length < this.POOL_SIZE) {
                    this.particlePool.push(p);
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.draw(ctx));
    }

    add(pos: Vec2, color: GameColor, count: number) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.MAX_PARTICLES) return;

            let particle: Particle;
            if (this.particlePool.length > 0) {
                particle = this.particlePool.pop()!;
                particle.reset(pos, color);
            } else {
                particle = new Particle(pos, color);
            }
            this.particles.push(particle);
        }
    }

    addDashParticle(pos: Vec2) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        this.particles.push(new DashParticle(pos));
    }

    addFragmentParticle(pos: Vec2, color: string) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        if (Math.random() > 0.7) {
             this.particles.push(new FragmentParticle(pos, color));
        }
    }

    addPickupEffect(pos: Vec2, color: GameColor | null) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        const hexColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
        for (let i = 0; i < 20; i++) {
            this.particles.push(new PickupParticle(pos, hexColor));
        }
    }

    addLightning(startPos: Vec2, endPos: Vec2) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        this.particles.push(new LightningParticle(startPos, endPos));
    }
}