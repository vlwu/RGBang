export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",

        groundTiles: [
            { id: 28, weight: 0.9 },
            { id: 29, weight: 0.05 },
            { id: 30, weight: 0.05 },
        ],

        pathTiles: {
            noiseScale: 30,
            threshold: 0.6,
            tiles: [
                { id: 216, weight: 0.8 },
                { id: 217, weight: 0.1 },
                { id: 218, weight: 0.1 },
            ]
        },

        objects: [
            {
                type: 'NormalTree',
                noiseScale: 15,
                threshold: 0.82,
                spacing: 6,
            },
            {
                type: 'AutumnTree',
                noiseScale: 25,
                threshold: 0.88,
                spacing: 6,
            },
            {
                type: 'BrokenTree',
                noiseScale: 12,
                threshold: 0.9,
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