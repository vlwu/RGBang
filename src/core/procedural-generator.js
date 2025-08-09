import { createNoise2D } from 'simplex-noise';
import { BIOME_CONFIG } from '../entities/biome-definitions.js';

export class ProceduralGenerator {

    constructor(seed, objectDefinitions, tilePixelSize, biomeId = 'forest') {
        this.noise2D = createNoise2D();
        this.setBiome(biomeId);
        this.objectDefinitions = objectDefinitions;
        this.tilePixelSize = tilePixelSize;
    }

    setBiome(biomeId) {
        this.biome = BIOME_CONFIG[biomeId] || BIOME_CONFIG.forest;
    }

    _getProperty(tiledObject, propertyName, defaultValue = null) {
        if (!tiledObject.properties) {
            return defaultValue;
        }
        const prop = tiledObject.properties.find(p => p.name === propertyName);
        return prop ? prop.value : defaultValue;
    }

    _getWeightedRandomTileId(tileArray) {
        if (!tileArray || tileArray.length === 0) return 0;
        let totalWeight = 0;
        for (const tile of tileArray) {
            totalWeight += tile.weight;
        }
        let random = Math.random() * totalWeight;
        for (const tile of tileArray) {
            if (random < tile.weight) {
                return tile.id;
            }
            random -= tile.weight;
        }
        return tileArray[0].id;
    }

    generateChunkData(chunkX, chunkY, chunkSize) {
        const ground = [];
        const objects = [];
        const occupiedCells = new Set();
        const overlayDef = this.biome.overlayTiles;


        const logicalOverlayMap = new Map();
        const isOverlay = (gx, gy) => {
            if (!overlayDef) return false;
            const key = `${gx},${gy}`;
            if (logicalOverlayMap.has(key)) {
                return logicalOverlayMap.get(key);
            }
            const noise = this.noise2D(gx / overlayDef.noiseScale, gy / overlayDef.noiseScale);
            const result = noise > overlayDef.threshold;
            logicalOverlayMap.set(key, result);
            return result;
        };


        for (let y = -1; y <= chunkSize; y++) {
            for (let x = -1; x <= chunkSize; x++) {
                isOverlay(chunkX * chunkSize + x, chunkY * chunkSize + y);
            }
        }


        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const globalX = chunkX * chunkSize + x;
                const globalY = chunkY * chunkSize + y;


                let tileId;

                tileId = this._getWeightedRandomTileId(this.biome.baseTiles);


                if (isOverlay(globalX, globalY)) {
                    let mask = 0;
                    if (isOverlay(globalX, globalY - 1)) mask |= 1;
                    if (isOverlay(globalX - 1, globalY)) mask |= 2;
                    if (isOverlay(globalX, globalY + 1)) mask |= 4;
                    if (isOverlay(globalX + 1, globalY)) mask |= 8;
                    const overlayTileId = overlayDef.mapping[mask];
                    if (overlayTileId !== undefined) {
                        tileId = overlayTileId;
                    }
                }
                ground.push({ x, y, tileId });

                if (occupiedCells.has(`${globalX},${globalY}`)) {
                    continue;
                }


                for (const [index, objDef] of this.biome.objects.entries()) {
                    const objNoise = this.noise2D(
                        (globalX + index * 100) / objDef.noiseScale,
                        (globalY + index * 100) / objDef.noiseScale
                    );

                    if (objNoise > objDef.threshold) {
                        const possibleObjects = this.objectDefinitions[objDef.type];
                        if (possibleObjects && possibleObjects.length > 0) {

                            const template = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
                            const assetKey = this._getProperty(template, 'assetKey', '');

                            let spacing = objDef.spacing || 1;
                            if (objDef.type.includes('Tree')) {
                                const baseSpacing = objDef.spacing || 5;
                                if (assetKey.endsWith('1')) {
                                    spacing = baseSpacing;
                                } else if (assetKey.endsWith('2')) {
                                    spacing = Math.max(1, baseSpacing - 1);
                                } else if (assetKey.endsWith('3')) {
                                    spacing = Math.max(1, baseSpacing - 2);
                                }
                            }

                            const newObject = {
                                ...template,
                                x: globalX * this.tilePixelSize + this.tilePixelSize / 2,
                                y: globalY * this.tilePixelSize + this.tilePixelSize / 2,
                            };
                            objects.push(newObject);

                            for (let i = -Math.floor(spacing / 2); i < Math.ceil(spacing / 2); i++) {
                                for (let j = -Math.floor(spacing / 2); j < Math.ceil(spacing / 2); j++) {
                                    occupiedCells.add(`${globalX + i},${globalY + j}`);
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
        return { ground, objects };
    }
}