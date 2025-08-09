export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",


        groundTiles: [
            { id: 33, weight: 0.8 },
            { id: 55, weight: 0.2 },
        ],

        objects: [
            {
                type: 'Tree', 

                noiseScale: 15,

                threshold: 0.8,
                assetKey: 'tree_1', 
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
                assetKey: 'crystal_blue_large',
            },
        ]
    }

};