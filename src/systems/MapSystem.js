import * as PIXI from 'pixi.js';
import { ProceduralGenerator } from '../core/procedural-generator.js';
import { PositionComponent } from '../components/PositionComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { createTree, createCrystal } from '../entities/entity-factory.js';

class Chunk {
    constructor(entityManager, stage) {
        this.entityManager = entityManager;
        this.entityIds = new Set();
        this.container = new PIXI.Container();
        this.container.sortableChildren = true; // For potential depth sorting
        stage.addChild(this.container);
    }

    addEntity(id, renderable) {
        this.entityIds.add(id);
        if (renderable && renderable.sprite) {
            this.container.addChild(renderable.sprite);
        }
    }

    destroy() {
        for (const id of this.entityIds) {
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
        this.textureCache = new Map(); // Cache for tile textures

        this.CHUNK_SIZE_IN_TILES = 16;
        this.TILE_PIXEL_SIZE = 48; // 16px tile scaled by 3
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

    // --- NEW HELPER METHODS ---
    findTilesetForGid(gid) {
        // Iterate backwards to find the correct tileset
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

    // --- END NEW HELPER METHODS ---

    loadChunk(x, y) {
        const key = `${x},${y}`;
        const newChunk = new Chunk(this.entityManager, this.worldContainer);
        const chunkData = this.generator.generateChunkData(x, y, this.CHUNK_SIZE_IN_TILES);
        const chunkWorldX = x * this.CHUNK_PIXEL_SIZE;
        const chunkWorldY = y * this.CHUNK_PIXEL_SIZE;
        
        // --- RENDER GROUND TILES ---
        chunkData.ground.forEach(tile => {
            const tileTexture = this.getTextureForGid(tile.tileId);
            const tileSprite = new PIXI.Sprite(tileTexture);
            tileSprite.x = chunkWorldX + tile.x * this.TILE_PIXEL_SIZE;
            tileSprite.y = chunkWorldY + tile.y * this.TILE_PIXEL_SIZE;
            tileSprite.scale.set(this.TILE_PIXEL_SIZE / tileTexture.width);
            tileSprite.zIndex = -1; // Render below objects
            newChunk.container.addChild(tileSprite);
        });
        // --- END RENDER GROUND TILES ---

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
                // We add object entities to the chunk so they are destroyed correctly.
                // Their sprites are already managed by the RenderSystem, so we don't add them to the chunk's container.
                newChunk.entityIds.add(newEntityId);
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