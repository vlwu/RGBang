import { Vec2, drawShapeForColor, distance } from '../common/utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, SECONDARY_COLORS, getRandomElement } from '../data/color';
import { Player } from './player';
import { ParticleSystem } from './particle';
import { Bullet } from './bullet';
import { SoundManager, SoundType } from '../managers/sound-manager';
import { ENEMY_CONFIG } from '../data/gameConfig';
import { IActionCallbacks, IVortex } from '../common/types';

export enum PunishmentType {
    SPEED_BOOST = 'SPEED_BOOST',
    DAMAGE_BOOST = 'DAMAGE_BOOST',
    SPLIT = 'SPLIT',
    REFLECT_BULLET = 'REFLECT_BULLET',
}

enum EnemyState {
    CHASING,
    TELEGRAPHING_ATTACK,
    ATTACKING,
}

export class Enemy {
    private static nextId = 0;
    public readonly id: number;

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

    isSlowed = false;
    slowTimer = 0;
    slowFactor = 0.5;

    isVoided = false;
    voidTimer = 0;

    chainHit = false;

    private wrongHitCounter = 0;
    public activePunishment: PunishmentType | null = null;
    private punishmentTimer = 0;
    private readonly punishmentDuration = ENEMY_CONFIG.PUNISHMENT_DURATION_FRAMES;

    public isReflecting = false;

    public onSplit: ((enemy: Enemy) => void) | null = null;
    private soundManager: SoundManager;

    private chainHitMaxChains = 0;
    private chainHitDamage = 0;
    private chainHitRange = 0;

    private isChromaSentinel = false;
    private colorShiftTimer = 0;
    private readonly colorShiftInterval = ENEMY_CONFIG.CHROMA_SENTINEL_SHIFT_INTERVAL;
    private colorShiftImmunityTimer = 0;
    private readonly colorShiftImmunityDuration = ENEMY_CONFIG.CHROMA_SENTINEL_IMMUNITY_DURATION;

    private state: EnemyState = EnemyState.CHASING;
    private stateTimer = 0;
    private attackTargetPos: Vec2 | null = null;
    private movementAngleOffset = Math.random() * Math.PI * 2;

    constructor(x: number, y: number, color: GameColor, radius: number, health: number, speed: number, points: number, soundManager: SoundManager, isChromaSentinel = false) {
        this.id = Enemy.nextId++;
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.radius = radius;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.baseSpeed = speed;
        this.points = points;
        this.soundManager = soundManager;

        this.isChromaSentinel = isChromaSentinel;
        if (this.isChromaSentinel) {
            this.colorShiftTimer = this.colorShiftInterval;
        }
    }

    update(player: Player, allEnemies: Enemy[], particles: ParticleSystem, vortexes: IVortex[], actionCallbacks: IActionCallbacks): Bullet | null {
        if (!this.isAlive) return null;

        if (this.activePunishment) {
            this.punishmentTimer--;
            if (this.punishmentTimer <= 0) this.deactivatePunishment();
        }

        this.stateTimer--;
        this.handleStatusEffects();

        if (this.isFrozen) return null;

        for (const vortex of vortexes) {
            const distVec = vortex.pos.sub(this.pos);
            const dist = distVec.magnitude();
            if (dist < vortex.radius) {
                const force = distVec.normalize().scale(vortex.strength * (1 - dist / vortex.radius));
                this.pos.addInPlace(force);
            }
        }

        if (this.chainHit) {
            this.applyChainLightning(this.chainHitMaxChains, this.chainHitDamage, this.chainHitRange, allEnemies, particles, this);
            this.chainHit = false;
        }

        if (this.isChromaSentinel) {
            if (this.colorShiftImmunityTimer > 0) this.colorShiftImmunityTimer--;
            else this.colorShiftTimer--;

            if (this.colorShiftTimer <= 0) {
                this.changeChromaColor();
                this.soundManager.play(SoundType.ChromaSentinelShift);
                this.colorShiftTimer = this.colorShiftInterval;
                this.colorShiftImmunityTimer = this.colorShiftImmunityDuration;
            }
        }

        return this.runStateMachine(player, particles, actionCallbacks);
    }

