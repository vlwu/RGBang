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

        // Reset opacity for all static objects
        for (const staticId of staticEntities) {
            const renderable = this.entityManager.getComponent(staticId, RenderableComponent);
            if (renderable && renderable.sprite && renderable.sprite.alpha !== 1.0) {
                renderable.sprite.alpha = 1.0;
            }
        }

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
                    // Collision Response
                    const overlap = combinedRadius - distance;
                    if (distance > 0) {
                        const pushX = (dx / distance) * overlap;
                        const pushY = (dy / distance) * overlap;

                        dynamicPos.x += pushX;
                        dynamicPos.y += pushY;

                        // Update dynamic circle position for subsequent checks
                        dynamicCircle.x += pushX;
                        dynamicCircle.y += pushY;
                    } else {
                        // Handle case where objects are at the exact same position
                        dynamicPos.y += overlap;
                        dynamicCircle.y += overlap;
                    }

                    // Occlusion check
                    if (dynamicPos.y < staticPos.y) {
                        const staticRenderable = this.entityManager.getComponent(staticId, RenderableComponent);
                        if (staticRenderable && staticRenderable.sprite) {
                            staticRenderable.sprite.alpha = this.occlusionAlpha;
                        }
                    }
                }
            }
        }
    }
}