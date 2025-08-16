import { Vec2, lerp, drawShapeForColor } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color';
import { Bullet } from './bullet';
import { SoundManager, SoundType } from './sound-manager';
import { BOSS_CONFIG } from './gameConfig';

enum BossState {
    IDLE,
    TELEGRAPHING_MOVE,
    MOVING,
}

export class Boss {
    pos: Vec2;
    radius = BOSS_CONFIG.RADIUS;
    health: number;
    maxHealth: number;
    color: GameColor;
    isAlive = true;
    points = 0;
    damage: number;

    private canvasWidth: number;
    private canvasHeight: number;
    private soundManager: SoundManager;

    private state: BossState = BossState.IDLE;


    private colorChangeTimer = 0;
    private readonly colorChangeInterval = BOSS_CONFIG.COLOR_CHANGE_INTERVAL;

    private stateTimer = 0;
    private readonly idleTime = BOSS_CONFIG.IDLE_TIME_FRAMES;
    private readonly telegraphTime = BOSS_CONFIG.TELEGRAPH_TIME_FRAMES;

    private targetPos: Vec2;
    private moveSpeed = BOSS_CONFIG.MOVE_SPEED;

    private attackTimer = 0;
    private readonly attackInterval: number;

    private createBullet: (bullet: Bullet) => void;

    constructor(
        x: number,
        y: number,
        createBullet: (bullet: Bullet) => void,
        canvasWidth: number,
        canvasHeight: number,
        soundManager: SoundManager,
        maxHealth = 1000,
        damage = 30,
        attackInterval = 100
    ) {
        this.pos = new Vec2(x, y);
        this.targetPos = new Vec2(x, y);
        this.maxHealth = maxHealth;
        this.health = this.maxHealth;
        this.damage = damage;
        this.attackInterval = attackInterval;
        this.color = getRandomElement(PRIMARY_COLORS);
        this.createBullet = createBullet;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.soundManager = soundManager;
        this.stateTimer = this.idleTime;
    }

    update() {
        if (!this.isAlive) return;


        this.colorChangeTimer--;
        this.attackTimer--;
        this.stateTimer--;


        if (this.colorChangeTimer <= 0) {
            this.changeColor();
            this.colorChangeTimer = this.colorChangeInterval;
        }
        if (this.attackTimer <= 0) {
            this.attack();
            this.attackTimer = this.attackInterval;
        }


        switch (this.state) {
            case BossState.IDLE:
                if (this.stateTimer <= 0) {
                    this.state = BossState.TELEGRAPHING_MOVE;
                    this.stateTimer = this.telegraphTime;
                    this.setNewTargetPosition();
                }
                break;

            case BossState.TELEGRAPHING_MOVE:
                if (this.stateTimer <= 0) {
                    this.state = BossState.MOVING;

                }
                break;

            case BossState.MOVING:
                this.move();

                break;
        }
    }

    private move() {
        this.pos.x = lerp(this.pos.x, this.targetPos.x, this.moveSpeed);
        this.pos.y = lerp(this.pos.y, this.targetPos.y, this.moveSpeed);


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
             Math.random() * (this.canvasHeight / 2 - padding) + padding
        );
    }

    private attack() {
        const numBullets = 20;
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


        ctx.strokeStyle = hexColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 15]);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.targetPos.x, this.targetPos.y);
        ctx.stroke();


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


        if (this.state === BossState.TELEGRAPHING_MOVE) {
            this.drawMoveTelegraph(ctx);
        }


        const pulse = Math.abs(Math.sin(Date.now() / 300));
        ctx.shadowColor = hexColor;
        ctx.shadowBlur = 20 + pulse * 10;


        ctx.fillStyle = hexColor;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();


        drawShapeForColor(ctx, this.pos, this.radius, this.color, 'black');

        ctx.restore();


        const barWidth = this.radius * 2.5;
        const barHeight = 12;
        const barX = this.pos.x - barWidth / 2;
        const barY = this.pos.y - this.radius - 25;

        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercentage = this.health / this.maxHealth;
        const healthWidth = barWidth * healthPercentage;
        const bossColorHex = COLOR_DETAILS[this.color].hex;

        if (healthWidth > 0) {
            ctx.fillStyle = bossColorHex;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barWidth, barHeight);


        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(`${Math.round(this.health)} / ${this.maxHealth}`, this.pos.x, barY + barHeight / 2 + 1);

        ctx.restore();
    }
}