    private runStateMachine(player: Player, particles: ParticleSystem, actionCallbacks: IActionCallbacks): Bullet | null {
        switch (this.state) {
            case EnemyState.CHASING:
                this.move(player);
                if (this.stateTimer <= 0) {
                    this.state = EnemyState.TELEGRAPHING_ATTACK;
                    this.stateTimer = ENEMY_CONFIG.TELEGRAPH_TIME_FRAMES;
                    this.attackTargetPos = new Vec2(player.pos.x, player.pos.y);
                }
                break;

            case EnemyState.TELEGRAPHING_ATTACK:
                if (this.stateTimer <= 0) {
                    this.state = EnemyState.ATTACKING;
                    this.stateTimer = ENEMY_CONFIG.ATTACK_TIME_FRAMES;
                }
                break;

            case EnemyState.ATTACKING:
                const newBullet = this.performAttack(player, particles, actionCallbacks);
                if (this.stateTimer <= 0) {
                    this.state = EnemyState.CHASING;
                    this.stateTimer = ENEMY_CONFIG.BASE_CHASE_TIME_FRAMES + Math.random() * 120;
                    this.attackTargetPos = null;
                }
                return newBullet;
        }
        return null;
    }

    private move(player: Player) {
        let direction = player.pos.sub(this.pos).normalize();

        if (this.color === GameColor.YELLOW || this.color === GameColor.ORANGE || this.color === GameColor.GREEN) {
            this.movementAngleOffset += 0.05;
            const perpendicular = new Vec2(-direction.y, direction.x);
            direction = direction.add(perpendicular.scale(Math.sin(this.movementAngleOffset) * 0.8)).normalize();
        } else if (this.color === GameColor.PURPLE) {
            const dist = distance(this, player);
            if (dist < 250) {
                direction = this.pos.sub(player.pos).normalize();
            } else {
                this.movementAngleOffset += 0.02;
                const perpendicular = new Vec2(-direction.y, direction.x);
                direction = direction.add(perpendicular.scale(Math.cos(this.movementAngleOffset))).normalize();
            }
        }

        this.pos.addInPlace(direction.scale(this.speed));
    }

    private performAttack(player: Player, particles: ParticleSystem, actionCallbacks: IActionCallbacks): Bullet | null {
        switch (this.color) {
            case GameColor.RED:
            case GameColor.ORANGE:
                if (this.attackTargetPos) {
                    const direction = this.attackTargetPos.sub(this.pos).normalize();
                    this.pos.addInPlace(direction.scale(this.baseSpeed * 4));

                    if (this.color === GameColor.ORANGE) {
                        particles.add(this.pos, GameColor.RED, 2);
                        if (this.stateTimer <= 1) {
                            actionCallbacks.dealAreaDamage(this.pos, 60, 15, GameColor.ORANGE);
                        }
                    }
                }
                break;
            case GameColor.BLUE:
            case GameColor.PURPLE:
                if (this.attackTargetPos && this.stateTimer === 29) {
                    const direction = this.attackTargetPos.sub(this.pos);
                    const bullet = new Bullet(this.pos, direction, this.color, false);
                    bullet.isEnemyProjectile = true;
                    if (this.color === GameColor.BLUE) {
                        bullet.slowsPlayer = true;
                        bullet.damage = 5;
                    } else {
                        bullet.isGravityOrb = true;
                        bullet.damage = 10;
                        bullet.radius = 10;
                        bullet.vel = bullet.vel.scale(0.7);
                    }
                    return bullet;
                }
                break;
            case GameColor.GREEN:
                 if (this.stateTimer === 29) {
                    actionCallbacks.createSlowField(this.pos, 100, 480);
                 }
                 break;
        }
        return null;
    }

