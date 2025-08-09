import * as PIXI from 'pixi.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CooldownIndicatorComponent } from '../components/CooldownIndicatorComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { WEAPON_CONFIG } from './weapon-definitions.js';
import { BulletComponent } from '../components/BulletComponent.js';
import { BULLET_CONFIG } from './bullet-definitions.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { CollisionComponent } from '../components/CollisionComponent.js';

export function createPlayer(entityManager, x, y, characterId, playerSpritesheet, assets, gameState) {
    const player = entityManager.createEntity();


    if (!playerSpritesheet || !playerSpritesheet.animations) {
        console.error(`Cannot create player: Spritesheet for characterId "${characterId}" is missing or invalid.`);

        entityManager.addComponent(player, new PositionComponent(x, y));
        return player;
    }

    const playerSprite = new PIXI.AnimatedSprite(playerSpritesheet.animations.idle);
    playerSprite.anchor.set(0.5);
    playerSprite.scale.set(2.4);
    playerSprite.x = x;
    playerSprite.y = y;
    playerSprite.animationSpeed = 0.15;
    playerSprite.play();

    const playerComp = new PlayerComponent(characterId, gameState.upgrades.unlocked_weapons);
    const initialWeaponId = playerComp.availableWeapons[playerComp.equippedWeaponIndex];
    const weaponConfig = WEAPON_CONFIG[initialWeaponId];
    const gunTexture = assets.weapons[weaponConfig.assetKey];
    const gunSprite = new PIXI.Sprite(gunTexture);

    gunSprite.anchor.set(0.25, 0.5);
    gunSprite.scale.set(0.5);
    gunSprite.position.set(8, 6);

    playerSprite.addChild(gunSprite);

    entityManager.addComponent(player, new PositionComponent(x, y));
    entityManager.addComponent(player, new VelocityComponent());
    entityManager.addComponent(player, new InputComponent());
    entityManager.addComponent(player, playerComp);
    entityManager.addComponent(player, new RenderableComponent(playerSprite, playerSpritesheet));
    entityManager.addComponent(player, new WeaponComponent(initialWeaponId, gunSprite));
    entityManager.addComponent(player, new HealthComponent(100));
    entityManager.addComponent(player, new CollisionComponent({
        shape: 'circle',
        radius: 12,
        offsetY: 20,
        isDynamic: true,
    }));

    const cooldownBar = entityManager.createEntity();
    entityManager.addComponent(cooldownBar, new CooldownIndicatorComponent(player));

    return player;
}

export function createBullet(entityManager, assets, x, y, angle, bulletId) {
    const bullet = entityManager.createEntity();
    const bulletConfig = BULLET_CONFIG[bulletId];
    const bulletSpritesheet = assets.bullets[bulletConfig.assetKey];

    const bulletSprite = new PIXI.AnimatedSprite(bulletSpritesheet.animations[bulletConfig.animationName]);
    bulletSprite.anchor.set(0.5);
    bulletSprite.rotation = angle;
    bulletSprite.scale.set(2);
    bulletSprite.animationSpeed = 0.2;
    bulletSprite.play();

    if (Math.abs(angle) > Math.PI / 2) {
        bulletSprite.scale.y *= -1;
    }

    const vx = Math.cos(angle) * bulletConfig.speed;
    const vy = Math.sin(angle) * bulletConfig.speed;

    entityManager.addComponent(bullet, new PositionComponent(x, y));
    entityManager.addComponent(bullet, new VelocityComponent(vx, vy));
    entityManager.addComponent(bullet, new RenderableComponent(bulletSprite));
    entityManager.addComponent(bullet, new BulletComponent(bulletConfig.lifespan));

    return bullet;
}

function getProperty(tiledObject, propertyName, defaultValue = null) {
    if (!tiledObject.properties) {
        return defaultValue;
    }
    const prop = tiledObject.properties.find(p => p.name === propertyName);
    return prop ? prop.value : defaultValue;
}

export function createGameObjectFromTiled(entityManager, tiledObject, texture, assets) {
    const entity = entityManager.createEntity();


    const anchorX = getProperty(tiledObject, 'anchorX', 0.5);
    const anchorY = getProperty(tiledObject, 'anchorY', 1.0);
    const type = getProperty(tiledObject, 'type', 'default');


    const sprite = new PIXI.Sprite(texture);


    sprite.anchor.set(anchorX, anchorY);

    const scale = 3.0;
    sprite.scale.set(scale);

    entityManager.addComponent(entity, new PositionComponent(tiledObject.x, tiledObject.y));
    entityManager.addComponent(entity, new RenderableComponent(sprite));

    if (type === 'Tree') {
        const firstgid = 1;
        const tileId = tiledObject.gid - firstgid;
        const collisionData = assets.gameObjectCollisionData.get(tileId);

        if (collisionData) {
            const imageWidth = texture.width;
            const imageHeight = texture.height;

            const anchorPixelX = imageWidth * anchorX;
            const anchorPixelY = imageHeight * anchorY;

            let collisionCenterX;
            let collisionCenterY;
            if (collisionData.isEllipse) {
                collisionCenterX = collisionData.x + collisionData.width / 2;
                collisionCenterY = collisionData.y + collisionData.height / 2;
            } else {
                collisionCenterX = collisionData.x + collisionData.width / 2;
                collisionCenterY = collisionData.y + collisionData.height / 2;
            }

            const offsetX = (collisionCenterX - anchorPixelX) * scale;
            const offsetY = (collisionCenterY - anchorPixelY) * scale;

            const radius = ((collisionData.width + collisionData.height) / 4) * scale;

            entityManager.addComponent(entity, new CollisionComponent({
                shape: 'circle',
                radius: radius,
                offsetX: offsetX,
                offsetY: offsetY,
                isDynamic: false,
            }));
        } else {
            entityManager.addComponent(entity, new CollisionComponent({
                shape: 'circle',
                radius: 24,
                offsetY: -50,
                isDynamic: false,
            }));
        }
    }

    return entity;
}