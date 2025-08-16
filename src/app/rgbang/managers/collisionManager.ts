import { Player } from '../entities/player';
import { Bullet } from '../entities/bullet';
import { Enemy, PunishmentType } from '../entities/enemy';
import { Boss } from '../entities/boss';
import { ParticleSystem } from '../entities/particle';
import { circleCollision, Vec2, distance, Quadtree, QuadtreeObject } from '../common/utils';
import { GameColor, COLOR_DETAILS } from '../data/color';
import { PrismFragment } from '../entities/prism-fragment';
import { SoundManager, SoundType } from './sound-manager';
import { EntityManager } from './entityManager';
import { gameStateStore } from '../core/gameStateStore';
import { WaveManager } from './waveManager';
import { SandboxManager } from './sandboxManager';
import { Game } from '../core/game';

interface CollisionManagerDependencies {
    game: Game;
    player: Player;
    entityManager: EntityManager;
    quadtree: Quadtree;
    particles: ParticleSystem;
    soundManager: SoundManager;
    gameMode: 'normal' | 'freeplay';
    dealAreaDamage: (pos: Vec2, radius: number, damage: number, color: GameColor) => void;
    createBullet: (bullet: Bullet) => void;
    addScore: (amount: number) => void;
    waveManager: WaveManager;
    sandboxManager: SandboxManager | null;
}

export class CollisionManager {
    private game: Game;
    private player: Player;
    private entityManager: EntityManager;
    private quadtree: Quadtree;
    private particles: ParticleSystem;
    private soundManager: SoundManager;
    private gameMode: 'normal' | 'freeplay';
    private dealAreaDamage: (pos: Vec2, radius: number, damage: number, color: GameColor) => void;
    private createBullet: (bullet: Bullet) => void;
    private addScore: (amount: number) => void;
    private waveManager: WaveManager;
    private sandboxManager: SandboxManager | null;

    constructor(deps: CollisionManagerDependencies) {
        this.game = deps.game;
        this.player = deps.player;
        this.entityManager = deps.entityManager;
        this.quadtree = deps.quadtree;
        this.particles = deps.particles;
        this.soundManager = deps.soundManager;
        this.gameMode = deps.gameMode;
        this.dealAreaDamage = deps.dealAreaDamage;
        this.createBullet = deps.createBullet;
        this.addScore = deps.addScore;
        this.waveManager = deps.waveManager;
        this.sandboxManager = deps.sandboxManager;
    }

