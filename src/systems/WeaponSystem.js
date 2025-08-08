import { PlayerComponent } from '../components/PlayerComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { WEAPON_CONFIG } from '../entities/weapon-definitions.js';

export class WeaponSystem {
    constructor(entityManager, stage, assets) {
        this.entityManager = entityManager;
        this.mousePosition = { x: 0, y: 0 };
        this.assets = assets;

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
            let worldAngle = Math.atan2(
                this.mousePosition.y - gunGlobalPos.y,
                this.mousePosition.x - gunGlobalPos.x
            );

            const rotationLimit = (80 * Math.PI) / 180; // 80 degrees in radians
            let finalRotation = 0;

            if (player.facingDirection === 'right') {
                const clampedAngle = Math.max(-rotationLimit, Math.min(worldAngle, rotationLimit));
                finalRotation = clampedAngle;
            } else { // facing 'left'
                const forbiddenZoneLimit = Math.PI - rotationLimit; // 100 degrees
                let clampedAngle = worldAngle;

                if (Math.abs(worldAngle) < forbiddenZoneLimit) {
                    clampedAngle = worldAngle >= 0 ? forbiddenZoneLimit : -forbiddenZoneLimit;
                }
                
                // This transform corrects the rotation for the flipped parent sprite
                finalRotation = Math.PI - clampedAngle;
            }
            
            gunSprite.rotation = finalRotation;


            // Weapon Switching Logic
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