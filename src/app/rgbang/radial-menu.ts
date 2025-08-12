
import { Vec2, drawShapeForColor } from "./utils";
import { GameColor, COLOR_DETAILS, SECONDARY_COLORS } from "./color";

export class RadialMenu {
    public active = false;
    private center: Vec2 = new Vec2();
    private radius = 80;
    private segments: GameColor[] = SECONDARY_COLORS;
    private segmentAngle = (Math.PI * 2) / this.segments.length;
    private highlightedSegment: number | null = null;
    
    update(playerPos: Vec2, mousePos: Vec2) {
        if (!this.active) return;
        this.center = playerPos;
        
        const relativeMousePos = mousePos.sub(this.center);
        const dist = relativeMousePos.magnitude();

        if (dist > 20) { // Dead zone in the center
            let angle = Math.atan2(relativeMousePos.y, relativeMousePos.x);
            if (angle < 0) {
                angle += Math.PI * 2;
            }
            
            // Offset the angle so the first segment starts at the top
            const correctedAngle = angle + this.segmentAngle / 2 + Math.PI / 2;
            this.highlightedSegment = Math.floor(correctedAngle / this.segmentAngle) % this.segments.length;

        } else {
            this.highlightedSegment = null;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = 0.7;

        this.segments.forEach((color, i) => {
            const startAngle = i * this.segmentAngle - Math.PI / 2 - this.segmentAngle/2;
            const endAngle = (i + 1) * this.segmentAngle - Math.PI/2 - this.segmentAngle/2;
            
            ctx.beginPath();
            ctx.moveTo(this.center.x, this.center.y);
            ctx.arc(this.center.x, this.center.y, this.radius, startAngle, endAngle);
            ctx.closePath();

            if (i === this.highlightedSegment) {
                ctx.fillStyle = COLOR_DETAILS[color].hex;
                ctx.shadowColor = COLOR_DETAILS[color].hex;
                ctx.shadowBlur = 20;
            } else {
                ctx.fillStyle = '#4A5568';
                 ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }
            ctx.fill();
            
             // Draw shape inside the segment
            const angle = i * this.segmentAngle - Math.PI / 2;
            const shapePos = new Vec2(
                this.center.x + Math.cos(angle) * this.radius * 0.6,
                this.center.y + Math.sin(angle) * this.radius * 0.6
            );
            drawShapeForColor(ctx, shapePos, 30, color, 'white');

        });
        
        ctx.restore();
    }
    
    getSelectedColor(): GameColor | null {
        if (this.highlightedSegment !== null) {
            return this.segments[this.highlightedSegment];
        }
        return null;
    }

    close() {
        this.active = false;
        this.highlightedSegment = null;
    }
}
