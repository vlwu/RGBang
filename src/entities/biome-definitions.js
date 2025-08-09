export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",

        groundTiles: [
            { id: 33, weight: 0.8 },
            { id: 55, weight: 0.2 },
        ],

        objects: [
            {
                type: 'NormalTree', // This must match the key in AssetManager's objectDefinitions
                noiseScale: 15,
                threshold: 0.75, // Normal trees are common
            },
            {
                type: 'AutumnTree',
                noiseScale: 25, // Use a different scale to create distinct patches
                threshold: 0.8,
            },
            {
                type: 'BrokenTree',
                noiseScale: 12, // More frequent noise scale, but higher threshold
                threshold: 0.85, // Broken trees are rarer
            },
        ]
    },
    crystal_caves: {
        name: "Crystal Caves",

        groundTiles: [
            { id: 77, weight: 0.9 },
            { id: 99, weight: 0.1 },
        ],
        objects: [
            {
                type: 'Crystal', // This will still work for other biomes
                noiseScale: 10,
                threshold: 0.85,
            },
        ]
    }

};