// src/app/rgbang/enemy.ts
import { Vec2, drawShapeForColor, distance } from './utils';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS, getRandomElement } from './color'; // NEW: getRandomElement for Chroma Sentinel
import { Player } from './player';
import { ParticleSystem } from './particle';
import { Bullet } from './bullet';
import { SoundManager, SoundType } from './sound-manager'; // NEW: Import SoundManager

export enum PunishmentType {
    SPEED_BOOST = 'SPEED_BOOST',
    DAMAGE_BOOST = 'DAMAGE_BOOST',
    SPLIT = 'SPLIT',
    REFLECT_BULLET = 'REFLECT_BULLET',
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
    public activePunishment: PunishmentType | null = null;
    private punishmentTimer = 0;
    private readonly punishmentDuration = 300;

    public isReflecting = false;

    public onSplit: ((enemy: Enemy) => void) | null = null;
    private soundManager: SoundManager; // NEW: Sound manager instance

    private chainHitMaxChains = 0;
    private chainHitDamage = 0;
    private chainHitRange = 0;

    // NEW: Chroma Sentinel specific properties
    private isChromaSentinel = false;
    private colorShiftTimer = 0;
    private readonly colorShiftInterval = 180; // 3 seconds at 60 FPS
    private colorShiftImmunityTimer = 0;
    private readonly colorShiftImmunityDuration = 180; // 3 seconds

    constructor(x: number, y: number, color: GameColor, radius: number, health: number, speed: number, points: number, soundManager: SoundManager, isChromaSentinel = false) { // MODIFIED: Added soundManager and isChromaSentinel
        this.pos = new Vec2(x, y);
        this.color = color;
        this.hexColor = COLOR_DETAILS[color].hex;
        this.radius = radius;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.baseSpeed = speed;
        this.points = points;
        this.soundManager = soundManager; // Initialize sound manager

        this.isChromaSentinel = isChromaSentinel;
        if (this.isChromaSentinel) {
            this.colorShiftTimer = this.colorShiftInterval;
        }
    }

    update(player: Player, allEnemies: Enemy[], particles: ParticleSystem) {
        if (!this.isAlive) return;

        if (this.activePunishment) {
            this.punishmentTimer--;
            if (this.punishmentTimer <= 0) {
                this.deactivatePunishment();
            }
        }

        if (this.isFrozen) {
            this.frozenTimer--;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
                this.speed = this.baseSpeed;
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

        // NEW: Chroma Sentinel color shifting logic
        if (this.isChromaSentinel) {
            if (this.colorShiftImmunityTimer > 0) {
                this.colorShiftImmunityTimer--;
            }
            this.colorShiftTimer--;
            if (this.colorShiftTimer <= 0 && this.colorShiftImmunityTimer <= 0) {
                this.changeChromaColor();
                this.soundManager.play(SoundType.ChromaSentinelShift); // Play sound on shift
                this.colorShiftTimer = this.colorShiftInterval;
                this.colorShiftImmunityTimer = this.colorShiftImmunityDuration;
            }
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
        } else if (this.isReflecting) {
            ctx.shadowColor = '#7DF9FF';
            ctx.shadowBlur = 20;
        } else if (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) { // NEW: Visual for Chroma Sentinel immunity
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 15 + Math.abs(Math.sin(this.colorShiftImmunityTimer / 10) * 10);
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
        } else if (this.isReflecting) {
            ctx.strokeStyle = "rgba(125, 249, 255, 0.8)";
            ctx.lineWidth = 4;
            ctx.stroke();
        } else if (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) { // NEW: Stroke for Chroma Sentinel immunity
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
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
                [PunishmentType.SPLIT]: "SPLIT",
                [PunishmentType.REFLECT_BULLET]: "RFL",
            }[this.activePunishment];
            ctx.fillText(indicatorText, this.pos.x, this.pos.y - this.radius - 25);
        }
    }

    takeDamage(amount: number, damageColor: GameColor): boolean {
        const damageColorDetail = COLOR_DETAILS[damageColor];

        // NEW: Chroma Sentinel immunity
        if (this.isChromaSentinel && this.colorShiftImmunityTimer > 0) {
            this.soundManager.play(SoundType.EnemyHit, 0.5); // Play a 'clink' sound for immune hits
            return false;
        }

        const isEffectiveHit = damageColor === this.color ||
                               (damageColorDetail.components?.includes(this.color) ?? false);

        if (isEffectiveHit) {
            this.health -= amount;
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
            if (this.isReflecting) { // Correct hit on reflecting enemy removes reflection
                this.deactivatePunishment();
            }
            return true;
        } else {
            if (!this.isReflecting) { // Only increment wrong hit counter if not already reflecting
                this.wrongHitCounter++;
                if (this.wrongHitCounter >= 3) {
                    this.applyPunishment();
                    this.wrongHitCounter = 0;
                }
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
        this.speed *= 0.5;
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

    // NEW: Chroma Sentinel color change
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
                this.speed = Math.min(this.speed * 1.5, this.baseSpeed * 2);
                this.soundManager.play(SoundType.EnemySpeedBoost); // Play sound
                break;
            case PunishmentType.DAMAGE_BOOST:
                this.damage = Math.min(this.damage * 2, 40);
                // No specific sound for damage boost, perhaps subtle visual
                break;
            case PunishmentType.SPLIT:
                 if (this.radius > 10 && this.onSplit) {
                    this.isAlive = false; // Mark as not alive immediately before splitting

                    const newRadius = this.radius * 0.7;
                    const newHealth = Math.round(this.maxHealth * 0.6);
                    const newSpeed = this.speed * 1.1;
                    const newPoints = Math.round(this.points * 0.5);

                    const enemy1 = new Enemy(this.pos.x - 10, this.pos.y, this.color, newRadius, newHealth, newSpeed, newPoints, this.soundManager); // Pass soundManager
                    const enemy2 = new Enemy(this.pos.x + 10, this.pos.y, this.color, newRadius, newHealth, newSpeed, newPoints, this.soundManager); // Pass soundManager

                    this.onSplit(enemy1);
                    this.onSplit(enemy2);
                    this.soundManager.play(SoundType.EnemySplit); // Play sound
                 }
                break;
            case PunishmentType.REFLECT_BULLET:
                this.isReflecting = true;
                this.soundManager.play(SoundType.EnemyReflect); // Play sound
                break;
        }
    }

    private deactivatePunishment() {
        if (!this.activePunishment) return;

        switch (this.activePunishment) {
            case PunishmentType.SPEED_BOOST:
                this.speed = this.baseSpeed;
                break;
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