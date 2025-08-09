export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",

        baseTiles: [
            { id: 56, weight: 0.9 },
            { id: 226, weight: 0.025 },
            { id: 224, weight: 0.025 },
            { id: 199, weight: 0.05 },
            { id: 227, weight: 0.05 },
        ],

        overlayTiles: {
            noiseScale: 30,
            threshold: 0.5,

            innerCorners: {
                nw: 28,
                ne: 30,
                sw: 82,
                se: 84,
            },

            mapping: {
                 0: 86,
                 3: 59,
                 6: 32,
                 7: 55,
                 9: 58,
                11: 29,
                12: 31,
                13: 57,
                14: 83,
                15: [
                    { id: 85, weight: 0.9 },
                    { id: 86, weight: 0.05 },
                    { id: 87, weight: 0.05 },
                    { id: 33, weight: 0.025 },
                    { id: 60, weight: 0.025 }
                ],
            }
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
};