import { Vec2, lerp, drawShapeForColor } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color';
import { Bullet } from './bullet';
import { SoundManager, SoundType } from './sound-manager';

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
    points = 0;
    damage = 30;

    private canvasWidth: number;
    private canvasHeight: number;
    private soundManager: SoundManager;

    private state: BossState = BossState.IDLE;


    private colorChangeTimer = 0;
    private readonly colorChangeInterval = 300;

    private stateTimer = 0;
    private readonly idleTime = 60;
    private readonly telegraphTime = 120;

    private targetPos: Vec2;
    private moveSpeed = 0.05;

    private attackTimer = 0;
    private readonly attackInterval = 120;

    private createBullet: (bullet: Bullet) => void;

    constructor(
        x: number,
        y: number,
        createBullet: (bullet: Bullet) => void,
        canvasWidth: number,
        canvasHeight: number,
        soundManager: SoundManager,
    ) {
        this.pos = new Vec2(x, y);
        this.targetPos = new Vec2(x, y);
        this.health = this.maxHealth;
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
        this.soundManager.play(SoundType.BossAttack);
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
            this.soundManager.play(SoundType.BossDamage);
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
    }
}