import * as PIXI from 'pixi.js';
import pako from 'pako';

export class MapSystem {
    constructor(entityManager, stage) {
        this.entityManager = entityManager;
        this.stage = stage;
        this.tilesets = [];
        this.mapContainer = new PIXI.Container();
        this.mapContainer.scale.set(3);
        this.stage.addChild(this.mapContainer);
        this.mapContainer.zIndex = -100;
        this.stage.sortableChildren = true;
    }

    async loadMap(mapData) {
        const tilesetPromises = mapData.tilesets.map(async (tilesetInfo) => {
            const tilesetUrl = `maps/${tilesetInfo.source}`;
            try {
                const response = await fetch(tilesetUrl);
                if (!response.ok) {
                    console.error(`Failed to load tileset definition: ${tilesetUrl}`);
                    return null;
                }
                const tilesetData = await response.json();

                const imageUrl = `maps/${tilesetData.image}`;
                const baseTexture = await PIXI.Assets.load(imageUrl).catch(err => {
                    console.error(`Failed to load tileset image: ${imageUrl}`, err);
                    return null;
                });

                if (!baseTexture) return null;

                return {
                    firstgid: tilesetInfo.firstgid,
                    data: tilesetData,
                    texture: baseTexture,
                };
            } catch (error) {
                console.error(`Error processing tileset ${tilesetUrl}:`, error);
                return null;
            }
        });

        this.tilesets = (await Promise.all(tilesetPromises)).filter(t => t !== null);

        mapData.layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.visible) {
                this.renderTileLayer(layer, mapData.tilewidth, mapData.tileheight);
            }
        });
    }

    renderTileLayer(layer, tileWidth, tileHeight) {
        if (typeof layer.data === 'string') {

            if (layer.encoding === 'base64' && (layer.compression === 'zlib' || layer.compression === 'gzip')) {
                try {

                    const decodedString = atob(layer.data);
                    const charData = decodedString.split('').map((x) => x.charCodeAt(0));
                    const byteData = new Uint8Array(charData);

                    // Step 2: Decompress using pako
                    const decompressedData = pako.inflate(byteData);

                    // Step 3: Create a DataView to read 32-bit GIDs
                    const gids = new Uint32Array(decompressedData.buffer);
                    layer.data = Array.from(gids);
                } catch (e) {
                    console.error(`Failed to decompress layer data for layer "${layer.name}":`, e);
                    return;
                }
            } else {
                 console.error(`Unsupported layer data format for layer "${layer.name}"`);
                 return;
            }
        }

        const { data, width, name, opacity, x: layerX, y: layerY } = layer;
        const layerContainer = new PIXI.Container();
        layerContainer.label = name;
        layerContainer.alpha = opacity;

        for (let i = 0; i < data.length; i++) {
            const gid = data[i];
            if (gid === 0) continue;

            const tileset = this.findTilesetForGid(gid);
            if (!tileset) {
                console.warn(`No tileset found for GID: ${gid}`);
                continue;
            }

            if (typeof tileset.data.columns !== 'number' || tileset.data.columns === 0) {
                console.warn(`Tileset for GID ${gid} has invalid 'columns' property.`, tileset.data);
                continue;
            }

            const localId = gid - tileset.firstgid;
            const columns = tileset.data.columns;
            const sx = (localId % columns) * tileWidth;
            const sy = Math.floor(localId / columns) * tileHeight;

            const tileX = i % width;
            const tileY = Math.floor(i / width);

            const realX = (tileX + layerX) * tileWidth;
            const realY = (tileY + layerY) * tileHeight;

            try {
                const tileTexture = new PIXI.Texture({
                    source: tileset.texture,
                    frame: new PIXI.Rectangle(sx, sy, tileWidth, tileHeight)
                });
                const tileSprite = new PIXI.Sprite(tileTexture);
                tileSprite.position.set(realX, realY);
                layerContainer.addChild(tileSprite);
            } catch (error) {
                console.error(`Error creating texture for GID ${gid}`, error);
            }
        }
        this.mapContainer.addChild(layerContainer);
    }

    findTilesetForGid(gid) {
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            if (gid >= this.tilesets[i].firstgid) {
                return this.tilesets[i];
            }
        }
        return null;
    }

    update() {

    }
}