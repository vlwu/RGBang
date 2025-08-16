import { Vec2, drawShapeForColor, circleCollision, lerp } from '../common/utils';
import { Bullet } from './bullet';
import InputHandler from '../managers/input-handler';
import { GameColor, COLOR_DETAILS, ALL_COLORS, isSecondaryColor } from '../data/color';
import { RadialMenu } from '../ui/radial-menu';
import { ParticleSystem } from './particle';
import { UpgradeManager } from '../managers/upgrade-manager';
import { Upgrade } from '../data/upgrades';
import { SoundManager, SoundType } from '../managers/sound-manager';
import { FRAGMENT_CONFIG } from '../data/gameConfig';
import { Enemy } from './enemy';

export class Player {
    pos: Vec2;
    radius = 15;
    baseSpeed = 3.2;
    maxHealth = 100;
    health: number;
    isAlive = true;

    public currentColor: GameColor;
    public availableColors: Set<GameColor>;
    private radialMenu: RadialMenu;
    public upgradeManager: UpgradeManager;
    public isRadialMenuOpen = false;
    private soundManager: SoundManager;

    public movementSpeedMultiplier = 1;
    public bulletDamageMultiplier = 1;
    public dashCooldownModifier = 1;
    public dashDurationModifier = 1;
    public shootCooldownModifier = 1;
    public accuracyModifier = 1;
    public scoreMultiplier = 1;
    public prismAttractionRadius = FRAGMENT_CONFIG.ATTRACT_RADIUS;

    public flatHealthIncrease = 0;
    public flatDamageReduction = 0;

    public chainLightningLevel = 0;
    public igniteLevel = 0;
    public iceSpikerLevel = 0;
    public seekingShardsLevel = 0;
    public ricochetRoundsLevel = 0;
    public gravityWellLevel = 0;
    public slowingTrailLevel = 0;
    public fissionLevel = 0;
    public voidLevel = 0;
    public dashDamageLevel = 0;

    public lifestealPercent = 0;
    public adrenalineRushLevel = 0;
    public kineticShieldLevel = 0;
    public fragmentDuplicationChance = 0;
    public punishmentReversalLevel = 0;
    public bulletPenetrationLevel = 0;
    public explosiveFinishLevel = 0;

    public adrenalineTimer = 0;
    private adrenalineCooldown = 0;
    private readonly ADRENALINE_COOLDOWN_TIME = 600;
    public kineticShieldHits = 0;
    public punishmentReversalMeter = 0;
    private readonly PUNISHMENT_METER_MAX = 10;

    private isSlowed = false;
    private slowTimer = 0;

    public shootTimer = 0;

    public isDashing = false;
    private dashTimer = 0;
    private dashDuration = 12;
    private baseDashSpeed = 12;
    private baseDashCooldown = 180;
    public dashCooldownTimer = 0;
    public enemiesHitThisDash: Set<Enemy> = new Set();

    private knockbackVelocity = new Vec2(0, 0);
    private knockbackDamping = 0.95;

    private collectionRippleTimer = 0;
    private readonly collectionRippleDuration = 30;
    private collectionRippleColor: string = '#FFFFFF';

    public isCharging = false;
    public chargeTimer = 0;
    private readonly maxChargeTime = 90;

    constructor(x: number, y: number, initialColor: GameColor, soundManager: SoundManager) {
        this.pos = new Vec2(x, y);
        this.health = this.maxHealth;
        this.currentColor = initialColor;
        this.availableColors = new Set(ALL_COLORS);
        this.radialMenu = new RadialMenu();
        this.upgradeManager = new UpgradeManager(this);
        this.soundManager = soundManager;
        this.updateAvailableColors(initialColor, true);
    }

