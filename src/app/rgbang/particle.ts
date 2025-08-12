
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


class LightningParticle implements IParticle {
    pos: Vec2;
    vel: Vec2; // Not used, but needed for interface
    lifespan: number;
    radius: number; // Not used
    private endPos: Vec2;

    constructor(startPos: Vec2, endPos: Vec2) {
        this.pos = startPos;
        this.endPos = endPos;
        this.lifespan = 20; // Short-lived effect
        this.vel = new Vec2(0, 0);
        this.radius = 0;
    }

    update() {
        this.lifespan--;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.lifespan / 20);
        ctx.strokeStyle = '#ffff66'; // Yellow
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

    constructor(pos: Vec2, color: string) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.5 + 0.2;
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 50 + 40;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = color;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        this.lifespan--;
    }

    draw(ctx: CanvasRenderingContext2D) {
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

    constructor(pos: Vec2, color: string) {
        this.pos = new Vec2(pos.x, pos.y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2; // Faster burst
        this.vel = new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.maxLifespan = this.lifespan = Math.random() * 30 + 20; // Shorter lifespan
        this.radius = Math.random() * 2 + 1;
        this.color = color;
    }
    
    update() {
        this.pos = this.pos.add(this.vel);
        this.vel = this.vel.scale(0.95); // More friction
        this.lifespan--;
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

    addFragmentParticle(pos: Vec2, color: string) {
        if (Math.random() > 0.7) { // Don't add every frame
             this.particles.push(new FragmentParticle(pos, color));
        }
    }
    
    addPickupEffect(pos: Vec2, color: GameColor | null) {
        const hexColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
        for (let i = 0; i < 20; i++) {
            this.particles.push(new PickupParticle(pos, hexColor));
        }
    }
    
    addLightning(startPos: Vec2, endPos: Vec2) {
        this.particles.push(new LightningParticle(startPos, endPos));
    }
}
