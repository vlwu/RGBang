export const BIOME_CONFIG = {
    forest: {
        name: "Enchanted Forest",

        // BASE LAYER: The ground is now primarily grass.
        // Replace with your repeating grass tile IDs.
        baseTiles: [
            { id: 56, weight: 0.8 },
            { id: 226, weight: 0.05 },
            { id: 224, weight: 0.05 },
            { id: 199, weight: 0.05 },
            { id: 227, weight: 0.05 },
        ],

        overlayTiles: {
            noiseScale: 30,
            threshold: 0.5, // Adjust to control the amount of dirt
            // The comments describe which piece of the dirt blob to find.
            // N=1, W=2, S=4, E=8
            mapping: {
                 0: 86,  // An isolated patch of DIRT on grass.
                 1: 'ID_GOES_HERE',  // DIRT tile with a grass border on its South, East, and West sides.
                 2: 'ID_GOES_HERE',  // DIRT tile with a grass border on its North, South, and East sides.
                 3: 59,  // A bottom-right corner of DIRT.
                 4: 'ID_GOES_HERE',  // DIRT tile with a grass border on its North, East, and West sides.
                 5: 'ID_GOES_HERE',  // A vertical strip of DIRT (grass on East and West).
                 6: 32,  // A top-right corner of DIRT.
                 7: 55,  // A right-hand edge of DIRT (grass on the East).
                 8: 'ID_GOES_HERE',  // DIRT tile with a grass border on its North, South, and West sides.
                 9: 58,  // A bottom-left corner of DIRT.
                10: 'ID_GOES_HERE',  // A horizontal strip of DIRT (grass on North and South).
                11: 29,  // A bottom edge of DIRT (grass on the South).
                12: 31,  // A top-left corner of DIRT.
                13: 57,  // A left-hand edge of DIRT (grass on the West).
                14: 83,  // A top edge of DIRT (grass on the North).
                15: 85,  // The main, repeating, center DIRT tile.
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