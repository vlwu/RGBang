
import { Vec2, lerp, drawShapeForColor } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color';
import { Bullet } from './bullet';

enum BossState {
    IDLE,
    TELEGRAPHING_MOVE,
    MOVING,
}

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
    
    private state: BossState = BossState.IDLE;

    // Timers for actions
    private colorChangeTimer = 0;
    private readonly colorChangeInterval = 300; // 5 seconds

    private stateTimer = 0;
    private readonly idleTime = 60; // 1 second
    private readonly telegraphTime = 120; // 2 seconds

    private targetPos: Vec2;
    private moveSpeed = 0.05;

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
        this.stateTimer = this.idleTime;
    }

    update() {
        if (!this.isAlive) return;

        this.updateTimers();
        this.handleStateTransitions();
        this.performStateActions();
    }
    
    private updateTimers() {
        this.colorChangeTimer--;
        this.attackTimer--;
        this.stateTimer--;
    }

    private handleStateTransitions() {
        if (this.stateTimer > 0) return;

        switch (this.state) {
            case BossState.IDLE:
                this.state = BossState.TELEGRAPHING_MOVE;
                this.stateTimer = this.telegraphTime;
                this.setNewTargetPosition();
                break;
            case BossState.TELEGRAPHING_MOVE:
                this.state = BossState.MOVING;
                // No timer for moving, it's based on distance
                break;
            case BossState.MOVING:
                this.state = BossState.IDLE;
                this.stateTimer = this.idleTime;
                break;
        }
    }

    private performStateActions() {
         if (this.colorChangeTimer <= 0) {
            this.changeColor();
            this.colorChangeTimer = this.colorChangeInterval;
        }
        if (this.attackTimer <= 0) {
            this.attack();
            this.attackTimer = this.attackInterval;
        }
        
        if (this.state === BossState.MOVING) {
            this.move();
        }
    }
    
    private move() {
        this.pos.x = lerp(this.pos.x, this.targetPos.x, this.moveSpeed);
        this.pos.y = lerp(this.pos.y, this.targetPos.y, this.moveSpeed);
        
        // If we are close enough, snap to target and change state
        if (this.pos.sub(this.targetPos).magnitude() < 1) {
            this.pos = this.targetPos;
            this.state = BossState.IDLE;
            this.stateTimer = this.idleTime;
        }
    }

    private changeColor() {
        const otherColors = PRIMARY_COLORS.filter(c => c !== this.color);
        this.color = getRandomElement(otherColors);
    }

    private setNewTargetPosition() {
        const padding = 100;
        this.targetPos = new Vec2(
             Math.random() * (this.canvasWidth - padding * 2) + padding,
             Math.random() * (this.canvasHeight / 2 - padding) + padding // Move in top half
        );
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
    
    private drawMoveTelegraph(ctx: CanvasRenderingContext2D) {
        const hexColor = COLOR_DETAILS[this.color].hex;

        ctx.save();
        
        // Dashed line
        ctx.strokeStyle = hexColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 15]);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.targetPos.x, this.targetPos.y);
        ctx.stroke();
        
        // Pulsing target circle
        const pulse = Math.abs(Math.sin(Date.now() / 200));
        ctx.strokeStyle = hexColor;
        ctx.fillStyle = hexColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3 + pulse * 0.4;
        
        ctx.beginPath();
        ctx.arc(this.targetPos.x, this.targetPos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }


    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isAlive) return;

        ctx.save();
        const hexColor = COLOR_DETAILS[this.color].hex;

        // Draw telegraph if in that state
        if (this.state === BossState.TELEGRAPHING_MOVE) {
            this.drawMoveTelegraph(ctx);
        }

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