    public checkCollisions() {

        for (const bullet of this.entityManager.bullets) {
            if (!bullet.isActive) continue;

            if (bullet.isFromBoss || bullet.isEnemyProjectile) {
                if (this.player.isAlive && circleCollision(bullet, this.player)) {
                    if (this.gameMode === 'normal' || (this.sandboxManager?.isPlayerCollisionEnabled)) {
                        this.player.takeDamage(bullet.damage);
                        if (bullet.slowsPlayer) {
                            this.player.applySlow(180);
                        }
                    }
                    this.particles.add(bullet.pos, bullet.color, 10);
                    bullet.isActive = false;
                }
                continue;
            }

            const potentialColliders = this.quadtree.query({
                x: bullet.pos.x,
                y: bullet.pos.y,
                width: bullet.radius * 2,
                height: bullet.radius * 2
            });

            for (const quadObj of potentialColliders) {
                const enemy = quadObj.entity as Enemy;
                if (!enemy.isAlive || bullet.hitEnemies.has(enemy)) continue;

                if (circleCollision(bullet, enemy)) {
                    if (bullet.penetrationsLeft <= 0) {
                        bullet.isActive = false;
                    } else {
                        bullet.penetrationsLeft--;
                    }
                    bullet.hitEnemies.add(enemy);

                    let damageToDeal = bullet.damage;
                    const reversalDamage = this.player.tryPunishmentReversal();
                    if (reversalDamage > 0) {
                        damageToDeal += reversalDamage;
                        this.particles.add(this.player.pos, GameColor.YELLOW, 30);
                    }
                    const result = enemy.takeDamage(damageToDeal, bullet.color);

                    if (result.hit) {
                        this.soundManager.play(SoundType.EnemyHit);
                        this.applySpecialEffects(bullet, enemy);
                        if (this.player.lifestealPercent > 0) {
                            this.player.heal(result.damageDealt * this.player.lifestealPercent);
                        }
                        if (bullet.isFission && (Math.random() < 0.25 + this.player.fissionLevel * 0.15)) {
                            const [c1, c2] = COLOR_DETAILS[bullet.color].components!;
                            const dir1 = new Vec2(Math.random() - 0.5, Math.random() - 0.5);
                            const dir2 = new Vec2(Math.random() - 0.5, Math.random() - 0.5);
                            this.createBullet(new Bullet(enemy.pos, dir1, c1));
                            this.createBullet(new Bullet(enemy.pos, dir2, c2));
                        }
                    } else {
                        this.player.addPunishmentMeter();
                        if (enemy.activePunishment === PunishmentType.REFLECT_BULLET) {
                            this.soundManager.play(SoundType.EnemyReflect, 0.7);
                            const reflectedDirection = this.player.pos.sub(bullet.pos).normalize();
                            this.createBullet(new Bullet(enemy.pos, reflectedDirection, bullet.color, true));
                        }
                    }

                    if (result.killed) {
                        this.addScore(enemy.points * this.player.scoreMultiplier);
                        this.entityManager.addFragment(new PrismFragment(enemy.pos.x, enemy.pos.y, enemy.color));
                        if (this.player.fragmentDuplicationChance > 0 && Math.random() < this.player.fragmentDuplicationChance) {
                             this.entityManager.addFragment(new PrismFragment(enemy.pos.x + 10, enemy.pos.y, enemy.color));
                        }
                        if (this.player.explosiveFinishLevel > 0 && Math.random() < this.player.explosiveFinishLevel * 0.08) {
                            this.dealAreaDamage(enemy.pos, 40 + this.player.explosiveFinishLevel * 8, 8 + this.player.explosiveFinishLevel * 4, enemy.color);
                        }
                    }

                    this.particles.add(bullet.pos, bullet.color, 10);
                    if(!bullet.isActive) break;
                }
            }
            if (!bullet.isActive) continue;

            const boss = this.entityManager.boss;
            if (boss && boss.isAlive && circleCollision(bullet, boss)) {
                this.particles.add(bullet.pos, bullet.color, 15);
                boss.takeDamage(bullet.damage, bullet.color);
                bullet.isActive = false;
            }
        }


        if (this.player.isDashing && this.player.dashDamageLevel > 0) {
            for (const enemy of this.entityManager.enemies) {
                if (enemy.isAlive && !this.player.enemiesHitThisDash.has(enemy) && circleCollision(this.player, enemy)) {
                    this.player.enemiesHitThisDash.add(enemy);
                    const damage = 15 * this.player.dashDamageLevel;
                    const result = enemy.takeDamage(damage, this.player.currentColor, true);
                    this.particles.add(enemy.pos, this.player.currentColor, 15);
                    this.soundManager.play(SoundType.EnemyHit, 0.8);

                    if (result.killed) {
                        this.addScore(enemy.points * this.player.scoreMultiplier);
                        this.entityManager.addFragment(new PrismFragment(enemy.pos.x, enemy.pos.y, enemy.color));
                        if (this.player.fragmentDuplicationChance > 0 && Math.random() < this.player.fragmentDuplicationChance) {
                             this.entityManager.addFragment(new PrismFragment(enemy.pos.x + 10, enemy.pos.y, enemy.color));
                        }
                        if (this.player.explosiveFinishLevel > 0 && Math.random() < this.player.explosiveFinishLevel * 0.08) {
                            this.dealAreaDamage(enemy.pos, 40 + this.player.explosiveFinishLevel * 8, 8 + this.player.explosiveFinishLevel * 4, enemy.color);
                        }
                    }
                }
            }
        } else {
            for (const enemy of this.entityManager.enemies) {
                if (enemy.isAlive && this.player.isAlive && circleCollision(this.player, enemy)) {
                    if (this.gameMode === 'normal' || (this.sandboxManager?.isPlayerCollisionEnabled)) {
                        this.player.takeDamage(enemy.damage);
                        this.player.applyKnockback(enemy.pos, 10);
                    }
                    enemy.takeDamage(enemy.health * 0.5, enemy.color, true);
                    this.particles.add(enemy.pos, enemy.color, 10);
                }
            }
        }


        const boss = this.entityManager.boss;
        if (boss && boss.isAlive && this.player.isAlive && circleCollision(this.player, boss)) {
            if (this.gameMode === 'normal' || (this.sandboxManager?.isPlayerCollisionEnabled)) {
                this.player.takeDamage(boss.damage);
                this.player.applyKnockback(boss.pos, 15);
            }
        }


        for (let i = this.entityManager.fragments.length - 1; i >= 0; i--) {
            const fragment = this.entityManager.fragments[i];
            if (fragment.isAlive && this.player.isAlive && circleCollision(this.player, fragment)) {
                this.soundManager.play(SoundType.FragmentCollect);
                const currentState = gameStateStore.getSnapshot();
                gameStateStore.updateState({
                    lastFragmentCollected: fragment.color || 'special',
                    fragmentCollectCount: currentState.fragmentCollectCount + 1,
                });
                if (this.gameMode !== 'freeplay') {
                    this.waveManager.onFragmentCollected();
                }
                this.particles.addPickupEffect(fragment.pos, fragment.color);
                this.player.triggerCollectionEffect(fragment.color);
                fragment.isAlive = false;
            }
        }


        for (const enemy1 of this.entityManager.enemies) {
            if (!enemy1.isAlive) continue;

            const queryBounds = {
                x: enemy1.pos.x, y: enemy1.pos.y,
                width: enemy1.radius * 2, height: enemy1.radius * 2
            };

            const potentialColliders = this.quadtree.query(queryBounds);

            for (const quadObj of potentialColliders) {
                const enemy2 = quadObj.entity as Enemy;

                if (!enemy2.isAlive || enemy1.id >= enemy2.id) {
                    continue;
                }

                if (circleCollision(enemy1, enemy2)) {
                    this.resolveEnemyCollision(enemy1, enemy2);
                }
            }
        }
    }

