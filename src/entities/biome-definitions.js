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

        // Replaced overlayTiles with an array of overlays for layering.
        // Water is first, so it gets priority during generation.
        overlays: [
            {
                key: 'water',
                noiseScale: 50, // Larger scale for bigger, less frequent pools
                threshold: 0.65, // Higher threshold makes it rarer than dirt
                innerCorners: {
                    nw: 298, // placeholder: water_inner_corner_nw
                    ne: 300, // placeholder: water_inner_corner_ne
                    sw: 352, // placeholder: water_inner_corner_sw
                    se: 354, // placeholder: water_inner_corner_se
                },
                mapping: {
                     3: 329, // placeholder: water_corner_sw
                     6: 302, // placeholder: water_corner_nw
                     7: 325, // placeholder: water_t_junction_e
                     9: 328, // placeholder: water_corner_se
                    11: 299, // placeholder: water_t_junction_s
                    12: 301, // placeholder: water_corner_ne
                    13: 327, // placeholder: water_t_junction_w
                    14: 353, // placeholder: water_t_junction_n
                    15: 355, // placeholder: water_center
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
                    // This mapping is intentionally sparse to create more natural patches
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