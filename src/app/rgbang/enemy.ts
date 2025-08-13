import { Vec2, drawShapeForColor, distance } from './utils';
import { GameColor, COLOR_DETAILS } from './color';
import { Player } from './player';
import { ParticleSystem } from './particle';

export enum PunishmentType {
    SPEED_BOOST = 'SPEED_BOOST',
    DAMAGE_BOOST = 'DAMAGE_BOOST',
    SPLIT = 'SPLIT',
}


export class Enemy {
    pos: Vec2;
    radius: number;
    health: number;
    maxHealth: number;
    color: GameColor;
    hexColor: string;
    speed: number;
    baseSpeed: number;
    points: number;
    isAlive = true;
    damage = 10;


    isIgnited = false;
    igniteDamage = 0;
    igniteTimer = 0;

    isFrozen = false;
    frozenTimer = 0;

    chainHit = false;

    private wrongHitCounter = 0;
    private activePunishment: PunishmentType | null = null;


    public onSplit: ((enemy: Enemy) => void) | null = null;

    private chainHitMaxChains = 0;
    private chainHitDamage = 0;
    private chainHitRange = 0;

    constructor(x: number, y: number, color: GameColor, radius: number, health: number, speed: number, points: number) {
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.radius = radius;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.baseSpeed = speed;
        this.points = points;
    }

    update(player: Player, allEnemies: Enemy[], particles: ParticleSystem) {
        if (!this.isAlive) return;


        if (this.isFrozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
            }

            return;
        }

        if (this.isIgnited) {
            this.igniteTimer--;
            if (this.igniteTimer % 30 === 0) {
                this.health -= this.igniteDamage;
                if (this.health <= 0) {
                    this.isAlive = false;
                }
            }
            if (this.igniteTimer <= 0) {
                this.isIgnited = false;
            }
        }

        if (this.chainHit) {
            this.applyChainLightning(this.chainHitMaxChains, this.chainHitDamage, this.chainHitRange, allEnemies, particles, this);
            this.chainHit = false;
        }


        const direction = player.pos.sub(this.pos).normalize();
        this.pos = this.pos.add(direction.scale(this.speed));
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isAlive) return;

        ctx.save();


        if (this.isFrozen) {
            ctx.shadowColor = '#4d94ff';
            ctx.shadowBlur = 15;
        }


        ctx.fillStyle = this.hexColor;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();


        drawShapeForColor(ctx, this.pos, this.radius, this.color, 'black');

        if (this.isFrozen) {
            ctx.strokeStyle = "rgba(173, 216, 230, 0.8)";
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.restore();


        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const barHeight = 5;
            const barX = this.pos.x - this.radius;
            const barY = this.pos.y - this.radius - 15;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const healthPercentage = this.health / this.maxHealth;
            ctx.fillStyle = this.isIgnited ? '#ffc266' : 'red';
            ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        }


        if (this.activePunishment) {
            ctx.font = 'bold 12px "Space Grotesk"';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            const indicatorText = {
                [PunishmentType.SPEED_BOOST]: "SPD",
                [PunishmentType.DAMAGE_BOOST]: "DMG",
                [PunishmentType.SPLIT]: "SPLIT"
            }[this.activePunishment];
            ctx.fillText(indicatorText, this.pos.x, this.pos.y - this.radius - 25);
        }
    }

    takeDamage(amount: number, damageColor: GameColor): boolean {
        const damageColorDetail = COLOR_DETAILS[damageColor];


        const isEffectiveHit = damageColor === this.color ||
                               (damageColorDetail.components?.includes(this.color) ?? false);

        if (isEffectiveHit) {
            this.health -= amount;
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
            return true;
        } else {

            this.wrongHitCounter++;
            if (this.wrongHitCounter >= 3) {
                this.applyPunishment();
                this.wrongHitCounter = 0;
            }
            return false;
        }
    }

    public triggerChainLightning(maxChains: number, damage: number, range: number) {
        this.chainHit = true;
        this.chainHitMaxChains = maxChains;
        this.chainHitDamage = damage;
        this.chainHitRange = range;
    }

    applyIgnite(damage: number, duration: number) {
        this.isIgnited = true;
        this.igniteDamage = damage;
        this.igniteTimer = duration;
    }

    applyFreeze(duration: number) {
        this.isFrozen = true;
        this.frozenTimer = duration;
    }

    applyChainLightning(maxChains: number, damage: number, range: number, allEnemies: Enemy[], particles: ParticleSystem, originEnemy: Enemy) {
        if (maxChains <= 0) return;

        let closestEnemy: Enemy | null = null;
        let minDistance = Infinity;

        for (const otherEnemy of allEnemies) {
            if (otherEnemy === originEnemy || !otherEnemy.isAlive || otherEnemy.chainHit) continue;

            const d = distance(originEnemy, otherEnemy);
            if (d < range && d < minDistance) {
                minDistance = d;
                closestEnemy = otherEnemy;
            }
        }

        if (closestEnemy) {
            particles.addLightning(originEnemy.pos, closestEnemy.pos);
            closestEnemy.takeDamage(damage, GameColor.YELLOW);
            closestEnemy.triggerChainLightning(maxChains - 1, damage, range);
        }
    }


    private applyPunishment() {
        if (this.activePunishment) return;

        const punishments = Object.values(PunishmentType);
        const randomPunishment = punishments[Math.floor(Math.random() * punishments.length)];
        this.activePunishment = randomPunishment;

        switch (randomPunishment) {
            case PunishmentType.SPEED_BOOST:
                this.speed = Math.min(this.speed * 1.5, this.baseSpeed * 2);
                break;
            case PunishmentType.DAMAGE_BOOST:
                this.damage = Math.min(this.damage * 2, 40);
                break;
            case PunishmentType.SPLIT:
                 if (this.radius > 10 && this.onSplit) {
                    this.isAlive = false;

                    const newRadius = this.radius * 0.7;
                    const newHealth = Math.round(this.maxHealth * 0.6);
                    const newSpeed = this.speed * 1.1;
                    const newPoints = Math.round(this.points * 0.5);

                    const enemy1 = new Enemy(this.pos.x - 10, this.pos.y, this.color, newRadius, newHealth, newSpeed, newPoints);
                    const enemy2 = new Enemy(this.pos.x + 10, this.pos.y, this.color, newRadius, newHealth, newSpeed, newPoints);

                    this.onSplit(enemy1);
                    this.onSplit(enemy2);
                 }
                break;
        }
    }
}