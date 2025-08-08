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

export function createPlayer(entityManager, x, y, characterId, playerSpritesheet, assets, gameState) {
    const player = entityManager.createEntity();

    const playerSprite = new PIXI.AnimatedSprite(playerSpritesheet.animations.idle);
    playerSprite.anchor.set(0.5);
    playerSprite.scale.set(3);
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

    const cooldownBar = entityManager.createEntity();
    entityManager.addComponent(cooldownBar, new PositionComponent(x, y + 45));
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