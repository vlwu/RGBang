import { Vec2 } from './utils';

export class Prism {
    pos: Vec2;
    radius = 8; // half the player's size (player radius is 15)
    isAlive = true;
    private angle = 0;
    private creationTime = Date.now();

    constructor(x: number, y: number) {
        this.pos = new Vec2(x, y);
    }

    update() {
        // Spin the prism
        this.angle += 0.05;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isAlive) return;
        
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        // Pulsing glow effect
        const pulse = (Math.sin(this.angle * 5) + 1) / 2; // Sync pulse with rotation
        const glowRadius = 15 + pulse * 5;
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        const time = (Date.now() - this.creationTime) / 1000;
        const r = Math.round(127 * Math.sin(time) + 128);
        const g = Math.round(127 * Math.sin(time + (2 * Math.PI / 3)) + 128);
        const b = Math.round(127 * Math.sin(time + (4 * Math.PI / 3)) + 128);
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
        gradient.addColorStop(0.7, `rgba(${g}, ${b}, ${r}, 0.5)`);
        gradient.addColorStop(1, `rgba(${b}, ${r}, ${g}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the prism shape (e.g., a hexagon)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const x = this.radius * Math.cos(i * Math.PI / 3);
            const y = this.radius * Math.sin(i * Math.PI / 3);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
