import * as PIXI from 'pixi.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export function createPlayer(entityManager, x, y) {
    const player = entityManager.createEntity();

    // Create a sprite from the loaded texture
    const playerTexture = PIXI.Assets.get('images/player/player.png');
    const playerSprite = new PIXI.Sprite(playerTexture);
    playerSprite.anchor.set(0.5); // Set the origin to the center
    playerSprite.x = x;
    playerSprite.y = y;

    entityManager.addComponent(player, new PositionComponent(x, y));
    entityManager.addComponent(player, new VelocityComponent());
    entityManager.addComponent(player, new InputComponent());
    entityManager.addComponent(player, new PlayerComponent());
    entityManager.addComponent(player, new RenderableComponent(playerSprite));

    return player;
}