import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { CooldownIndicatorComponent } from '../components/CooldownIndicatorComponent.js';

export class RenderSystem {
    constructor(entityManager, stage) {
        this.entityManager = entityManager;
        this.stage = stage;
        this.renderedPixiObjects = new Map();
    }

    update() {
        const seenEntities = new Set();
        const queries = [
            { class: RenderableComponent, getDisplayObject: c => c.sprite },
            { class: CooldownIndicatorComponent, getDisplayObject: c => c.graphics },
        ];

        for (const queryDef of queries) {
            const entities = this.entityManager.query([PositionComponent, queryDef.class]);
            for (const entityId of entities) {
                seenEntities.add(entityId);
                const pos = this.entityManager.getComponent(entityId, PositionComponent);
                const component = this.entityManager.getComponent(entityId, queryDef.class);
                const displayObject = queryDef.getDisplayObject(component);

                if (!this.renderedPixiObjects.has(entityId)) {
                    this.stage.addChild(displayObject);
                    this.renderedPixiObjects.set(entityId, displayObject);
                }

                displayObject.x = Math.round(pos.x);
                displayObject.y = Math.round(pos.y);

                if (queryDef.class === CooldownIndicatorComponent) {
                    displayObject.zIndex = pos.y + 10000;
                } else if (displayObject.zIndex > -1000) {
                    displayObject.zIndex = pos.y;
                }
            }
        }

        for (const [entityId, displayObject] of this.renderedPixiObjects.entries()) {
            if (!seenEntities.has(entityId)) {
                this.stage.removeChild(displayObject);
                this.renderedPixiObjects.delete(entityId);
            }
        }
    }
}