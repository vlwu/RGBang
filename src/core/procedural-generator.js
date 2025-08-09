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

        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                const globalX = chunkX * chunkSize + x;
                const globalY = chunkY * chunkSize + y;

                ground.push({ x, y, tileId: this.biome.groundTiles[0].id });


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
                                x: (chunkX * chunkSize + x) * this.tilePixelSize + this.tilePixelSize / 2,
                                y: (chunkY * chunkSize + y) * this.tilePixelSize + this.tilePixelSize / 2,
                            };
                            objects.push(newObject);
                        }
                    }
                });

            }
        }

        return { ground, objects };
    }
}