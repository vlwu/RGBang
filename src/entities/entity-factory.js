import * as PIXI from 'pixi.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export function createPlayer(entityManager, x, y) {
    const player = entityManager.createEntity();

    const playerSpritesheet = PIXI.Assets.get('images/player/mPlayer Human.json');

    const playerSprite = new PIXI.AnimatedSprite(playerSpritesheet.animations.idle);

    playerSprite.anchor.set(0.5);
    playerSprite.scale.set(3);
    playerSprite.x = x;
    playerSprite.y = y;

    playerSprite.animationSpeed = 0.15;
    playerSprite.play();

    entityManager.addComponent(player, new PositionComponent(x, y));
    entityManager.addComponent(player, new VelocityComponent());
    entityManager.addComponent(player, new InputComponent());
    entityManager.addComponent(player, new PlayerComponent('PinkMan')); 
    entityManager.addComponent(player, new RenderableComponent(playerSprite, playerSpritesheet));

    return player;
}