export class EntityManager {
    constructor() {
        this.nextEntityId = 0;
        this.entities = new Set();
        this.componentsByClass = new Map();
        this.queryCache = new Map();
    }

    createEntity() {
        const entityId = this.nextEntityId++;
        this.entities.add(entityId);
        return entityId;
    }

    addComponent(entityId, component) {
        const componentClass = component.constructor;
        if (!this.componentsByClass.has(componentClass)) {
            this.componentsByClass.set(componentClass, new Map());
        }
        this.componentsByClass.get(componentClass).set(entityId, component);
        this.queryCache.clear();
        return this;
    }

    getComponent(entityId, componentClass) {
        const componentMap = this.componentsByClass.get(componentClass);
        return componentMap ? componentMap.get(entityId) : undefined;
    }

    hasComponent(entityId, componentClass) {
        const componentMap = this.componentsByClass.get(componentClass);
        return componentMap ? componentMap.has(entityId) : false;
    }

    removeComponent(entityId, componentClass) {
        const componentMap = this.componentsByClass.get(componentClass);
        if (componentMap) {
            componentMap.delete(entityId);
        }
        this.queryCache.clear();
    }

    destroyEntity(entityId) {
        for (const componentMap of this.componentsByClass.values()) {
            componentMap.delete(entityId);
        }
        this.entities.delete(entityId);
        this.queryCache.clear();
    }

    query(componentClasses) {
        const cacheKey = componentClasses.map(c => c.name).sort().join(',');
        if (this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }
        const entitiesWithComponents = [];
        for (const entityId of this.entities) {
            if (componentClasses.every(cls => this.hasComponent(entityId, cls))) {
                entitiesWithComponents.push(entityId);
            }
        }
        this.queryCache.set(cacheKey, entitiesWithComponents);
        return entitiesWithComponents;
    }
}