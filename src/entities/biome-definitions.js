export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",

        groundTiles: [
            { id: 33, weight: 0.8 },
            { id: 55, weight: 0.2 },
        ],

        objects: [
            {
                type: 'NormalTree',
                noiseScale: 15,
                threshold: 0.75,
                spacing: 6,
            },
            {
                type: 'AutumnTree',
                noiseScale: 25,
                threshold: 0.8,
                spacing: 6,
            },
            {
                type: 'BrokenTree',
                noiseScale: 12,
                threshold: 0.85,
                spacing: 4,
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
                type: 'Crystal',
                noiseScale: 10,
                threshold: 0.85,
                spacing: 3,
            },
        ]
    }

};