    update(
        input: InputHandler,
        createBullet: (bullet: Bullet) => void,
        particleSystem: ParticleSystem,
        canvasWidth: number,
        canvasHeight: number,
        isGamePaused = false,
        slowingFields: { pos: Vec2, radius: number }[] = []
    ) {
        if (!this.isAlive) return;

        if (this.shootTimer > 0) this.shootTimer--;
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
        if (this.adrenalineTimer > 0) this.adrenalineTimer--;
        if (this.adrenalineCooldown > 0) this.adrenalineCooldown--;
        if (this.collectionRippleTimer > 0) this.collectionRippleTimer--;
        if (this.slowTimer > 0) {
            this.slowTimer--;
            if (this.slowTimer <= 0) this.isSlowed = false;
        }

        for (const field of slowingFields) {
            if (circleCollision(this, field)) {
                this.applySlow(60);
                break;
            }
        }

        if (this.currentColor !== GameColor.PURPLE && this.isCharging) {
            this.isCharging = false;
            this.chargeTimer = 0;
        }

        this.handleColorSelection(input, createBullet);

        if (this.isRadialMenuOpen) {
            this.radialMenu.update(this.pos, input.mousePos, this.availableColors);
            return;
        }

        if (isGamePaused) return;

        this.handleMovement(input, particleSystem, canvasWidth, canvasHeight);
        this.handleShooting(input, createBullet);
    }

    private updateAvailableColors(newColor: GameColor, isInitialCall = false) {
        if (!isInitialCall && this.currentColor !== newColor) {
            this.soundManager.play(SoundType.GunSwitch);
            if (this.isCharging) {
                this.isCharging = false;
                this.chargeTimer = 0;
            }
        }

        this.currentColor = newColor;
        if (isSecondaryColor(newColor)) {
            const components = COLOR_DETAILS[newColor].components;
            this.availableColors = new Set(ALL_COLORS);
            if (components) {
                this.availableColors.delete(components[0]);
                this.availableColors.delete(components[1]);
            }
        } else {
             this.availableColors = new Set(ALL_COLORS);
        }
    }

    private handleMovement(input: InputHandler, particleSystem: ParticleSystem, canvasWidth: number, canvasHeight: number) {
        if (input.isKeyDown(input.keybindings.dash) && this.dashCooldownTimer === 0) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration * this.dashDurationModifier;
            this.dashCooldownTimer = this.getDashCooldown();
            if (this.kineticShieldLevel > 0) {
                this.kineticShieldHits = this.kineticShieldLevel;
            }
            this.soundManager.play(SoundType.PlayerDash);
            this.knockbackVelocity = new Vec2(0, 0);
            this.enemiesHitThisDash.clear();
        }

        if (this.knockbackVelocity.magnitude() > 0.1) {
            this.pos.addInPlace(this.knockbackVelocity);
            this.knockbackVelocity.scaleInPlace(this.knockbackDamping);
        } else {
            this.knockbackVelocity = new Vec2(0, 0);
        }

        let currentSpeed = this.getSpeed();
        let moveDir = new Vec2(0, 0);

        if (this.isDashing) {
            currentSpeed = this.baseDashSpeed;
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
            particleSystem.addDashParticle(this.pos);
        }

        if (input.isKeyDown(input.keybindings.up)) moveDir.y -= 1;
        if (input.isKeyDown(input.keybindings.down)) moveDir.y += 1;
        if (input.isKeyDown(input.keybindings.left)) moveDir.x -= 1;
        if (input.isKeyDown(input.keybindings.right)) moveDir.x += 1;

        if (moveDir.magnitude() > 0) {
            this.pos.addInPlace(moveDir.normalize().scale(currentSpeed));
        }

