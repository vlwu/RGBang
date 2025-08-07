import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class MovementSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    update(dt) {
        const entities = this.entityManager.query([PlayerComponent, PositionComponent, VelocityComponent, InputComponent, RenderableComponent]);
        for (const entity of entities) {
            const pos = this.entityManager.getComponent(entity, PositionComponent);
            const vel = this.entityManager.getComponent(entity, VelocityComponent);
            const input = this.entityManager.getComponent(entity, InputComponent);
            const player = this.entityManager.getComponent(entity, PlayerComponent);
            const renderable = this.entityManager.getComponent(entity, RenderableComponent);
            const sprite = renderable.sprite;
            const spritesheet = renderable.spritesheet; // Get the spritesheet data from the component

            // 1. Calculate Velocity from Input
            vel.vx = 0;
            vel.vy = 0;
            if (!player.isTurning) { // Prevent movement while turning
                if (input.left) vel.vx -= PLAYER_CONSTANTS.SPEED;
                if (input.right) vel.vx += PLAYER_CONSTANTS.SPEED;
                if (input.up) vel.vy -= PLAYER_CONSTANTS.SPEED;
                if (input.down) vel.vy += PLAYER_CONSTANTS.SPEED;

                if (vel.vx !== 0 && vel.vy !== 0) {
                    vel.vx *= 0.7071; // Normalize diagonal movement
                    vel.vy *= 0.7071;
                }
            }

            // 2. Handle Turning Animation
            const intendedDirection = input.right ? 'right' : (input.left ? 'left' : player.facingDirection);
            if (!player.isTurning && intendedDirection !== player.facingDirection) {
                player.isTurning = true;
                player.state = 'turning';

                sprite.textures = spritesheet.animations.turn;
                sprite.animationSpeed = 0.7;
                sprite.loop = false;
                sprite.play();

                sprite.onComplete = () => {
                    player.facingDirection = intendedDirection;
                    sprite.scale.x = (player.facingDirection === 'right' ? 1 : -1) * Math.abs(sprite.scale.x);
                    player.isTurning = false;
                    sprite.onComplete = null;
                };
            }

            // 3. Handle Idle/Run Animation (only if not turning)
            if (!player.isTurning) {
                const isMoving = vel.vx !== 0 || vel.vy !== 0;

                if (isMoving && player.state !== 'run') {
                    player.state = 'run';
                    sprite.textures = spritesheet.animations.run;
                    sprite.animationSpeed = 0.2;
                    sprite.loop = true;
                    sprite.play();
                } else if (!isMoving && player.state !== 'idle') {
                    player.state = 'idle';
                    sprite.textures = spritesheet.animations.idle;
                    sprite.animationSpeed = 0.1;
                    sprite.loop = true;
                    sprite.play();
                }
            }
            
            // 4. Update Position
            pos.x += vel.vx * dt;
            pos.y += vel.vy * dt;
        }
    }
}