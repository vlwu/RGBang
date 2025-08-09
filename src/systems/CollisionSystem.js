import { CollisionComponent } from '../components/CollisionComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class CollisionSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.occlusionAlpha = 0.7;
    }

    update() {
        const collidables = this.entityManager.query([PositionComponent, CollisionComponent]);
        const dynamicEntities = [];
        const staticEntities = [];

        for (const id of collidables) {
            if (this.entityManager.getComponent(id, CollisionComponent).isDynamic) {
                dynamicEntities.push(id);
            } else {
                staticEntities.push(id);
            }
        }

        // Reset all static entities to be opaque at the start of the frame.
        for (const staticId of staticEntities) {
            const renderable = this.entityManager.getComponent(staticId, RenderableComponent);
            if (renderable && renderable.sprite) {
                renderable.sprite.alpha = 1.0;
            }
        }

        // Process collisions and occlusions.
        for (const dynamicId of dynamicEntities) {
            const dynamicPos = this.entityManager.getComponent(dynamicId, PositionComponent);
            const dynamicCollision = this.entityManager.getComponent(dynamicId, CollisionComponent);

            const dynamicCircle = {
                x: dynamicPos.x + dynamicCollision.offsetX,
                y: dynamicPos.y + dynamicCollision.offsetY,
                radius: dynamicCollision.radius
            };

            for (const staticId of staticEntities) {
                const staticPos = this.entityManager.getComponent(staticId, PositionComponent);
                const staticCollision = this.entityManager.getComponent(staticId, CollisionComponent);

                // --- Collision Check ---
                const staticCircle = {
                    x: staticPos.x + staticCollision.offsetX,
                    y: staticPos.y + staticCollision.offsetY,
                    radius: staticCollision.radius
                };

                const dx = dynamicCircle.x - staticCircle.x;
                const dy = dynamicCircle.y - staticCircle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const combinedRadius = dynamicCircle.radius + staticCircle.radius;

                if (distance < combinedRadius) {
                    const overlap = combinedRadius - distance;
                    if (distance > 0) {
                        const pushX = (dx / distance) * overlap;
                        const pushY = (dy / distance) * overlap;

                        dynamicPos.x += pushX;
                        dynamicPos.y += pushY;
                    } else {
                        dynamicPos.y += overlap;
                    }
                }
                
                // --- Occlusion Check ---
                // If the player is behind an object, make it translucent.
                // This check is independent of collision.
                const staticRenderable = this.entityManager.getComponent(staticId, RenderableComponent);
                if (staticRenderable && staticRenderable.sprite) {
                     const isPlayerBehind = dynamicPos.y < staticPos.y;
                     const isHorizontallyClose = Math.abs(dynamicPos.x - staticPos.x) < (staticRenderable.sprite.width * staticRenderable.sprite.scale.x) / 2;

                     if (isPlayerBehind && isHorizontallyClose) {
                        staticRenderable.sprite.alpha = this.occlusionAlpha;
                     }
                }
            }
        }
    }
}