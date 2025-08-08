import { PlayerComponent } from '../components/PlayerComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { WEAPON_CONFIG } from '../entities/weapon-definitions.js';
import { createBullet } from '../entities/entity-factory.js';
import * as PIXI from 'pixi.js';

export class WeaponSystem {
    constructor(entityManager, stage, assets) {
        this.entityManager = entityManager;
        this.mousePosition = { x: 0, y: 0 };
        this.assets = assets;
        this.stage = stage;

        stage.interactive = true;
        stage.on('pointermove', this.onPointerMove, this);
    }

    onPointerMove(event) {
        this.mousePosition = event.global;
    }

    update(dt) {
        const entities = this.entityManager.query([PlayerComponent, WeaponComponent, PositionComponent, InputComponent]);

        for (const entity of entities) {
            const player = this.entityManager.getComponent(entity, PlayerComponent);
            const weapon = this.entityManager.getComponent(entity, WeaponComponent);
            const pos = this.entityManager.getComponent(entity, PositionComponent);
            const input = this.entityManager.getComponent(entity, InputComponent);
            const gunSprite = weapon.gunSprite;

            if (!gunSprite || !gunSprite.visible) continue;

            const gunGlobalPos = gunSprite.getGlobalPosition();
            const worldAngle = Math.atan2(
                this.mousePosition.y - gunGlobalPos.y,
                this.mousePosition.x - gunGlobalPos.x
            );

            const rotationLimit = (80 * Math.PI) / 180;
            let clampedWorldAngle = worldAngle;

            if (player.facingDirection === 'right') {
                clampedWorldAngle = Math.max(-rotationLimit, Math.min(worldAngle, rotationLimit));
                gunSprite.rotation = clampedWorldAngle;
            } else {
                const forbiddenZoneLimit = Math.PI - rotationLimit;
                if (Math.abs(worldAngle) < forbiddenZoneLimit) {
                    clampedWorldAngle = worldAngle >= 0 ? forbiddenZoneLimit : -forbiddenZoneLimit;
                }
                gunSprite.rotation = Math.PI - clampedWorldAngle;
            }


            if (weapon.fireCooldown > 0) {
                weapon.fireCooldown -= dt;
            }

            if (input.shoot && weapon.fireCooldown <= 0) {
                const weaponConfig = WEAPON_CONFIG[weapon.currentWeaponId];
                weapon.fireCooldown = weaponConfig.fireRate;


                const muzzleOffset = 25;
                const spawnScreenX = gunGlobalPos.x + muzzleOffset * Math.cos(clampedWorldAngle);
                const spawnScreenY = gunGlobalPos.y + muzzleOffset * Math.sin(clampedWorldAngle);

                const worldSpawnPoint = this.stage.toLocal(new PIXI.Point(spawnScreenX, spawnScreenY));

                createBullet(this.entityManager, this.assets, worldSpawnPoint.x, worldSpawnPoint.y, clampedWorldAngle, weaponConfig.bulletType);
            }


            const switchMap = {
                switchWeapon1: 0,
                switchWeapon2: 1,
                switchWeapon3: 2,
            };

            for (const key in switchMap) {
                if (input[key] && player.equippedWeaponIndex !== switchMap[key]) {
                    player.equippedWeaponIndex = switchMap[key];
                    const newWeaponId = player.availableWeapons[player.equippedWeaponIndex];
                    const newWeaponConfig = WEAPON_CONFIG[newWeaponId];

                    weapon.currentWeaponId = newWeaponId;
                    gunSprite.texture = this.assets.weapons[newWeaponConfig.assetKey];
                    break;
                }
            }
        }
    }
}