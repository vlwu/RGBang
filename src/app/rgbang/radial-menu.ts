
import { Vec2, drawShapeForColor } from "./utils";
import { GameColor, COLOR_DETAILS, SECONDARY_COLORS } from "./color";

export class RadialMenu {
    public active = false;
    private center: Vec2 = new Vec2();
    private radius = 80;
    private segments: GameColor[] = SECONDARY_COLORS;
    private segmentAngle = (Math.PI * 2) / this.segments.length;
    private highlightedSegment: number | null = null;
    private availableColors: Set<GameColor> = new Set();
    
    update(playerPos: Vec2, mousePos: Vec2, availableColors: Set<GameColor>) {
        if (!this.active) return;
        this.center = playerPos;
        this.availableColors = availableColors;
        
        const relativeMousePos = mousePos.sub(this.center);
        const dist = relativeMousePos.magnitude();

        if (dist > 20) { // Dead zone in the center
            let angle = Math.atan2(relativeMousePos.y, relativeMousePos.x);
            if (angle < 0) {
                angle += Math.PI * 2;
            }
            
            // Offset the angle so the first segment starts at the top
            const correctedAngle = angle + this.segmentAngle / 2 + Math.PI / 2;
            const segmentIndex = Math.floor(correctedAngle / this.segmentAngle) % this.segments.length;

            if (this.availableColors.has(this.segments[segmentIndex])) {
                 this.highlightedSegment = segmentIndex;
            } else {
                this.highlightedSegment = null;
            }

        } else {
            this.highlightedSegment = null;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = 0.8;

        this.segments.forEach((color, i) => {
            const startAngle = i * this.segmentAngle - Math.PI / 2 - this.segmentAngle/2;
            const endAngle = (i + 1) * this.segmentAngle - Math.PI/2 - this.segmentAngle/2;
            const isAvailable = this.availableColors.has(color);
            
            ctx.beginPath();
            ctx.moveTo(this.center.x, this.center.y);
            ctx.arc(this.center.x, this.center.y, this.radius, startAngle, endAngle);
            ctx.closePath();

            if (i === this.highlightedSegment && isAvailable) {
                ctx.fillStyle = COLOR_DETAILS[color].hex;
                ctx.shadowColor = COLOR_DETAILS[color].hex;
                ctx.shadowBlur = 20;
            } else {
                ctx.fillStyle = isAvailable ? '#4A5568' : '#2D3748'; // Darker for unavailable
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
            drawShapeForColor(ctx, shapePos, 30, color, isAvailable ? 'white' : '#718096');

        });
        
        ctx.restore();
    }
    
    getSelectedColor(): GameColor | null {
        if (this.highlightedSegment !== null) {
            const selected = this.segments[this.highlightedSegment];
            if (this.availableColors.has(selected)) {
                return selected;
            }
        }
        return null;
    }
    
    open() {
        this.active = true;
    }

    close() {
        this.active = false;
        this.highlightedSegment = null;
    }
}
