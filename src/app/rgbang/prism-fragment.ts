import { Vec2, lerp } from './utils';
import { GameColor, COLOR_DETAILS } from './color';
import { Player } from './player';
import { ParticleSystem } from './particle';
import { FRAGMENT_CONFIG } from './gameConfig';

export class PrismFragment {
    pos: Vec2;
    radius = FRAGMENT_CONFIG.RADIUS;
    isAlive = true;
    color: GameColor | null;
    hexColor: string;

    private attractRadius = FRAGMENT_CONFIG.ATTRACT_RADIUS;
    private attractSpeed = FRAGMENT_CONFIG.ATTRACT_SPEED;
    private canAttract = false;
    private initialDelay = FRAGMENT_CONFIG.INITIAL_DELAY_FRAMES;

    private angle = Math.random() * Math.PI * 2;
    private rotationSpeed = (Math.random() - 0.5) * 0.1;

    private lifespan: number;
    private readonly maxLifespan = FRAGMENT_CONFIG.MAX_LIFESPAN_FRAMES;

    constructor(x: number, y: number, color: GameColor | null) {
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
        this.lifespan = this.maxLifespan;
    }

    update(player: Player, particles: ParticleSystem) {
        if (!this.isAlive) return;

        this.initialDelay--;
        this.angle += this.rotationSpeed;
        this.lifespan--;

        if (this.lifespan <= 0) {
            this.isAlive = false;
            return;
        }

        if (this.initialDelay <= 0) {
            this.canAttract = true;
        }

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

        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.globalAlpha = Math.max(0, this.lifespan / this.maxLifespan);

        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 10 + pulse * 10;

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