import { PositionComponent } from '../components/PositionComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { PLAYER_CONSTANTS } from '../utils/constants.js';

export class MovementSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    update(dt) {
        const entities = this.entityManager.query([PlayerComponent, PositionComponent, VelocityComponent, InputComponent]);
        for (const entity of entities) {
            const pos = this.entityManager.getComponent(entity, PositionComponent);
            const vel = this.entityManager.getComponent(entity, VelocityComponent);
            const input = this.entityManager.getComponent(entity, InputComponent);

            // Reset velocity
            vel.vx = 0;
            vel.vy = 0;

            // Apply input to velocity
            if (input.left) vel.vx -= PLAYER_CONSTANTS.SPEED;
            if (input.right) vel.vx += PLAYER_CONSTANTS.SPEED;
            if (input.up) vel.vy -= PLAYER_CONSTANTS.SPEED;
            if (input.down) vel.vy += PLAYER_CONSTANTS.SPEED;

            // Normalize diagonal movement
            if (vel.vx !== 0 && vel.vy !== 0) {
                vel.vx *= 0.7071; // 1 / sqrt(2)
                vel.vy *= 0.7071;
            }

            // Update position based on velocity
            pos.x += vel.vx * dt;
            pos.y += vel.vy * dt;
        }
    }
}