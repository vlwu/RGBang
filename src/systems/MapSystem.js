import * as PIXI from 'pixi.js';
import { ProceduralGenerator } from '../core/procedural-generator.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { createTree, createCrystal } from '../entities/entity-factory.js';

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
        this.ACTIVE_RADIUS = 1;

        this.activeChunks = new Map();
        this.generator = new ProceduralGenerator('rgbang-is-cool', 'forest');
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


    findTilesetForGid(gid) {

        const tilesetKeys = Object.keys(this.assets.tilesets);
        for (let i = tilesetKeys.length - 1; i >= 0; i--) {
            const key = tilesetKeys[i];
            const tileset = this.assets.tilesets[key];
            if (gid >= tileset.firstgid) {
                return tileset;
            }
        }
        return null;
    }

    getTextureForGid(gid) {
        if (this.textureCache.has(gid)) {
            return this.textureCache.get(gid);
        }

        const tileset = this.findTilesetForGid(gid);
        if (!tileset) return PIXI.Texture.EMPTY;

        const localId = gid - tileset.firstgid;
        const tileWidth = tileset.tilewidth;
        const tileHeight = tileset.tileheight;
        const columns = tileset.columns;

        const sx = (localId % columns) * tileWidth;
        const sy = Math.floor(localId / columns) * tileHeight;

        try {
            const frame = new PIXI.Rectangle(sx, sy, tileWidth, tileHeight);
            const texture = new PIXI.Texture({ source: tileset.texture.source, frame });
            this.textureCache.set(gid, texture);
            return texture;
        } catch (error) {
            console.error(`Error creating texture for GID ${gid}`, error);
            return PIXI.Texture.EMPTY;
        }
    }



    loadChunk(x, y) {
        const key = `${x},${y}`;
        const newChunk = new Chunk(this.entityManager);
        const chunkData = this.generator.generateChunkData(x, y, this.CHUNK_SIZE_IN_TILES);
        const chunkWorldX = x * this.CHUNK_PIXEL_SIZE;
        const chunkWorldY = y * this.CHUNK_PIXEL_SIZE;


        chunkData.ground.forEach(tile => {
            const entityId = this.entityManager.createEntity();
            const tileTexture = this.getTextureForGid(tile.tileId);
            const tileSprite = new PIXI.Sprite(tileTexture);
            const worldX = chunkWorldX + tile.x * this.TILE_PIXEL_SIZE;
            const worldY = chunkWorldY + tile.y * this.TILE_PIXEL_SIZE;

            tileSprite.scale.set(this.TILE_PIXEL_SIZE / (tileTexture.width || 16));
            tileSprite.zIndex = -1000; // Render ground tiles in the background.

            this.entityManager.addComponent(entityId, new PositionComponent(worldX, worldY));
            this.entityManager.addComponent(entityId, new RenderableComponent(tileSprite));
            newChunk.addEntity(entityId);
        });


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
                newChunk.addEntity(newEntityId);
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
        for (const key of this.activeChunks.keys()) {
            this.unloadChunk(key);
        }
    }
}