import { Vec2, lerp } from './utils';
import { GameColor, COLOR_DETAILS } from './color';
import { Player } from './player';
import { ParticleSystem } from './particle';

export class PrismFragment {
    pos: Vec2;
    radius = 8;
    isAlive = true;
    color: GameColor | null;
    hexColor: string;

    // Removed lifespan and related properties
    private attractRadius = 100;
    private attractSpeed = 0.08;
    private canAttract = false;
    private initialDelay = 30; // Renamed attractDelay to initialDelay for clarity

    private angle = Math.random() * Math.PI * 2;
    private rotationSpeed = (Math.random() - 0.5) * 0.1;


    constructor(x: number, y: number, color: GameColor | null) {
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
    }

    update(player: Player, particles: ParticleSystem) {
        if (!this.isAlive) return;

        // Removed lifespan decrement
        this.initialDelay--; // Decrement initial delay

        this.angle += this.rotationSpeed;

        if (this.initialDelay <= 0) { // Check initial delay
            this.canAttract = true;
        }

        // Removed lifespan check for isAlive = false


        if (this.canAttract) {
            const distVec = player.pos.sub(this.pos);
            const dist = distVec.magnitude();
            if (dist < this.attractRadius) {
                this.pos.x = lerp(this.pos.x, player.pos.x, this.attractSpeed);
                this.pos.y = lerp(this.pos.y, player.pos.y, this.attractSpeed);
            }
        }

        particles.addFragmentParticle(this.pos, this.hexColor);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isAlive) return;

        ctx.save();

        const pulse = (Math.sin(Date.now() / 200) + 1) / 2; // Keep a visual pulse


        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 10 + pulse * 10;

        // Removed lifespan-based alpha fading
        ctx.globalAlpha = 1;


        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);


        ctx.fillStyle = this.hexColor;
        ctx.beginPath();
        const points = 5;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? this.radius : this.radius / 2;
            const a = (i / (points * 2)) * (Math.PI * 2);
            const x = r * Math.sin(a);
            const y = r * Math.cos(a);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}