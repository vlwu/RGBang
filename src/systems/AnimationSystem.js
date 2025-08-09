import { AnimationComponent } from '../components/AnimationComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class AnimationSystem {
    constructor(entityManager, mapSystem) {
        this.entityManager = entityManager;
        this.mapSystem = mapSystem; // To access _getTileTexture
    }

    update(dt) {
        const entities = this.entityManager.query([AnimationComponent, RenderableComponent]);

        for (const entityId of entities) {
            const anim = this.entityManager.getComponent(entityId, AnimationComponent);
            const renderable = this.entityManager.getComponent(entityId, RenderableComponent);

            anim.timer += dt;
            if (anim.timer >= anim.frameDuration) {
                anim.timer -= anim.frameDuration;

                anim.currentFrameIndex++;
                if (anim.currentFrameIndex >= anim.frames.length) {
                    if (anim.loops) {
                        anim.currentFrameIndex = 0;
                    } else {
                        anim.currentFrameIndex = anim.frames.length - 1; // stay on last frame
                    }
                }

                const newTileId = anim.frames[anim.currentFrameIndex];
                const newTexture = this.mapSystem._getTileTexture(newTileId);

                if (renderable.sprite.texture !== newTexture) {
                    renderable.sprite.texture = newTexture;
                }
            }
        }
    }
}