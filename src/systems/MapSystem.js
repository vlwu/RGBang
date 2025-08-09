import * as PIXI from 'pixi.js';
import { ProceduralGenerator } from '../core/procedural-generator.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { createGameObjectFromTiled } from '../entities/entity-factory.js';

class Chunk {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.entityIds = new Set();
    }

    addEntity(id) {
        this.entityIds.add(id);
    }

    destroy() {
        for (const id of this.entityIds) {
            this.entityManager.destroyEntity(id);
        }
        this.entityIds.clear();
    }
}

export class MapSystem {
    constructor(entityManager, worldContainer, playerId, assets) {
        this.entityManager = entityManager;
        this.worldContainer = worldContainer;
        this.playerId = playerId;
        this.assets = assets;
        this.textureCache = new Map();

        this.CHUNK_SIZE_IN_TILES = 16;
        this.TILE_PIXEL_SIZE = 48;
        this.CHUNK_PIXEL_SIZE = this.CHUNK_SIZE_IN_TILES * this.TILE_PIXEL_SIZE;
        this.ACTIVE_RADIUS = 2;

        this.activeChunks = new Map();
        this.generator = new ProceduralGenerator('rgbang-is-cool', 'forest');

        this.loadObjectsFromCatalog();
    }

    loadObjectsFromCatalog() {
        const objectCatalog = this.assets.objectCatalog;
        if (!objectCatalog || !objectCatalog.layers) {
            console.warn("Object catalog map data not found or is invalid.");
            return;
        }

        const objectLayer = objectCatalog.layers.find(layer => layer.type === 'objectgroup');
        if (!objectLayer || !objectLayer.objects) {
            console.warn("No object layer found in the object catalog.");
            return;
        }

        for (const tiledObject of objectLayer.objects) {
            const texture = this.getTextureForGid(tiledObject.gid);
            if (!texture || texture === PIXI.Texture.EMPTY) {
                console.warn(`Could not find pre-loaded texture for object with GID: ${tiledObject.gid}`);
                continue;
            }
            
            createGameObjectFromTiled(this.entityManager, tiledObject, texture);
        }
    }

    update(dt) {
        if (this.playerId === null || !this.entityManager.entities.has(this.playerId)) return;
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

    getTextureForGid(gid) {
        if (this.textureCache.has(gid)) {
            return this.textureCache.get(gid);
        }

        // --- MODIFICATION: Simplified logic ---
        // In `object_catalog.json`, the tileset `GameObjects.tsx` has a `firstgid` of 1.
        // The tile IDs in your `.tsx` file (e.g., id="80") are what we need to look up.
        const firstgid = 1; 
        const tileId = gid - firstgid;
        
        // This is the primary path for your game objects (trees, crystals, etc.)
        if (this.assets.gameObjectTextures && this.assets.gameObjectTextures.has(tileId)) {
            const texture = this.assets.gameObjectTextures.get(tileId);
            this.textureCache.set(gid, texture);
            return texture;
        }

        // If we've reached here, it's likely a ground tile from procedural generation
        // for which we have no texture. We will return EMPTY to avoid rendering errors.
        return PIXI.Texture.EMPTY;
    }

    loadChunk(x, y) {
        const key = `${x},${y}`;
        const newChunk = new Chunk(this.entityManager);
        const chunkData = this.generator.generateChunkData(x, y, this.CHUNK_SIZE_IN_TILES);
        const chunkWorldX = x * this.CHUNK_PIXEL_SIZE;
        const chunkWorldY = y * this.CHUNK_PIXEL_SIZE;

        // --- MODIFICATION: This part will now create empty sprites for the ground ---
        chunkData.ground.forEach(tile => {
            const entityId = this.entityManager.createEntity();
            // Get an empty texture since the ground tileset loading was removed.
            const tileTexture = PIXI.Texture.EMPTY;
            const tileSprite = new PIXI.Sprite(tileTexture);
            const worldX = chunkWorldX + tile.x * this.TILE_PIXEL_SIZE;
            const worldY = chunkWorldY + tile.y * this.TILE_PIXEL_SIZE;

            tileSprite.zIndex = -1000;

            this.entityManager.addComponent(entityId, new PositionComponent(worldX, worldY));
            this.entityManager.addComponent(entityId, new RenderableComponent(tileSprite));
            newChunk.addEntity(entityId);
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
        for (const key of this.activeChunks.keys()) {
            this.unloadChunk(key);
        }
    }
}