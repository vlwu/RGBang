import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { WeaponComponent } from '../components/WeaponComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class MovementSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    update(dt) {

        const movingEntities = this.entityManager.query([PositionComponent, VelocityComponent]);
        for (const entity of movingEntities) {
            const pos = this.entityManager.getComponent(entity, PositionComponent);
            const vel = this.entityManager.getComponent(entity, VelocityComponent);
            pos.x += vel.vx * dt;
            pos.y += vel.vy * dt;
        }


        const playerEntities = this.entityManager.query([PlayerComponent, PositionComponent, VelocityComponent, InputComponent, RenderableComponent, WeaponComponent]);
        for (const entity of playerEntities) {
            const pos = this.entityManager.getComponent(entity, PositionComponent);
            const vel = this.entityManager.getComponent(entity, VelocityComponent);
            const input = this.entityManager.getComponent(entity, InputComponent);
            const player = this.entityManager.getComponent(entity, PlayerComponent);
            const renderable = this.entityManager.getComponent(entity, RenderableComponent);
            const weapon = this.entityManager.getComponent(entity, WeaponComponent);
            const sprite = renderable.sprite;
            const spritesheet = renderable.spritesheet;
            const gunSprite = weapon.gunSprite;

            if (player.rollCooldown > 0) {
                player.rollCooldown = Math.max(0, player.rollCooldown - dt);
            }

            if (input.roll && !player.isRolling && !player.isTurning && player.rollCooldown === 0) {
                player.isRolling = true;
                player.state = 'roll';
                player.rollCooldown = 3.0;

                let dx = 0;
                let dy = 0;
                if (input.up) dy = -1;
                if (input.down) dy = 1;
                if (input.left) dx = -1;
                if (input.right) dx = 1;

                if (dx === 0 && dy === 0) {
                    dx = player.facingDirection === 'right' ? 1 : -1;
                }

                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    player.rollDirectionX = dx / len;
                    player.rollDirectionY = dy / len;
                }


                sprite.textures = spritesheet.animations.roll;
                sprite.animationSpeed = 0.25;
                sprite.loop = false;
                sprite.play();

                sprite.onComplete = () => {
                    player.isRolling = false;
                    sprite.onComplete = null;
                };
            }


            vel.vx = 0;
            vel.vy = 0;

            if (player.isRolling) {
                vel.vx = player.rollDirectionX * PLAYER_CONSTANTS.ROLL_SPEED;
                vel.vy = player.rollDirectionY * PLAYER_CONSTANTS.ROLL_SPEED;
            } else {
                if (input.left) vel.vx -= PLAYER_CONSTANTS.SPEED;
                if (input.right) vel.vx += PLAYER_CONSTANTS.SPEED;
                if (input.up) vel.vy -= PLAYER_CONSTANTS.SPEED;
                if (input.down) vel.vy += PLAYER_CONSTANTS.SPEED;

                if (vel.vx !== 0 && vel.vy !== 0) {
                    vel.vx *= 0.7071;
                    vel.vy *= 0.7071;
                }
            }


            const intendedDirection = input.right ? 'right' : (input.left ? 'left' : player.facingDirection);
            if (!player.isTurning && !player.isRolling && intendedDirection !== player.facingDirection) {
                player.facingDirection = intendedDirection;
                player.isTurning = true;
                player.state = 'turning';
                if (gunSprite) gunSprite.visible = false;

                sprite.textures = spritesheet.animations.turn;
                sprite.animationSpeed = 0.7;
                sprite.loop = false;
                sprite.play();

                sprite.onComplete = () => {
                    sprite.scale.x = (player.facingDirection === 'right' ? 1 : -1) * Math.abs(sprite.scale.x);

                    if (gunSprite) {
                        gunSprite.visible = true;
                    }

                    player.isTurning = false;
                    sprite.onComplete = null;
                };
            }


            if (!player.isTurning && !player.isRolling) {
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
        }
    }
}