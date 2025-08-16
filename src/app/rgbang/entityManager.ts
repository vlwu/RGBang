import { Bullet } from './bullet';
import { Enemy } from './enemy';
import { Boss } from './boss';
import { PrismFragment } from './prism-fragment';
import { Player } from './player';
import { GameColor } from './color';
import { Vec2, ObjectPool } from './utils';
import { ParticleSystem } from './particle';
import { IActionCallbacks, IVortex } from './types';

export class EntityManager {
    public enemies: Enemy[] = [];
    public bullets: Bullet[] = [];
    public fragments: PrismFragment[] = [];
    public boss: Boss | null = null;
    public bulletPool: ObjectPool<Bullet>;
    private ricochetBulletsOnScreen = 0;
    private readonly MAX_RICOCHET_BULLETS = 30;
    private createVortex: (pos: Vec2, radius: number, strength: number, lifespan: number) => void;

    constructor(
        private particles: ParticleSystem,
        createVortex: (pos: Vec2, radius: number, strength: number, lifespan: number) => void
    ) {
        this.bulletPool = new ObjectPool<Bullet>(() => new Bullet(new Vec2(), new Vec2(), GameColor.RED), 100);
        this.createVortex = createVortex;
    }

    public addEnemy(enemy: Enemy): void {
        enemy.onSplit = (newEnemy) => this.addEnemy(newEnemy);
        this.enemies.push(enemy);
    }

    public addBullet(bullet: Bullet): void {
        if (bullet.isRicochet) {
            if (this.ricochetBulletsOnScreen >= this.MAX_RICOCHET_BULLETS) {
                return;
            }
            this.ricochetBulletsOnScreen++;
        }
        const pooledBullet = this.bulletPool.get();

        pooledBullet.pos.x = bullet.pos.x;
        pooledBullet.pos.y = bullet.pos.y;
        pooledBullet.vel.x = bullet.vel.x;
        pooledBullet.vel.y = bullet.vel.y;
        pooledBullet.radius = bullet.radius;
        pooledBullet.color = bullet.color;
        pooledBullet.hexColor = bullet.hexColor;
        pooledBullet.damage = bullet.damage;
        pooledBullet.isFromBoss = bullet.isFromBoss;
        pooledBullet.lifespan = bullet.lifespan;
        pooledBullet.isRicochet = bullet.isRicochet;
        pooledBullet.penetrationsLeft = bullet.penetrationsLeft;
        pooledBullet.ricochetsLeft = bullet.ricochetsLeft;
        pooledBullet.isSeeking = bullet.isSeeking;
        pooledBullet.isSlowing = bullet.isSlowing;
        pooledBullet.isFission = bullet.isFission;
        pooledBullet.isVoid = bullet.isVoid;
        pooledBullet.isGravityOrb = bullet.isGravityOrb;
        pooledBullet.isEnemyProjectile = bullet.isEnemyProjectile;
        pooledBullet.slowsPlayer = bullet.slowsPlayer;

        this.bullets.push(pooledBullet);
    }

    public addFragment(fragment: PrismFragment): void {
        this.fragments.push(fragment);
    }

    public setBoss(boss: Boss | null): void {
        this.boss = boss;
    }

    public updateAll(
        player: Player,
        canvasWidth: number,
        canvasHeight: number,
        vortexes: IVortex[],
        actionCallbacks: IActionCallbacks
    ): void {
        this.bullets.forEach(bullet => {
            if (bullet.isActive) bullet.update(this.enemies, canvasWidth, canvasHeight);
        });

        this.enemies.forEach(enemy => {
            const newBullet = enemy.update(player, this.enemies, this.particles, vortexes, actionCallbacks);
            if (newBullet) {
                this.addBullet(newBullet);
            }
        });

        this.boss?.update();
        this.fragments.forEach(fragment => fragment.update(player, this.particles));
    }

    public cleanup(canvasWidth: number, canvasHeight: number): void {
        this.enemies.forEach(enemy => {
            if (!enemy.isAlive) {
                this.particles.add(enemy.pos, enemy.color, 30);
                if (enemy.isIgnited) {
                   this.particles.add(enemy.pos, GameColor.RED, 15);
                }
            }
        });

        this.enemies = this.enemies.filter(e => e.isAlive);
        this.fragments = this.fragments.filter(f => f.isAlive);

        const activeBullets: Bullet[] = [];
        for (const bullet of this.bullets) {
            const isOutOfBounds = bullet.pos.x < 0 || bullet.pos.x > canvasWidth || bullet.pos.y < 0 || bullet.pos.y > canvasHeight;

            if (bullet.isActive && (!isOutOfBounds || bullet.ricochetsLeft > 0)) {
                activeBullets.push(bullet);
            } else {
                if (bullet.isGravityOrb && bullet.isActive) {
                    this.createVortex(bullet.pos, 100, 0.4, 240);
                }
                if (bullet.isRicochet) {
                    this.ricochetBulletsOnScreen = Math.max(0, this.ricochetBulletsOnScreen - 1);
                }
                bullet.isActive = false;
                this.bulletPool.release(bullet);
            }
        }
        this.bullets = activeBullets;
    }

    public drawAll(ctx: CanvasRenderingContext2D): void {
        this.boss?.draw(ctx);
        this.enemies.forEach(e => e.draw(ctx));
        this.fragments.forEach(p => p.draw(ctx));
        this.bullets.forEach(b => {
            if (b.isActive) b.draw(ctx);
        });
    }

    public resetForNewWave(): void {
        this.enemies = [];
        this.bullets.forEach(b => { if(b.isActive) this.bulletPool.release(b) });
        this.bullets = [];
        this.fragments = [];
        this.boss = null;
    }

    public getLiveEnemyCount(): number {
        return this.enemies.length;
    }

    public hasActiveFragments(): boolean {
        return this.fragments.length > 0;
    }
}