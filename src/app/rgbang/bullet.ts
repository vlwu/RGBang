import { Vec2, drawShapeForColor } from './utils';
import { GameColor, COLOR_DETAILS } from './color';
import { Enemy } from './enemy';
import { BULLET_CONFIG } from './gameConfig';

export class Bullet {
    pos: Vec2;
    vel: Vec2;
    radius = BULLET_CONFIG.DEFAULT_RADIUS;
    color: GameColor;
    hexColor: string;
    damage = 10;
    isFromBoss: boolean;
    isActive = true;
    public lifespan: number;
    public isRicochet = false;

    public penetrationsLeft = 0;
    public ricochetsLeft = 0;
    public isSeeking = false;
    public isSlowing = false;
    public isFission = false;
    public isVoid = false;
    public isGravityOrb = false;

    public isEnemyProjectile = false;
    public slowsPlayer = false;

    public hitEnemies: Set<Enemy> = new Set();
    public trailPoints: Vec2[] = [];
    private trailLength = BULLET_CONFIG.TRAIL_LENGTH;

    private seekForce = BULLET_CONFIG.SEEK_FORCE;

    constructor(pos: Vec2, direction: Vec2, color: GameColor, isFromBoss = false) {
        this.pos = new Vec2(pos.x, pos.y);
        this.vel = direction.normalize().scale(isFromBoss ? 4 : 10);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.isFromBoss = isFromBoss;
        if(isFromBoss) this.radius = BULLET_CONFIG.BOSS_RADIUS;
        this.lifespan = isFromBoss ? BULLET_CONFIG.BOSS_LIFESPAN_FRAMES : BULLET_CONFIG.DEFAULT_LIFESPAN_FRAMES;
    }

    reset() {
        this.isActive = true;
        this.lifespan = BULLET_CONFIG.DEFAULT_LIFESPAN_FRAMES;
        this.isRicochet = false;

        this.penetrationsLeft = 0;
        this.ricochetsLeft = 0;
        this.isSeeking = false;
        this.isSlowing = false;
        this.isFission = false;
        this.isVoid = false;
        this.isGravityOrb = false;
        this.isEnemyProjectile = false;
        this.slowsPlayer = false;
        this.hitEnemies.clear();
        this.trailPoints = [];
    }

    update(enemies?: Enemy[], canvasWidth?: number, canvasHeight?: number) {
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.isActive = false;
            return;
        }

        this.trailPoints.push(this.pos.clone());
        if (this.trailPoints.length > this.trailLength) {
            this.trailPoints.shift();
        }

        if (this.isSeeking && enemies && enemies.length > 0) {
            let closestEnemy: Enemy | null = null;
            let minDistance = Infinity;

            for (const enemy of enemies) {
                if (!enemy.isAlive) continue;
                const dist = this.pos.sub(enemy.pos).magnitude();
                if (dist < minDistance && dist < 250) {
                    minDistance = dist;
                    closestEnemy = enemy;
                }
            }

            if (closestEnemy) {
                const desiredDirection = closestEnemy.pos.sub(this.pos).normalize();
                const steer = desiredDirection.subInPlace(this.vel.normalize()).normalizeInPlace().scaleInPlace(this.seekForce);
                const currentSpeed = this.vel.magnitude();
                this.vel.addInPlace(steer).normalizeInPlace().scaleInPlace(currentSpeed);
            }
        }

        this.pos.addInPlace(this.vel);

        if (this.ricochetsLeft > 0 && canvasWidth && canvasHeight) {
            if (this.pos.x < this.radius || this.pos.x > canvasWidth - this.radius) {
                this.vel.x *= -1;
                this.ricochetsLeft--;
                this.pos.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.pos.x));
            }
            if (this.pos.y < this.radius || this.pos.y > canvasHeight - this.radius) {
                this.vel.y *= -1;
                this.ricochetsLeft--;
                this.pos.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.pos.y));
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        switch (this.color) {
            case GameColor.YELLOW:
                this.drawLightningBolt(ctx);
                break;
            case GameColor.BLUE:
                this.drawIceShard(ctx);
                break;
            case GameColor.RED:
                this.drawFireball(ctx);
                break;
            default:
                this.drawDefaultBullet(ctx);
                break;
        }
        ctx.restore();
    }

    private drawDefaultBullet(ctx: CanvasRenderingContext2D) {
        if (this.isGravityOrb) {
            const pulse = Math.abs(Math.sin(Date.now() / 150));
            ctx.shadowColor = this.hexColor;
            ctx.shadowBlur = 10 + pulse * 10;
            ctx.fillStyle = `rgba(30, 0, 50, ${0.4 + pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.hexColor;
        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        drawShapeForColor(ctx, this.pos, this.radius, this.color, 'white');
    }

    private drawLightningBolt(ctx: CanvasRenderingContext2D) {
        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = this.radius * 0.8;
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        const tailPos = this.pos.sub(this.vel.normalize().scale(this.radius * 3));
        ctx.lineTo(tailPos.x, tailPos.y);
        ctx.stroke();

        ctx.strokeStyle = this.hexColor;
        ctx.lineWidth = this.radius * 0.5;
        ctx.stroke();
    }

    private drawIceShard(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(Math.atan2(this.vel.y, this.vel.x));

        ctx.fillStyle = this.hexColor;
        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 10;

        const size = this.radius * 2;
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(-size / 2, -size / 3);
        ctx.lineTo(-size / 3, 0);
        ctx.lineTo(-size / 2, size / 3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    private drawFireball(ctx: CanvasRenderingContext2D) {
        if (this.trailPoints.length > 1) {
            ctx.beginPath();
            for (let i = 0; i < this.trailPoints.length; i++) {
                const p = this.trailPoints[i];
                ctx.lineTo(p.x, p.y);
            }
            const gradient = ctx.createLinearGradient(this.trailPoints[0].x, this.trailPoints[0].y, this.pos.x, this.pos.y);
            gradient.addColorStop(0, 'rgba(255, 100, 50, 0)');
            gradient.addColorStop(1, 'rgba(255, 200, 50, 0.5)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.radius * (1 + Math.random() * 0.5);
            ctx.lineCap = "round";
            ctx.stroke();
        }

        const pulse = Math.abs(Math.sin(Date.now() / 100));
        ctx.fillStyle = this.hexColor;
        ctx.shadowColor = this.hexColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}