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

    private lifespan = 480;
    private attractRadius = 100;
    private attractSpeed = 0.08;
    private canAttract = false;
    private attractDelay = 30;

    private angle = Math.random() * Math.PI * 2;
    private rotationSpeed = (Math.random() - 0.5) * 0.1;


    constructor(x: number, y: number, color: GameColor | null) {
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
    }

    update(player: Player, particles: ParticleSystem) {
        if (!this.isAlive) return;

        this.lifespan--;
        this.attractDelay--;
        this.angle += this.rotationSpeed;

        if (this.attractDelay <= 0) {
            this.canAttract = true;
        }

        if (this.lifespan <= 0) {
            this.isAlive = false;
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

        const pulse = (Math.sin(this.lifespan / 20) + 1) / 2;


        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 10 + pulse * 10;


        if (this.lifespan < 120) {
            const flash = Math.abs(Math.sin(this.lifespan * 0.1));
            ctx.globalAlpha = flash;
        } else {
            ctx.globalAlpha = 1;
        }

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