    private handleStatusEffects() {
        if (this.frozenTimer > 0) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) this.isFrozen = false;
        }
        if (this.igniteTimer > 0) {
            this.igniteTimer--;
            if (this.igniteTimer % 30 === 0) {
                this.health -= this.igniteDamage;
                if (this.health <= 0) this.isAlive = false;
            }
            if (this.igniteTimer <= 0) this.isIgnited = false;
        }
        if (this.voidTimer > 0) {
            this.voidTimer--;
            if (this.voidTimer <= 0) this.isVoided = false;
        }
        if (this.slowTimer > 0) {
            this.slowTimer--;
            if (this.slowTimer <= 0) this.isSlowed = false;
        }

        let currentSpeed = this.baseSpeed;
        if (this.isFrozen || this.state === EnemyState.TELEGRAPHING_ATTACK) currentSpeed *= 0;
        else if (this.isSlowed) currentSpeed *= this.slowFactor;

        if (this.activePunishment === PunishmentType.SPEED_BOOST) {
            currentSpeed *= 1.5;
        }
        this.speed = currentSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isAlive) return;

        ctx.save();
        if (this.state === EnemyState.TELEGRAPHING_ATTACK) {
            const pulse = Math.abs(Math.sin(Date.now() / 150));
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 15 + pulse * 10;

            if (this.color === GameColor.GREEN && this.attackTargetPos) {
                const telegraphProgress = 1 - (this.stateTimer / ENEMY_CONFIG.TELEGRAPH_TIME_FRAMES);
                const radius = 100 * telegraphProgress;
                ctx.strokeStyle = `rgba(102, 255, 140, ${0.2 + telegraphProgress * 0.5})`;
                ctx.fillStyle = `rgba(102, 255, 140, ${0.1 * telegraphProgress})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            if ((this.color === GameColor.RED || this.color === GameColor.ORANGE) && this.attackTargetPos) {
                const attackDuration = 30;
                const dashSpeed = this.baseSpeed * 4;
                const totalDashDistance = dashSpeed * attackDuration;
                const direction = this.attackTargetPos.sub(this.pos).normalize();
                const actualDashEndPos = this.pos.add(direction.scale(totalDashDistance));

                ctx.save();
                ctx.strokeStyle = this.hexColor;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 10]);
                ctx.globalAlpha = 0.5 + pulse * 0.3;

                ctx.beginPath();
                ctx.moveTo(this.pos.x, this.pos.y);
                ctx.lineTo(actualDashEndPos.x, actualDashEndPos.y);
                ctx.stroke();

                ctx.restore();
            }

        } else if (this.isFrozen) ctx.shadowColor = '#4d94ff';
        else if (this.isReflecting) ctx.shadowColor = '#7DF9FF';
        else if (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) ctx.shadowColor = 'white';
        else if (this.isVoided) ctx.shadowColor = '#d966ff';
        else {
            if (this.activePunishment === PunishmentType.SPEED_BOOST) {
                const pulse = Math.abs(Math.sin(Date.now() / 100));
                ctx.shadowColor = `rgba(255, 165, 0, ${0.7 + pulse * 0.3})`;
                ctx.shadowBlur = 20 + pulse * 5;
            } else if (this.activePunishment === PunishmentType.DAMAGE_BOOST) {
                const pulse = Math.abs(Math.sin(Date.now() / 150));
                ctx.shadowColor = `rgba(255, 0, 0, ${0.5 + pulse * 0.5})`;
                ctx.shadowBlur = 15 + pulse * 10;
            } else {
                ctx.shadowBlur = 15;
            }
        }


        ctx.fillStyle = this.hexColor;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        drawShapeForColor(ctx, this.pos, this.radius, this.color, 'black');

        if (this.state === EnemyState.TELEGRAPHING_ATTACK) {
            const pulse = Math.abs(Math.sin(Date.now() / 150));
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        } else if (this.isFrozen) ctx.strokeStyle = "rgba(173, 216, 230, 0.8)";
        else if (this.isReflecting) ctx.strokeStyle = "rgba(125, 249, 255, 0.8)";
        else if (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        else if (this.isVoided) ctx.strokeStyle = "rgba(217, 102, 255, 0.8)";
        if (this.isFrozen || this.isReflecting || (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) || this.isVoided) {
             ctx.lineWidth = 3;
             ctx.stroke();
        }
        if (this.isSlowed) {
            ctx.fillStyle = "rgba(102, 255, 140, 0.3)";
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 3, 0, Math.PI*2);
            ctx.fill();
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
    }

    takeDamage(amount: number, damageColor: GameColor, bypassColorCheck = false): { hit: boolean, killed: boolean, damageDealt: number } {
        const damageColorDetail = COLOR_DETAILS[damageColor];

        if (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) {
            this.soundManager.play(SoundType.EnemyHit, 0.5);
            return { hit: false, killed: false, damageDealt: 0 };
        }

        const isEffectiveHit = bypassColorCheck || this.isVoided || damageColor === this.color || (damageColorDetail.components?.includes(this.color) ?? false);

        if (isEffectiveHit) {
            this.health -= amount;
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
            if (this.isReflecting) {
                this.deactivatePunishment();
            }
            return { hit: true, killed: !this.isAlive, damageDealt: amount };
        } else {
            if (!this.isReflecting) {
                this.wrongHitCounter++;
                if (this.wrongHitCounter >= 3) {
                    this.applyPunishment();
                    this.wrongHitCounter = 0;
                }
            }
            return { hit: false, killed: false, damageDealt: 0 };
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

    applySlow(duration: number, factor: number) {
        this.isSlowed = true;
        this.slowTimer = Math.max(this.slowTimer, duration);
        this.slowFactor = factor;
    }

    applyVoid(duration: number) {
        this.isVoided = true;
        this.voidTimer = duration;
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
            closestEnemy.takeDamage(damage, GameColor.YELLOW, true);
            closestEnemy.triggerChainLightning(maxChains - 1, damage, range);
        }
    }

    private changeChromaColor() {
        const otherColors = PRIMARY_COLORS.filter(c => c !== this.color);
        this.color = getRandomElement(otherColors);
        this.hexColor = COLOR_DETAILS[this.color].hex;
    }

    private applyPunishment() {
        if (this.activePunishment) return;

        const punishments = Object.values(PunishmentType);
        const availablePunishments = punishments.filter(p => p !== PunishmentType.SPLIT || this.radius > 10);
        const randomPunishment = availablePunishments[Math.floor(Math.random() * availablePunishments.length)];
        this.activePunishment = randomPunishment;
        this.punishmentTimer = this.punishmentDuration;

        switch (randomPunishment) {
            case PunishmentType.SPEED_BOOST:
                this.soundManager.play(SoundType.EnemySpeedBoost);
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
                    const enemy1 = new Enemy(this.pos.x - 10, this.pos.y, this.color, newRadius, newHealth, newSpeed, newPoints, this.soundManager);
                    const enemy2 = new Enemy(this.pos.x + 10, this.pos.y, this.color, newRadius, newHealth, newSpeed, newPoints, this.soundManager);
                    this.onSplit(enemy1);
                    this.onSplit(enemy2);
                    this.soundManager.play(SoundType.EnemySplit);
                 }
                break;
            case PunishmentType.REFLECT_BULLET:
                this.isReflecting = true;
                this.soundManager.play(SoundType.EnemyReflect);
                break;
        }
    }

    private deactivatePunishment() {
        if (!this.activePunishment) return;

        switch (this.activePunishment) {
            case PunishmentType.DAMAGE_BOOST:
                this.damage = 10;
                break;
            case PunishmentType.REFLECT_BULLET:
                this.isReflecting = false;
                break;
        }
        this.activePunishment = null;
        this.punishmentTimer = 0;
        this.wrongHitCounter = 0;
    }
}