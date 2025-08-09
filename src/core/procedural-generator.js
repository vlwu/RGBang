import { createNoise2D } from 'simplex-noise';
import { BIOME_CONFIG } from '../entities/biome-definitions.js';

export class ProceduralGenerator {
    constructor(seed, biomeId = 'forest') {
        this.noise2D = createNoise2D();
        this.setBiome(biomeId);


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


                // The procedural object generation that was here has been removed.
            }
        }

        return { ground, objects };
    }
}