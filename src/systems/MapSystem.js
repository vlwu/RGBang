import * as PIXI from 'pixi.js';
import { ProceduralGenerator } from '../core/procedural-generator.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { createGameObjectFromTiled } from '../entities/entity-factory.js';
import { AnimationComponent } from '../components/AnimationComponent.js';

class Chunk {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.entityIds = new Set();
    }

    addEntity(id) {
        if (id) {
            this.entityIds.add(id);
        }
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


        this.generator = new ProceduralGenerator('rgbang-is-cool', assets.objectDefinitions, this.TILE_PIXEL_SIZE, 'forest');
        this.forestTileset = this.assets.tilesets.forest;
        this.tileTextureCache = new Map();
    }

    _getTileTexture(tileId) {
        if (this.tileTextureCache.has(tileId)) {
            return this.tileTextureCache.get(tileId);
        }
        if (!this.forestTileset || !this.forestTileset.texture) {
            return PIXI.Texture.EMPTY;
        }

        const { texture, metadata } = this.forestTileset;
        const { tileWidth, tileHeight, columns } = metadata;


        if (texture.source) {
            texture.source.scaleMode = 'nearest';
        }

        const tileX = (tileId % columns) * tileWidth;
        const tileY = Math.floor(tileId / columns) * tileHeight;

        const rect = new PIXI.Rectangle(tileX, tileY, tileWidth, tileHeight);
        const tileTexture = new PIXI.Texture({ source: texture.source, frame: rect });

        this.tileTextureCache.set(tileId, tileTexture);
        return tileTexture;
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

        const firstgid = 1;
        const tileId = gid - firstgid;

        if (this.assets.gameObjectTextures && this.assets.gameObjectTextures.has(tileId)) {
            const texture = this.assets.gameObjectTextures.get(tileId);
            this.textureCache.set(gid, texture);
            return texture;
        }

        return PIXI.Texture.EMPTY;
    }

    loadChunk(x, y) {
        const key = `${x},${y}`;
        const newChunk = new Chunk(this.entityManager);
        const chunkData = this.generator.generateChunkData(x, y, this.CHUNK_SIZE_IN_TILES);
        const chunkWorldX = x * this.CHUNK_PIXEL_SIZE;
        const chunkWorldY = y * this.CHUNK_PIXEL_SIZE;

        chunkData.ground.forEach(tile => {
            const entityId = this.entityManager.createEntity();
            let initialTileId;

            if (Array.isArray(tile.tileDef)) {
                initialTileId = tile.tileDef[0];
                this.entityManager.addComponent(entityId, new AnimationComponent({
                    frames: tile.tileDef,
                    frameDuration: 0.5,
                }));
            } else {
                initialTileId = tile.tileDef;
            }

            const tileTexture = this._getTileTexture(initialTileId);
            const tileSprite = new PIXI.Sprite(tileTexture);
            const worldX = chunkWorldX + tile.x * this.TILE_PIXEL_SIZE;
            const worldY = chunkWorldY + tile.y * this.TILE_PIXEL_SIZE;

            if (this.forestTileset && this.forestTileset.metadata.tileWidth > 0) {
                tileSprite.scale.set(this.TILE_PIXEL_SIZE / this.forestTileset.metadata.tileWidth);
            }
            tileSprite.zIndex = -1000;

            this.entityManager.addComponent(entityId, new PositionComponent(worldX, worldY));
            this.entityManager.addComponent(entityId, new RenderableComponent(tileSprite));
            newChunk.addEntity(entityId);
        });


        chunkData.objects.forEach(tiledObject => {
            const texture = this.getTextureForGid(tiledObject.gid);
            if (texture && texture !== PIXI.Texture.EMPTY) {
                const entityId = createGameObjectFromTiled(this.entityManager, tiledObject, texture, this.assets);
                newChunk.addEntity(entityId);
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