    private applySpecialEffects(bullet: Bullet, enemy: Enemy) {
        if (bullet.isVoid) {
            enemy.applyVoid(120 + this.player.voidLevel * 60);
        }
        if (bullet.isSlowing) {
            const slowDuration = 120 + this.player.slowingTrailLevel * 30;
            const slowRadius = 50 + this.player.slowingTrailLevel * 10;
            this.game.createSlowField(enemy.pos, slowRadius, slowDuration);
        }
        if (bullet.isGravityOrb) {
            const radius = 60 + this.player.gravityWellLevel * 15;
            const strength = 0.3 + this.player.gravityWellLevel * 0.1;
            this.game.createVortex(enemy.pos, radius, strength, 120);
        }
        if (bullet.color === GameColor.RED) {
            const igniteDamage = 1 + this.player.igniteLevel;
            const igniteDuration = 120 + this.player.igniteLevel * 30;
            enemy.applyIgnite(igniteDamage, igniteDuration);
        }
        if (bullet.color === GameColor.BLUE) {
            const freezeDuration = 60 + this.player.iceSpikerLevel * 15;
            enemy.applyFreeze(freezeDuration);
        }
        if (bullet.color === GameColor.YELLOW) {
            const chainRange = 100 + this.player.chainLightningLevel * 20;
            const maxChains = 1 + this.player.chainLightningLevel;
            const chainDamage = 5 + this.player.chainLightningLevel;
            enemy.triggerChainLightning(maxChains, chainDamage, chainRange);
        }
    }

    private resolveEnemyCollision(enemy1: Enemy, enemy2: Enemy) {
        const distVec = enemy1.pos.sub(enemy2.pos);
        const dist = distVec.magnitude();
        const overlap = (enemy1.radius + enemy2.radius) - dist;

        if (overlap > 0) {
            const resolveVec = dist > 0 ? distVec.normalize().scale(overlap / 2) : new Vec2(0.1, 0);
            enemy1.pos.addInPlace(resolveVec);
            enemy2.pos.subInPlace(resolveVec);
        }
    }
}