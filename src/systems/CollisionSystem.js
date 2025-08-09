import { CollisionComponent } from '../components/CollisionComponent.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class CollisionSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.occlusionAlpha = 0.5;
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


        for (const staticId of staticEntities) {
            const renderable = this.entityManager.getComponent(staticId, RenderableComponent);
            if (renderable && renderable.sprite) {
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

                if (staticCollision.shape === 'circle') {
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
                } else if (staticCollision.shape === 'box') {
                    const staticBox = {
                        x: staticPos.x + staticCollision.offsetX - staticCollision.width / 2,
                        y: staticPos.y + staticCollision.offsetY - staticCollision.height / 2,
                        width: staticCollision.width,
                        height: staticCollision.height
                    };

                    const closestX = Math.max(staticBox.x, Math.min(dynamicCircle.x, staticBox.x + staticBox.width));
                    const closestY = Math.max(staticBox.y, Math.min(dynamicCircle.y, staticBox.y + staticBox.height));

                    const dx = dynamicCircle.x - closestX;
                    const dy = dynamicCircle.y - closestY;
                    const distanceSq = dx * dx + dy * dy;

                    if (distanceSq < dynamicCircle.radius * dynamicCircle.radius) {
                        if (distanceSq === 0) {
                            dynamicPos.y += dynamicCircle.radius;
                        } else {
                            const distance = Math.sqrt(distanceSq);
                            const overlap = dynamicCircle.radius - distance;
                            dynamicPos.x += (dx / distance) * overlap;
                            dynamicPos.y += (dy / distance) * overlap;
                        }
                    }
                }

                const staticRenderable = this.entityManager.getComponent(staticId, RenderableComponent);
                if (staticRenderable && staticRenderable.sprite) {
                     const isPlayerBehind = dynamicPos.y < staticPos.y;


                     const isHorizontallyClose = Math.abs(dynamicCircle.x - (staticPos.x + staticCollision.offsetX)) < (staticCollision.radius || staticCollision.width / 2) * 1.5;

                     if (isPlayerBehind && isHorizontallyClose) {
                        staticRenderable.sprite.alpha = this.occlusionAlpha;
                     }
                }
            }
        }
    }
}