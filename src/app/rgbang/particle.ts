import { Vec2 } from './utils';
import { GameColor, COLOR_DETAILS } from './color';
import { ObjectPool } from './utils';

interface IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    isActive: boolean;
    update(): void;
    draw(ctx: CanvasRenderingContext2D): void;
    reset(...args: any[]): void;
}


class Particle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    color: string;
    public isActive: boolean = true;

    constructor(pos: Vec2, color: GameColor) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.lifespan = Math.random() * 60 + 30;
        this.radius = Math.random() * 3 + 2;
        this.color = COLOR_DETAILS[color].hex;
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
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        this.pos.addInPlace(this.vel);
        this.vel.scaleInPlace(0.97);
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.lifespan / 60);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}


class LightningParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    radius: number;
    private endPos: Vec2;
    public isActive: boolean = true;

    constructor(startPos: Vec2, endPos: Vec2) {
        this.pos = startPos;
        this.endPos = endPos;
        this.lifespan = 20;
        this.vel = new Vec2(0, 0);
        this.radius = 0;
    }

    reset(startPos: Vec2, endPos: Vec2) {
        this.pos = startPos;
        this.endPos = endPos;
        this.lifespan = 20;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;
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
}


class FragmentParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    color: string;
    public isActive: boolean = true;

    constructor(pos: Vec2, color: string) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.5 + 0.2;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 50 + 40;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = color;
    }

    reset(pos: Vec2, color: string) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.5 + 0.2;
        this.vel.x = Math.cos(angle) * speed;
        this.vel.y = Math.sin(angle) * speed;
        this.maxLifespan = this.lifespan = Math.random() * 50 + 40;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = color;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        this.pos.addInPlace(this.vel);
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;
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
}

class PickupParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    color: string;
    public isActive: boolean = true;

    constructor(pos: Vec2, color: string) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 30 + 20;
        this.radius = Math.random() * 2 + 1;
        this.color = color;
    }

    reset(pos: Vec2, color: string) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vel.x = Math.cos(angle) * speed;
        this.vel.y = Math.sin(angle) * speed;
        this.maxLifespan = this.lifespan = Math.random() * 30 + 20;
        this.radius = Math.random() * 2 + 1;
        this.color = color;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        this.pos.addInPlace(this.vel);
        this.vel.scaleInPlace(0.95);
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;
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


class DashParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    private color: string = '#FF0000';
    public isActive: boolean = true;

    constructor(pos: Vec2) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 40 + 20;
        this.radius = Math.random() * 2 + 1;
    }

    reset(pos: Vec2) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vel.x = Math.cos(angle) * speed;
        this.vel.y = Math.sin(angle) * speed;
        this.maxLifespan = this.lifespan = Math.random() * 40 + 20;
        this.radius = Math.random() * 2 + 1;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        this.pos.addInPlace(this.vel);
        this.lifespan--;


        const lifeRatio = this.lifespan / this.maxLifespan;
        const hue = (1 - lifeRatio) * 360;
        this.color = `hsl(${hue}, 100%, 50%)`;

        if (this.lifespan <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;
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

class ExplosionRippleParticle implements IParticle {
    pos: Vec2;
    vel: Vec2;
    lifespan: number;
    maxLifespan: number;
    radius: number;
    private maxRadius: number;
    private color: string = '#FF0000';
    public isActive: boolean = true;

    constructor(pos: Vec2, maxRadius: number) {
        this.pos = new Vec2(pos.x, pos.y);
        this.vel = new Vec2(0, 0);
        this.maxLifespan = this.lifespan = 45;
        this.radius = 0;
        this.maxRadius = maxRadius;
    }

    reset(pos: Vec2, maxRadius: number) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.maxLifespan = this.lifespan = 45;
        this.radius = 0;
        this.maxRadius = maxRadius;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;
        this.lifespan--;

        const lifeRatio = this.lifespan / this.maxLifespan;
        const hue = (1 - lifeRatio) * 360;
        this.color = `hsl(${hue}, 100%, 70%)`;
        this.radius = this.maxRadius * (1 - lifeRatio);

        if (this.lifespan <= 0) {
            this.isActive = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;
        const progress = 1 - (this.lifespan / this.maxLifespan);
        const alpha = (1 - progress) * 0.9;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 - (progress * 3);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}


export class ParticleSystem {
    particles: IParticle[] = [];
    private readonly MAX_PARTICLES = 500;

    private particlePool: ObjectPool<Particle>;
    private dashParticlePool: ObjectPool<DashParticle>;
    private fragmentParticlePool: ObjectPool<FragmentParticle>;
    private pickupParticlePool: ObjectPool<PickupParticle>;
    private lightningParticlePool: ObjectPool<LightningParticle>;
    private explosionRippleParticlePool: ObjectPool<ExplosionRippleParticle>;

    constructor() {
        this.particlePool = new ObjectPool<Particle>(() => new Particle(new Vec2(), GameColor.RED), 200);
        this.dashParticlePool = new ObjectPool<DashParticle>(() => new DashParticle(new Vec2()), 50);
        this.fragmentParticlePool = new ObjectPool<FragmentParticle>(() => new FragmentParticle(new Vec2(), '#FFFFFF'), 100);
        this.pickupParticlePool = new ObjectPool<PickupParticle>(() => new PickupParticle(new Vec2(), '#FFFFFF'), 50);
        this.lightningParticlePool = new ObjectPool<LightningParticle>(() => new LightningParticle(new Vec2(), new Vec2()), 20);
        this.explosionRippleParticlePool = new ObjectPool<ExplosionRippleParticle>(() => new ExplosionRippleParticle(new Vec2(), 70), 10);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (!p.isActive) {
                this.particles.splice(i, 1);
                if (p instanceof Particle) this.particlePool.release(p);
                else if (p instanceof DashParticle) this.dashParticlePool.release(p);
                else if (p instanceof FragmentParticle) this.fragmentParticlePool.release(p);
                else if (p instanceof PickupParticle) this.pickupParticlePool.release(p);
                else if (p instanceof LightningParticle) this.lightningParticlePool.release(p);
                else if (p instanceof ExplosionRippleParticle) this.explosionRippleParticlePool.release(p);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.draw(ctx));
    }

    add(pos: Vec2, color: GameColor, count: number) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.MAX_PARTICLES) return;
            const particle = this.particlePool.get(pos, color);
            this.particles.push(particle);
        }
    }

    addDashParticle(pos: Vec2) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        const p = this.dashParticlePool.get(pos);
        this.particles.push(p);
    }

    addFragmentParticle(pos: Vec2, color: string) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        if (Math.random() > 0.7) {
            const p = this.fragmentParticlePool.get(pos, color);
             this.particles.push(p);
        }
    }

    addPickupEffect(pos: Vec2, color: GameColor | null) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        const hexColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
        for (let i = 0; i < 20; i++) {
            if (this.particles.length >= this.MAX_PARTICLES) return;
            const p = this.pickupParticlePool.get(pos, hexColor);
            this.particles.push(p);
        }
    }

    addLightning(startPos: Vec2, endPos: Vec2) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        const p = this.lightningParticlePool.get(startPos, endPos);
        this.particles.push(p);
    }

    addExplosionRipple(pos: Vec2, radius: number) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        const p = this.explosionRippleParticlePool.get(pos, radius);
        this.particles.push(p);
    }
}