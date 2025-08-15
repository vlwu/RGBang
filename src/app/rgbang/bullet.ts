import { Vec2, drawShapeForColor } from './utils';
import { GameColor, COLOR_DETAILS } from './color';
import { Enemy } from './enemy';

export class Bullet {
    pos: Vec2;
    vel: Vec2;
    radius = 5;
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

    private seekForce = 0.3;

    constructor(pos: Vec2, direction: Vec2, color: GameColor, isFromBoss = false) {
        this.pos = new Vec2(pos.x, pos.y);
        this.vel = direction.normalize().scale(isFromBoss ? 4 : 10);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.isFromBoss = isFromBoss;
        if(isFromBoss) this.radius = 8;
        this.lifespan = isFromBoss ? 420 : 300;
    }

    reset(pos: Vec2, direction: Vec2, color: GameColor, isFromBoss = false) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
        this.vel = direction.normalize().scale(isFromBoss || this.isEnemyProjectile ? 4 : 10);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.isFromBoss = isFromBoss;
        this.radius = isFromBoss || this.isEnemyProjectile ? 8 : 5;
        this.damage = isFromBoss ? 10 : 10;
        this.isActive = true;
        this.lifespan = isFromBoss || this.isEnemyProjectile ? 420 : 300;
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

        if (this.isSlowing) {
            this.trailPoints.push(this.pos.add(new Vec2(0,0)));
            if (this.trailPoints.length > 10) {
                this.trailPoints.shift();
            }
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
                const steer = desiredDirection.sub(this.vel.normalize()).normalize().scale(this.seekForce);
                this.vel = this.vel.add(steer).normalize().scale(this.vel.magnitude());
            }
        }

        this.pos = this.pos.add(this.vel);

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
        if (this.isSlowing && this.trailPoints.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
            for (let i = 1; i < this.trailPoints.length; i++) {
                ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
            }
            ctx.strokeStyle = "rgba(102, 255, 140, 0.3)";
            ctx.lineWidth = 10;
            ctx.lineCap = "round";
            ctx.stroke();
        }

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

        ctx.restore();
    }
}