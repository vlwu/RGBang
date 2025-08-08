import { createNoise2D } from 'simplex-noise'; // Corrected: Import the factory function
import { BIOME_CONFIG } from '../entities/biome-definitions.js';

export class ProceduralGenerator {
    constructor(seed, biomeId = 'forest') {
        this.noise2D = createNoise2D();
        this.setBiome(biomeId);
        // For true seeded randomness, use a seeded PRNG to create the noise function.
        // For now, this will work perfectly for generation.
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

                // --- 1. Generate Ground Tile ---
                // Just use the first tile for now for simplicity.
                // Could use another noise layer to pick between weighted tiles.
                ground.push({ x, y, tileId: this.biome.groundTiles[0].id });

                // --- 2. Generate Objects ---
                this.biome.objects.forEach((objDef, index) => {
                    // Use different coordinates/offsets for each object type to avoid them clumping together
                    // Adding the index prevents multiple object types from using the exact same noise values.
                    const objNoise = this.noise2D(
                        (globalX + index * 100) / objDef.noiseScale,
                        (globalY + index * 100) / objDef.noiseScale
                    );

                    if (objNoise > objDef.threshold) {
                        objects.push({
                            x: x, // Position within the chunk, in tile units
                            y: y,
                            type: objDef.type,
                            assetKey: objDef.assetKey
                        });
                    }
                });
            }
        }

        return { ground, objects };
    }
}