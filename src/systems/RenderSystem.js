import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';

export class RenderSystem {
    constructor(entityManager, stage) {
        this.entityManager = entityManager;
        this.stage = stage;
        this.renderedEntities = new Set();
    }

    update() {
        const entities = this.entityManager.query([PositionComponent, RenderableComponent]);

        // Add new sprites to the stage
        for (const entity of entities) {
            if (!this.renderedEntities.has(entity)) {
                const renderable = this.entityManager.getComponent(entity, RenderableComponent);
                this.stage.addChild(renderable.sprite);
                this.renderedEntities.add(entity);
            }
        }

        // Update sprite positions
        for (const entity of entities) {
            const pos = this.entityManager.getComponent(entity, PositionComponent);
            const renderable = this.entityManager.getComponent(entity, RenderableComponent);
            renderable.sprite.x = pos.x;
            renderable.sprite.y = pos.y;
        }
    }
}