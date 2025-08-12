
import { Vec2, lerp, drawShapeForColor } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color';
import { Bullet } from './bullet';

export class Boss {
    pos: Vec2;
    radius = 40;
    health: number;
    maxHealth = 1000;
    color: GameColor;
    isAlive = true;
    points = 0; // Boss no longer gives points
    damage = 30; // Collision damage

    private canvasWidth: number;
    private canvasHeight: number;

    // Timers for actions
    private colorChangeTimer = 0;
    private readonly colorChangeInterval = 300; // 5 seconds

    private moveTimer = 0;
    private readonly moveInterval = 240; // 4 seconds
    private targetPos: Vec2;
    private moveSpeed = 0.02;

    private attackTimer = 0;
    private readonly attackInterval = 120; // 2 seconds

    private createBullet: (bullet: Bullet) => void;

    constructor(
        x: number,
        y: number,
        createBullet: (bullet: Bullet) => void,
        canvasWidth: number,
        canvasHeight: number
    ) {
        this.pos = new Vec2(x, y);
        this.targetPos = new Vec2(x, y);
        this.health = this.maxHealth;
        this.color = getRandomElement(PRIMARY_COLORS);
        this.createBullet = createBullet;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    update() {
        if (!this.isAlive) return;

        this.updateTimers();
        this.handleActions();
        this.move();
    }
    
    private updateTimers() {
        this.colorChangeTimer--;
        this.moveTimer--;
        this.attackTimer--;
    }

    private handleActions() {
        if (this.colorChangeTimer <= 0) {
            this.changeColor();
            this.colorChangeTimer = this.colorChangeInterval;
        }
        if (this.moveTimer <= 0) {
            this.setNewTargetPosition();
            this.moveTimer = this.moveInterval;
        }
        if (this.attackTimer <= 0) {
            this.attack();
            this.attackTimer = this.attackInterval;
        }
    }
    
    private move() {
        this.pos.x = lerp(this.pos.x, this.targetPos.x, this.moveSpeed);
        this.pos.y = lerp(this.pos.y, this.targetPos.y, this.moveSpeed);
    }

    private changeColor() {
        const otherColors = PRIMARY_COLORS.filter(c => c !== this.color);
        this.color = getRandomElement(otherColors);
    }

    private setNewTargetPosition() {
        const padding = 100;
        this.targetPos.x = Math.random() * (this.canvasWidth - padding * 2) + padding;
        this.targetPos.y = Math.random() * (this.canvasHeight / 2 - padding) + padding; // Move in top half
    }
    
    private attack() {
        const numBullets = 16;
        for (let i = 0; i < numBullets; i++) {
            const angle = (i / numBullets) * (Math.PI * 2);
            const direction = new Vec2(Math.cos(angle), Math.sin(angle));
            const bullet = new Bullet(this.pos, direction, this.color, true);
            this.createBullet(bullet);
        }
    }

    takeDamage(amount: number, damageColor: GameColor) {
        if (damageColor === this.color) {
            this.health -= amount;
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isAlive) return;

        ctx.save();
        const hexColor = COLOR_DETAILS[this.color].hex;

        // Pulsing glow effect
        const pulse = Math.abs(Math.sin(Date.now() / 300));
        ctx.shadowColor = hexColor;
        ctx.shadowBlur = 20 + pulse * 10;

        // Main body
        ctx.fillStyle = hexColor;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Shape Overlay
        drawShapeForColor(ctx, this.pos, this.radius, this.color, 'black');

        ctx.restore();
    }
}
