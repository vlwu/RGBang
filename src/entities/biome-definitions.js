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

        overlays: [
            {
                key: 'water',
                noiseScale: 50,
                threshold: 0.65,
                innerCorners: {
                    nw: [298, 303, 308, 313],
                    ne: [300, 305, 310, 315],
                    sw: [352, 357, 362, 367],
                    se: [354, 359, 364, 369],
                },
                mapping: {
                     3: [329, 334, 339, 344], // corner_sw
                     6: [302, 307, 312, 317], // corner_nw
                     7: [325, 330, 335, 340], // t_junction_e
                     9: [328, 333, 338, 343], // corner_se
                    11: [299, 304, 309, 314], // t_junction_s
                    12: [301, 306, 311, 316], // corner_ne
                    13: [327, 332, 337, 342], // t_junction_w
                    14: [353, 358, 363, 368], // t_junction_n
                    15: [355, 360, 365, 370], // center
                }
            },
            {
                key: 'dirt',
                noiseScale: 30,
                threshold: 0.5,
                innerCorners: {
                    nw: 28,
                    ne: 30,
                    sw: 82,
                    se: 84,
                },
                mapping: {
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
            }
        ],

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