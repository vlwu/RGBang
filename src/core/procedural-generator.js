import { createNoise2D } from 'simplex-noise';
import { BIOME_CONFIG } from '../entities/biome-definitions.js';

export class ProceduralGenerator {
    // --- MODIFICATION: Accept object definitions from the AssetManager ---
    constructor(seed, objectDefinitions, biomeId = 'forest') {
        this.noise2D = createNoise2D();
        this.setBiome(biomeId);
        this.objectDefinitions = objectDefinitions; // Store the definitions
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

                // --- MODIFICATION: New procedural object placement ---
                this.biome.objects.forEach((objDef, index) => {
                    const objNoise = this.noise2D(
                        (globalX + index * 100) / objDef.noiseScale,
                        (globalY + index * 100) / objDef.noiseScale
                    );
                    
                    // Check if the noise value passes the threshold to place an object
                    if (objNoise > objDef.threshold) {
                        const possibleObjects = this.objectDefinitions[objDef.type];
                        if (possibleObjects && possibleObjects.length > 0) {
                            // Pick a random object of the correct type (e.g., a random tree)
                            const template = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
                            
                            // Create a new object by copying the template and setting the new procedural position
                            const newObject = {
                                ...template, // Copy all properties (gid, type, custom props, etc.)
                                x: globalX * 16, // Example: Convert grid to pixel coords
                                y: globalY * 16
                            };
                            objects.push(newObject);
                        }
                    }
                });
                // --- END MODIFICATION ---
            }
        }

        return { ground, objects };
    }
}