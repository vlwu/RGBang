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

    generateChunkData(chunkX, chunkY, chunkSize) {
        const ground = [];
        const objects = [];
        const occupiedCells = new Set();

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const globalX = chunkX * chunkSize + x;
                const globalY = chunkY * chunkSize + y;

                ground.push({ x, y, tileId: this.biome.groundTiles[0].id });

                if (occupiedCells.has(`${globalX},${globalY}`)) {
                    continue;
                }

                this.biome.objects.forEach((objDef, index) => {
                    const objNoise = this.noise2D(
                        (globalX + index * 100) / objDef.noiseScale,
                        (globalY + index * 100) / objDef.noiseScale
                    );


                    if (objNoise > objDef.threshold) {
                        const possibleObjects = this.objectDefinitions[objDef.type];
                        if (possibleObjects && possibleObjects.length > 0) {

                            const template = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];

                            const newObject = {
                                ...template,
                                x: globalX * this.tilePixelSize + this.tilePixelSize / 2,
                                y: globalY * this.tilePixelSize + this.tilePixelSize / 2,
                            };
                            objects.push(newObject);

                            const spacing = objDef.spacing || 1; // Default to 1 if spacing isn't defined
                            for (let i = -Math.floor(spacing / 2); i < Math.ceil(spacing / 2); i++) {
                                for (let j = -Math.floor(spacing / 2); j < Math.ceil(spacing / 2); j++) {
                                    occupiedCells.add(`${globalX + i},${globalY + j}`);
                                }
                            }
                        }
                    }
                });
            }
        }

        return { ground, objects };
    }
}