        this.pos.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.pos.y));
    }

    private handleColorSelection(input: InputHandler, createBullet: (bullet: Bullet) => void) {
        if (this.radialMenu.active && input.wasKeyReleased(input.keybindings.comboRadial)) {
            const selectedColor = this.radialMenu.getSelectedColor();
            if(selectedColor) {
                this.updateAvailableColors(selectedColor);
                this.handleShooting(input, createBullet, true);
            }
            this.radialMenu.close();
            this.isRadialMenuOpen = false;
            return;
        }

        if (input.isKeyDown(input.keybindings.comboRadial) && !this.radialMenu.active) {
            this.isRadialMenuOpen = true;
            this.radialMenu.open();
            return;
        }

        if (this.isRadialMenuOpen) return;

        let primaryColorSelectedThisFrame: GameColor | null = null;
        if (input.isKeyDown(input.keybindings.primary1) && this.availableColors.has(GameColor.RED)) {
            primaryColorSelectedThisFrame = GameColor.RED;
        } else if (input.isKeyDown(input.keybindings.primary2) && this.availableColors.has(GameColor.YELLOW)) {
            primaryColorSelectedThisFrame = GameColor.YELLOW;
        } else if (input.isKeyDown(input.keybindings.primary3) && this.availableColors.has(GameColor.BLUE)) {
            primaryColorSelectedThisFrame = GameColor.BLUE;
        }

        if (primaryColorSelectedThisFrame !== null) {
            this.updateAvailableColors(primaryColorSelectedThisFrame);
        } else if (input.wheelDeltaY !== 0) {
            const selectableColors = ALL_COLORS.filter(c => this.availableColors.has(c));
            if(selectableColors.length === 0) return;

            const currentIndex = selectableColors.indexOf(this.currentColor);
            let nextIndex;
            if (input.wheelDeltaY > 0) {
                nextIndex = (currentIndex + 1) % selectableColors.length;
            } else {
                nextIndex = (currentIndex - 1 + selectableColors.length) % selectableColors.length;
            }
            this.updateAvailableColors(selectableColors[nextIndex]);
        }
    }

    public heal(amount: number) {
        this.health = Math.min(this.getMaxHealth(), this.health + amount);
    }

    public triggerCollectionEffect(color: GameColor | null) {
        this.collectionRippleTimer = this.collectionRippleDuration;
        this.collectionRippleColor = color ? COLOR_DETAILS[color].hex : '#FFFFFF';
    }

    private applyBulletUpgrades(bullet: Bullet) {
        bullet.damage *= this.bulletDamageMultiplier;

        if (this.bulletPenetrationLevel > 0) {
            bullet.penetrationsLeft = this.bulletPenetrationLevel;
        }
        if (this.ricochetRoundsLevel > 0 && bullet.color === GameColor.YELLOW) {
            bullet.ricochetsLeft = this.ricochetRoundsLevel;
            bullet.lifespan /= 2;
            bullet.isRicochet = true;
        }
        if (this.seekingShardsLevel > 0 && bullet.color === GameColor.RED) {
            bullet.isSeeking = true;
        }
        if (bullet.color === GameColor.GREEN) {
            bullet.isSlowing = true;
        }
        if (bullet.color === GameColor.ORANGE) {
            bullet.isFission = true;
        }
        if (this.voidLevel > 0 && bullet.color === GameColor.PURPLE) {
            bullet.isVoid = true;
        }
    }

    private handleShooting(input: InputHandler, createBullet: (bullet: Bullet) => void, fromRadialMenu = false) {
        const isTryingToShoot = fromRadialMenu || input.isShooting();
        const releasedShoot = input.wasKeyReleased(input.keybindings.shoot);

        if (this.currentColor === GameColor.PURPLE) {
            if (isTryingToShoot && this.shootTimer === 0 && !this.radialMenu.active) {
                this.isCharging = true;
                this.chargeTimer = Math.min(this.chargeTimer + 1, this.maxChargeTime);
            }

            const shouldFire = (releasedShoot || fromRadialMenu) && this.isCharging;

            if (shouldFire) {
                const chargeRatio = this.chargeTimer / this.maxChargeTime;
                const colorDetails = COLOR_DETAILS[this.currentColor];
                const aimDirection = input.mousePos.sub(this.pos);

                const bullet = new Bullet(this.pos, aimDirection, this.currentColor);

                bullet.damage = lerp(colorDetails.baseDamage * 0.5, colorDetails.baseDamage * 1.5, chargeRatio);
                bullet.radius = lerp(colorDetails.baseRadius * 0.7, colorDetails.baseRadius * 1.5, chargeRatio);
                bullet.isGravityOrb = true;
                bullet.vel = aimDirection.normalize().scale(lerp(colorDetails.baseSpeed * 1.2, colorDetails.baseSpeed * 0.8, chargeRatio));

                this.applyBulletUpgrades(bullet);
                createBullet(bullet);

                this.soundManager.play(SoundType.PlayerShoot);
                this.shootTimer = this.getShootCooldown();
                this.isCharging = false;
                this.chargeTimer = 0;
            } else if (!isTryingToShoot && this.isCharging) {
                this.isCharging = false;
                this.chargeTimer = 0;
            }
        } else {
            if (isTryingToShoot && this.shootTimer === 0 && !this.radialMenu.active) {
                const colorDetails = COLOR_DETAILS[this.currentColor];
                const aimDirection = input.mousePos.sub(this.pos);

                for (let i = 0; i < colorDetails.pelletCount; i++) {
                    const spreadAngle = colorDetails.pelletCount > 1
                        ? (i / (colorDetails.pelletCount - 1) - 0.5) * colorDetails.spread
                        : (Math.random() - 0.5) * colorDetails.spread;

                    const finalDirection = aimDirection.rotate(spreadAngle * this.accuracyModifier);
                    const bullet = new Bullet(this.pos, finalDirection, this.currentColor);

                    bullet.vel = finalDirection.normalize().scale(colorDetails.baseSpeed);
                    bullet.damage = colorDetails.baseDamage;
                    bullet.radius = colorDetails.baseRadius;

                    if (colorDetails.pelletCount > 1) {
                        bullet.lifespan *= 0.7;
                    }

                    this.applyBulletUpgrades(bullet);
                    createBullet(bullet);
                }

                this.soundManager.play(SoundType.PlayerShoot);
                this.shootTimer = this.getShootCooldown();
            }
        }
    }

    private drawCollectionRipple(ctx: CanvasRenderingContext2D) {
        const progress = 1 - (this.collectionRippleTimer / this.collectionRippleDuration);
        const radius = this.radius + 40 * progress;
        const alpha = (1 - progress) * 0.8;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.collectionRippleColor;
        ctx.lineWidth = 3 - (progress * 2);
        ctx.shadowColor = this.collectionRippleColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.collectionRippleTimer > 0) {
            this.drawCollectionRipple(ctx);
        }

        if (this.isSlowed) {
            ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 200));
            ctx.fillStyle = `rgba(102, 255, 140, ${0.1 + pulse * 0.2})`;
            ctx.strokeStyle = `rgba(102, 255, 140, ${0.4 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        if (this.adrenalineTimer > 0) {
            ctx.save();
            const rotation = (Date.now() / 1000) % (Math.PI * 2);
            const gradient = ctx.createConicGradient(rotation, this.pos.x, this.pos.y);

            gradient.addColorStop(0, "hsl(0, 100%, 70%)");
            gradient.addColorStop(1 / 7, "hsl(30, 100%, 70%)");
            gradient.addColorStop(2 / 7, "hsl(60, 100%, 70%)");
            gradient.addColorStop(3 / 7, "hsl(120, 100%, 70%)");
            gradient.addColorStop(4 / 7, "hsl(180, 100%, 70%)");
            gradient.addColorStop(5 / 7, "hsl(240, 100%, 70%)");
            gradient.addColorStop(6 / 7, "hsl(270, 100%, 70%)");
            gradient.addColorStop(1, "hsl(0, 100%, 70%)");

            ctx.strokeStyle = gradient;

            const pulse = Math.abs(Math.sin(Date.now() / 150));
            ctx.lineWidth = 2 + pulse * 2;
            ctx.globalAlpha = 0.6 + pulse * 0.3;

            ctx.shadowColor = "white";
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        if (this.kineticShieldHits > 0) {
            ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 200));
            ctx.strokeStyle = `rgba(125, 249, 255, ${0.5 + pulse * 0.5})`;
            ctx.fillStyle = `rgba(125, 249, 255, ${0.1 + pulse * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        }

        if (this.isDashing) {
            ctx.save();
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 20;
            const dashProgress = this.dashTimer / (this.dashDuration * this.dashDurationModifier);
            ctx.fillStyle = `rgba(226, 232, 240, ${0.5 * dashProgress})`;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 5 * (1 - dashProgress), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        const hexColor = COLOR_DETAILS[this.currentColor].hex;
        const gradient = ctx.createRadialGradient(
            this.pos.x, this.pos.y, this.radius * 0.2,
            this.pos.x, this.pos.y, this.radius
        );
        gradient.addColorStop(0, hexColor);
        gradient.addColorStop(0.7, '#E2E8F0');

        ctx.fillStyle = gradient;
        ctx.shadowColor = hexColor;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.isCharging) {
            const chargeRatio = this.chargeTimer / this.maxChargeTime;
            const radius = lerp(this.radius * 0.5, this.radius * 1.5, chargeRatio);
            const alpha = lerp(0.2, 0.7, chargeRatio);

            ctx.save();
            const pulse = Math.abs(Math.sin(Date.now() / 150 + chargeRatio * 5));
            const reticlePos = InputHandler.getInstance().mousePos;
            const aimDir = reticlePos.sub(this.pos).normalize();
            const chargePos = this.pos.add(aimDir.scale(this.radius + 10 + radius/2));

            ctx.fillStyle = hexColor;
            ctx.globalAlpha = alpha + pulse * 0.2;
            ctx.shadowColor = hexColor;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(chargePos.x, chargePos.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.radialMenu.active) {
            this.radialMenu.draw(ctx);
        } else {
            const input = InputHandler.getInstance();
            const aimDir = input.mousePos.sub(this.pos).normalize();
            const reticlePos = this.pos.add(aimDir.scale(this.radius + 10));
            ctx.strokeStyle = COLOR_DETAILS[this.currentColor].hex;
            ctx.lineWidth = 2;
            ctx.save();
            drawShapeForColor(ctx, reticlePos, 10, this.currentColor, COLOR_DETAILS[this.currentColor].hex, true);
            ctx.restore();
        }
    }

    takeDamage(amount: number) {
        if (this.isDashing) return;

        if (this.kineticShieldHits > 0) {
            this.kineticShieldHits--;
            this.soundManager.play(SoundType.EnemyReflect);
            return;
        }

        const reducedAmount = Math.max(1, amount - this.flatDamageReduction);
        this.health -= reducedAmount;
        this.soundManager.play(SoundType.PlayerDamage);

        if (this.adrenalineRushLevel > 0 && this.adrenalineCooldown <= 0) {
            const duration = 120 + this.adrenalineRushLevel * 60;
            this.adrenalineTimer = duration;
            this.adrenalineCooldown = this.ADRENALINE_COOLDOWN_TIME;
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    public applySlow(duration: number) {
        this.isSlowed = true;
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    public addPunishmentMeter() {
        if (this.punishmentReversalLevel === 0) return;
        this.punishmentReversalMeter = Math.min(this.PUNISHMENT_METER_MAX, this.punishmentReversalMeter + 1);
    }

    public tryPunishmentReversal(): number {
        if (this.punishmentReversalLevel > 0 && this.punishmentReversalMeter >= this.PUNISHMENT_METER_MAX) {
            const bonusDamage = 50 * this.punishmentReversalLevel;
            this.punishmentReversalMeter = 0;
            return bonusDamage;
        }
        return 0;
    }

    applyKnockback(from: Vec2, force: number) {
        if (this.isDashing) return;
        const direction = this.pos.sub(from).normalize();
        this.knockbackVelocity = direction.scale(force);
    }

    applyUpgrade(upgrade: Upgrade) {
        this.upgradeManager.apply(upgrade, 1);
    }

    public getMaxHealth(): number {
        return this.maxHealth + this.flatHealthIncrease;
    }

    public getSpeed(): number {
        const adrenalineBonus = this.adrenalineTimer > 0 ? 1 + this.adrenalineRushLevel * 0.12 : 1;
        const slowPenalty = this.isSlowed ? 0.5 : 1;
        return this.baseSpeed * this.movementSpeedMultiplier * adrenalineBonus * slowPenalty;
    }

    public getDashCooldown(): number {
        return Math.round(this.baseDashCooldown * this.dashCooldownModifier);
    }

    public getShootCooldown(): number {
        const baseCooldown = COLOR_DETAILS[this.currentColor].baseCooldown;
        const adrenalineBonus = this.adrenalineTimer > 0 ? 1 - this.adrenalineRushLevel * 0.12 : 1;
        return Math.round(baseCooldown * this.shootCooldownModifier * adrenalineBonus);
    }

    public getBulletSpread(): number {
        return 1.0;
    }
}