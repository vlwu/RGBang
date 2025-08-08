export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",
        // These are Global IDs (GIDs) from your Tiled tilesets.
        // 'Forest Terrain.json' starts at firstgid: 1
        groundTiles: [
            { id: 33, weight: 0.8 }, // From Forest Terrain tiles (grass)
            { id: 55, weight: 0.2 }, // From Forest Terrain tiles (dirt)
        ],
        // Objects to be placed on top of the ground.
        objects: [
            {
                type: 'tree',
                // How "zoomed-in" the noise is. Larger numbers = more spread out.
                noiseScale: 15,
                // Value the noise must exceed to place this object (e.g., 0.7 makes it somewhat rare).
                threshold: 0.8,
                assetKey: 'tree_1',  // This is a reference for the entity factory
            },
        ]
    },
    crystal_caves: {
        name: "Crystal Caves",
        // 'Forest Terrain.json' defines these as well
        groundTiles: [
            { id: 77, weight: 0.9 }, // A different ground tile
            { id: 99, weight: 0.1 },
        ],
        objects: [
            {
                type: 'crystal',
                noiseScale: 10,
                threshold: 0.85, // Crystals are rarer
                assetKey: 'crystal_blue_large',
            },
        ]
    }
    // You can add more biomes here, like a desert or volcanic area
};