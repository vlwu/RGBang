import { PositionComponent } from '../components/PositionComponent.js';

export class CameraSystem {
    constructor(entityManager, worldContainer, screen, playerId) {
        this.entityManager = entityManager;
        this.worldContainer = worldContainer;
        this.screen = screen;
        this.playerId = playerId;
    }

    update(dt) {
        if (this.playerId === null || !this.entityManager.entities.has(this.playerId)) {
            return;
        }

        const playerPos = this.entityManager.getComponent(this.playerId, PositionComponent);

        if (playerPos) {
            const screenCenterX = this.screen.width / 2;
            const screenCenterY = this.screen.height / 2;

            this.worldContainer.x = screenCenterX - playerPos.x;
            this.worldContainer.y = screenCenterY - playerPos.y;
        }
    }
}