import { Vec2 } from './utils';
import { Bullet } from './bullet';
import InputHandler from './input-handler';
import { GameColor, mixColors, COLOR_DETAILS, PRIMARY_COLORS } from './color';

export class Player {
    pos: Vec2;
    radius = 15;
    speed = 4;
    maxHealth = 100;
    health: number;
    
    primaryColor: GameColor = GameColor.RED;
    secondaryColor: GameColor | null = null;
    
    private shootCooldown = 10; // frames
    private shootTimer = 0;

    constructor(x: number, y: number) {
        this.pos = new Vec2(x, y);
        this.health = this.maxHealth;
    }
    
    get currentColor(): GameColor {
        if (this.secondaryColor) {
            const mixed = mixColors(this.primaryColor, this.secondaryColor);
            if (mixed) return mixed;
        }
        return this.primaryColor;
    }

    update(input: InputHandler, createBullet: (bullet: Bullet) => void, canvasWidth: number, canvasHeight: number) {
        this.handleMovement(input, canvasWidth, canvasHeight);
        this.handleColorSelection(input);
        this.handleShooting(input, createBullet);
        
        if (this.shootTimer > 0) {
            this.shootTimer--;
        }
    }

    private handleMovement(input: InputHandler, canvasWidth: number, canvasHeight: number) {
        let moveDir = new Vec2(0, 0);
        if (input.isKeyDown('w')) moveDir.y -= 1;
        if (input.isKeyDown('s')) moveDir.y += 1;
        if (input.isKeyDown('a')) moveDir.x -= 1;
        if (input.isKeyDown('d')) moveDir.x += 1;

        if (moveDir.magnitude() > 0) {
            this.pos = this.pos.add(moveDir.normalize().scale(this.speed));
        }

        // Boundary checks
        this.pos.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.pos.y));
    }
    
    private handleColorSelection(input: InputHandler) {
        if (input.isKeyDown('1')) this.primaryColor = GameColor.RED;
        if (input.isKeyDown('2')) this.primaryColor = GameColor.YELLOW;
        if (input.isKeyDown('3')) this.primaryColor = GameColor.BLUE;

        if (input.isKeyDown('shift')) {
            if (input.isKeyDown('1') && GameColor.RED !== this.primaryColor) this.secondaryColor = GameColor.RED;
            else if (input.isKeyDown('2') && GameColor.YELLOW !== this.primaryColor) this.secondaryColor = GameColor.YELLOW;
            else if (input.isKeyDown('3') && GameColor.BLUE !== this.primaryColor) this.secondaryColor = GameColor.BLUE;
            else this.secondaryColor = null;
        } else {
            this.secondaryColor = null;
        }
    }

    private handleShooting(input: InputHandler, createBullet: (bullet: Bullet) => void) {
        if (input.isMouseDown && this.shootTimer === 0) {
            const direction = input.mousePos.sub(this.pos);
            const bullet = new Bullet(this.pos, direction, this.currentColor);
            createBullet(bullet);
            this.shootTimer = this.shootCooldown;
        }
    }

    draw(ctx: CanvasRenderingContext2D, input: InputHandler) {
        // Draw player body
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw aiming reticle
        const aimDir = input.mousePos.sub(this.pos).normalize();
        const reticlePos = this.pos.add(aimDir.scale(this.radius + 5));
        ctx.strokeStyle = COLOR_DETAILS[this.currentColor].hex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(reticlePos.x - 5, reticlePos.y);
        ctx.lineTo(reticlePos.x + 5, reticlePos.y);
        ctx.moveTo(reticlePos.x, reticlePos.y - 5);
        ctx.lineTo(reticlePos.x, reticlePos.y + 5);
        ctx.stroke();
    }
    
    takeDamage(amount: number) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
}
