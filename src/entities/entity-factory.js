import * as PIXI from 'pixi.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CooldownIndicatorComponent } from '../components/CooldownIndicatorComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { WEAPON_CONFIG } from './weapon-definitions.js';

export function createPlayer(entityManager, x, y, characterId, playerSpritesheet, assets) {
    const player = entityManager.createEntity();

    const playerSprite = new PIXI.AnimatedSprite(playerSpritesheet.animations.idle);
    playerSprite.anchor.set(0.5);
    playerSprite.scale.set(3);
    playerSprite.x = x;
    playerSprite.y = y;
    playerSprite.animationSpeed = 0.15;
    playerSprite.play();

    // Create and attach the weapon
    const playerComp = new PlayerComponent(characterId);
    const initialWeaponId = playerComp.availableWeapons[playerComp.equippedWeaponIndex];
    const weaponConfig = WEAPON_CONFIG[initialWeaponId];
    const gunTexture = assets.weapons[weaponConfig.assetKey];
    const gunSprite = new PIXI.Sprite(gunTexture);

    gunSprite.anchor.set(0.25, 0.5); // Anchor where the handle is
    gunSprite.scale.set(0.5); // Gun scale is independent of player sprite scale
    gunSprite.position.set(8, 6); // Offset slightly from player center
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