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
        const overlays = this.biome.overlays || [];

        const logicalOverlayMap = new Map();

        const isOverlayType = (gx, gy, overlayDef) => {
            const seedOffset = overlays.indexOf(overlayDef) * 10000;
            const noise = this.noise2D((gx + seedOffset) / overlayDef.noiseScale, (gy + seedOffset) / overlayDef.noiseScale);
            return noise > overlayDef.threshold;
        };

        for (let y = -1; y <= chunkSize; y++) {
            for (let x = -1; x <= chunkSize; x++) {
                const gx = chunkX * chunkSize + x;
                const gy = chunkY * chunkSize + y;
                const key = `${gx},${gy}`;

                let appliedType = null;
                for (const overlayDef of overlays) {
                    if (isOverlayType(gx, gy, overlayDef)) {
                        appliedType = overlayDef.key;
                        break;
                    }
                }
                logicalOverlayMap.set(key, appliedType);
            }
        }

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const globalX = chunkX * chunkSize + x;
                const globalY = chunkY * chunkSize + y;
                let tileDef = this._getWeightedRandomTileId(this.biome.baseTiles);
                const overlayType = logicalOverlayMap.get(`${globalX},${globalY}`);

                if (overlayType) {
                    const overlayDef = overlays.find(o => o.key === overlayType);
                    const hasSameOverlay = (gx, gy) => logicalOverlayMap.get(`${gx},${gy}`) === overlayType;

                    const north = hasSameOverlay(globalX, globalY - 1);
                    const west = hasSameOverlay(globalX - 1, globalY);
                    const south = hasSameOverlay(globalX, globalY + 1);
                    const east = hasSameOverlay(globalX + 1, globalY);

                    let mask = 0;
                    if (north) mask |= 1;
                    if (west) mask |= 2;
                    if (south) mask |= 4;
                    if (east) mask |= 8;

                    let overlayTileDef = overlayDef.mapping[mask];

                    if (mask === 15 && overlayDef.innerCorners) {
                        const nw = hasSameOverlay(globalX - 1, globalY - 1);
                        const ne = hasSameOverlay(globalX + 1, globalY - 1);
                        const sw = hasSameOverlay(globalX - 1, globalY + 1);
                        const se = hasSameOverlay(globalX + 1, globalY + 1);

                        if (!nw) {
                            overlayTileDef = overlayDef.innerCorners.se;
                        } else if (!ne) {
                            overlayTileDef = overlayDef.innerCorners.sw;
                        } else if (!sw) {
                            overlayTileDef = overlayDef.innerCorners.ne;
                        } else if (!se) {
                            overlayTileDef = overlayDef.innerCorners.nw;
                        }
                    }

                    if (overlayTileDef !== undefined) {
                        if (Array.isArray(overlayTileDef) && overlayTileDef.length > 0 && typeof overlayTileDef[0] === 'object' && overlayTileDef[0].weight !== undefined) {
                            tileDef = this._getWeightedRandomTileId(overlayTileDef);
                        } else {
                            tileDef = overlayTileDef;
                        }
                    }

                    if (overlayType === 'water') {
                        occupiedCells.add(`${globalX},${globalY}`);
                    }
                }
                ground.push({ x, y, tileDef });

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