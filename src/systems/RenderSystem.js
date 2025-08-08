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
            const componentsToQuery = queryDef.class === CooldownIndicatorComponent
                ? [queryDef.class]
                : [PositionComponent, queryDef.class];
                
            const entities = this.entityManager.query(componentsToQuery);
            for (const entityId of entities) {
                seenEntities.add(entityId);
                const component = this.entityManager.getComponent(entityId, queryDef.class);
                const displayObject = queryDef.getDisplayObject(component);

                if (!this.renderedPixiObjects.has(entityId)) {
                    this.stage.addChild(displayObject);
                    this.renderedPixiObjects.set(entityId, displayObject);
                }

                if (queryDef.class === CooldownIndicatorComponent) {
                    const targetId = component.targetEntityId;
                    if (this.entityManager.hasComponent(targetId, PositionComponent)) {
                        const targetPos = this.entityManager.getComponent(targetId, PositionComponent);
                        displayObject.x = Math.round(targetPos.x);
                        displayObject.y = Math.round(targetPos.y + component.yOffset);
                        displayObject.zIndex = targetPos.y + 20000;
                    }
                } else {
                    const pos = this.entityManager.getComponent(entityId, PositionComponent);
                    displayObject.x = Math.round(pos.x);
                    displayObject.y = Math.round(pos.y);

                    if (displayObject.zIndex !== -1000) {
                        displayObject.zIndex = pos.y + 10000;
                    }
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