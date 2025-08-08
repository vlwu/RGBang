import * as PIXI from 'pixi.js';
import { ProceduralGenerator } from '../core/procedural-generator.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { createTree, createCrystal } from '../entities/entity-factory.js';

// A helper class to manage the entities and rendering container for a single chunk
class Chunk {
    constructor(entityManager, stage) {
        this.entityManager = entityManager;
        this.entityIds = new Set();
        this.container = new PIXI.Container();
        // Keep track of which entities have sprites in the container
        this.spriteManagedEntities = new Set();
        stage.addChild(this.container);
    }

    addEntity(id, renderable) {
        this.entityIds.add(id);
        if (renderable && renderable.sprite) {
            this.container.addChild(renderable.sprite);
            this.spriteManagedEntities.add(id);
        }
    }

    destroy() {
        for (const id of this.entityIds) {
            // Sprites are in the container, so they will be destroyed with it.
            // We only need to tell the entity manager to forget the entity.
            this.entityManager.destroyEntity(id);
        }
        this.entityIds.clear();
        this.container.destroy({ children: true, texture: false, baseTexture: false });
    }
}

export class MapSystem {
    constructor(entityManager, worldContainer, playerId, assets) {
        this.entityManager = entityManager;
        this.worldContainer = worldContainer;
        this.playerId = playerId;
        this.assets = assets;

        this.CHUNK_SIZE_IN_TILES = 16;
        this.TILE_PIXEL_SIZE = 48; // Your 16px tiles with a scale of 3
        this.CHUNK_PIXEL_SIZE = this.CHUNK_SIZE_IN_TILES * this.TILE_PIXEL_SIZE;
        this.ACTIVE_RADIUS = 1; // Load a 3x3 grid of chunks around the player

        this.activeChunks = new Map();
        // You can change the seed and biome later based on game state
        this.generator = new ProceduralGenerator('rgbang-is-cool', 'forest');
    }

    update(dt) {
        if (this.playerId === null || !this.entityManager.entities.has(this.playerId)) {
            return;
        }

        const playerPos = this.entityManager.getComponent(this.playerId, PositionComponent);
        if (!playerPos) return;

        const playerChunkX = Math.floor(playerPos.x / this.CHUNK_PIXEL_SIZE);
        const playerChunkY = Math.floor(playerPos.y / this.CHUNK_PIXEL_SIZE);

        const requiredChunks = new Set();
        for (let y = playerChunkY - this.ACTIVE_RADIUS; y <= playerChunkY + this.ACTIVE_RADIUS; y++) {
            for (let x = playerChunkX - this.ACTIVE_RADIUS; x <= playerChunkX + this.ACTIVE_RADIUS; x++) {
                const key = `${x},${y}`;
                requiredChunks.add(key);
                if (!this.activeChunks.has(key)) {
                    this.loadChunk(x, y);
                }
            }
        }

        for (const [key, chunk] of this.activeChunks.entries()) {
            if (!requiredChunks.has(key)) {
                this.unloadChunk(key);
            }
        }
    }

    loadChunk(x, y) {
        const key = `${x},${y}`;
        const newChunk = new Chunk(this.entityManager, this.worldContainer);

        const chunkData = this.generator.generateChunkData(x, y, this.CHUNK_SIZE_IN_TILES);
        const chunkWorldX = x * this.CHUNK_PIXEL_SIZE;
        const chunkWorldY = y * this.CHUNK_PIXEL_SIZE;

        // Note: Ground tiles are not implemented here yet, only objects.
        // This would be the place to render the `chunkData.ground` tiles to the chunk's container.

        chunkData.objects.forEach(obj => {
            const worldX = chunkWorldX + obj.x * this.TILE_PIXEL_SIZE + (this.TILE_PIXEL_SIZE / 2);
            const worldY = chunkWorldY + obj.y * this.TILE_PIXEL_SIZE + (this.TILE_PIXEL_SIZE / 2);

            let newEntityId;
            if (obj.type === 'tree') {
                newEntityId = createTree(this.entityManager, worldX, worldY, this.assets);
            } else if (obj.type === 'crystal') {
                newEntityId = createCrystal(this.entityManager, worldX, worldY, this.assets);
            }

            if (newEntityId) {
                const renderable = this.entityManager.getComponent(newEntityId, RenderableComponent);
                newChunk.addEntity(newEntityId, renderable);
            }
        });

        this.activeChunks.set(key, newChunk);
    }

    unloadChunk(key) {
        const chunk = this.activeChunks.get(key);
        if (chunk) {
            chunk.destroy();
        }
        this.activeChunks.delete(key);
    }

    setBiome(biomeId) {
        this.generator.setBiome(biomeId);
        // Clear all existing chunks to force a regeneration with the new biome
        for (const key of this.activeChunks.keys()) {
            this.unloadChunk(key);
        }
    }
}