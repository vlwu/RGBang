import { BulletComponent } from '../components/BulletComponent.js';

export class BulletSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    update(dt) {
        const entities = this.entityManager.query([BulletComponent]);

        for (const entityId of entities) {
            const bullet = this.entityManager.getComponent(entityId, BulletComponent);
            bullet.lifespan -= dt;

            if (bullet.lifespan <= 0) {
                // The RenderSystem will automatically handle removing the sprite from the stage.
                this.entityManager.destroyEntity(entityId);
            }
        }
    }
}