import * as PIXI from 'pixi.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export function createPlayer(entityManager, x, y) {
    const player = entityManager.createEntity();

    // Get the spritesheet data we loaded
    const playerSpritesheet = PIXI.Assets.get('images/player/mPlayer Human.json');

    // Create an AnimatedSprite using the frames from the "idle" animation
    const playerSprite = new PIXI.AnimatedSprite(playerSpritesheet.animations.idle);

    // Configure the sprite
    playerSprite.anchor.set(0.5); // Set the origin to the center
    playerSprite.scale.set(1);   // Make the player 3x larger
    playerSprite.x = x;
    playerSprite.y = y;

    // Configure and start the animation
    playerSprite.animationSpeed = 0.1; 
    playerSprite.play();

    entityManager.addComponent(player, new PositionComponent(x, y));
    entityManager.addComponent(player, new VelocityComponent());
    entityManager.addComponent(player, new InputComponent());
    entityManager.addComponent(player, new PlayerComponent());
    entityManager.addComponent(player, new RenderableComponent(playerSprite));

    return player;
}