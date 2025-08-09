import * as PIXI from 'pixi.js';
import { generateBulletAnimations } from '../utils/animation-helpers.js';

function loadImage(src, key = 'unknown') {
    return new Promise((resolve) => {
        const img = new Image();
        const timeout = 5000;
        let fallbackUsed = false;

        const createFallback = () => {
            if (fallbackUsed) return;
            fallbackUsed = true;
            console.warn(`Failed or timed out loading image: ${src}. Using fallback for key "${key}".`);
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = 32;
            fallbackCanvas.height = 32;
            const ctx = fallbackCanvas.getContext('2d');
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(0, 0, 32, 32);
            const fallbackImage = new Image();
            fallbackImage.src = fallbackCanvas.toDataURL();
            fallbackImage.onload = () => resolve(fallbackImage);
        };

        const timer = setTimeout(createFallback, timeout);

        img.onload = () => {
            if (fallbackUsed) return;
            clearTimeout(timer);
            resolve(img);
        };

        img.onerror = () => {
            clearTimeout(timer);
            createFallback();
        };

        img.src = src;
    });
}

const coreImagePaths = {
    font_spritesheet: '/images/ui/text/Text (White).png',
    settings_icon: '/images/ui/buttons/Settings.png',
    pause_icon: '/images/ui/buttons/Pause.png',
    play_icon: '/images/ui/buttons/Play.png',
    character_icon: '/images/ui/buttons/Character.png',
    info_icon: '/images/ui/buttons/Info.png',
    close_button: '/images/ui/buttons/Close.png',
    restart_button: '/images/ui/buttons/Restart.png',
    previous_button: '/images/ui/buttons/Previous.png',
    next_button: '/images/ui/buttons/Next.png',
};

const weaponImagePaths = {
    gun_1: 'images/guns/1.png',
    gun_2: 'images/guns/2.png',
    gun_3: 'images/guns/3.png',
    gun_4: 'images/guns/6.png',
    gun_5: 'images/guns/10.png',
    gun_6: 'images/guns/12.png',
};

const bulletSpritesheetPaths = {
    Red: 'images/bullets/Red.png',
    Blue: 'images/bullets/Blue.png',
    Yellow: 'images/bullets/Yellow.png',
};

const characterData = {
    m_human: { image: 'images/player/mPlayer Human.png' },
    f_human: { image: 'images/player/fPlayer Human.png' },
    m_elf:   { image: 'images/player/mPlayer Elf.png' },
    f_elf:   { image: 'images/player/fPlayer Elf.png' },
    m_dwarf: { image: 'images/player/mPlayer Dwarf.png' },
    f_dwarf: { image: 'images/player/fPlayer Dwarf.png' },
};

// Helper function to get a property from a Tiled object
function getProperty(tiledObject, propertyName, defaultValue = null) {
    if (!tiledObject.properties) {
        return defaultValue;
    }
    const prop = tiledObject.properties.find(p => p.name === propertyName);
    return prop ? prop.value : defaultValue;
}

class AssetManager {
    constructor() {
        this.assets = {
            characters: {},
            weapons: {},
            bullets: {},
            maps: {},
            tilesets: {},
            gameObjectTextures: new Map(),
            
            objectDefinitions: {
                NormalTree: [],
                BrokenTree: [],
                AutumnTree: [],
                Crystal: []
            }
        };
    }

    async loadCoreAssets() {
        await PIXI.Assets.init({
            texturePreference: {
                scaleMode: 'nearest',
            },
        });

        const imagePromises = Object.entries(coreImagePaths).map(([key, src]) =>
            loadImage(src, key).then(img => ({ [key]: img }))
        );
        const weaponPromises = Object.entries(weaponImagePaths).map(([key, src]) =>
            PIXI.Assets.load(src).then(texture => ({ type: 'weapon', key, texture })).catch(error => {
                console.warn(`Could not load weapon texture for ${key} from ${src}:`, error);
                return { type: 'weapon', key, texture: null };
            })
        );

        const mapPath = 'maps/object_catalog.json';
        const mapPromise = fetch(mapPath).then(res => res.json()).then(data => ({ type: 'map', key: 'objectCatalog', data })).catch(error => {
            console.warn(`Could not load map data from ${mapPath}:`, error);
            return { type: 'map', key: 'objectCatalog', data: null };
        });

        const gameObjectsTilesetPromise = fetch('maps/GameObjects.tsx')
            .then(res => res.text())
            .then(xmlString => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "application/xml");
                const tiles = Array.from(xmlDoc.getElementsByTagName('tile'));
                const texturePromises = tiles.map(tile => {
                    const id = parseInt(tile.getAttribute('id'), 10);
                    const imageEl = tile.querySelector('image');
                    if (!imageEl) return Promise.resolve(null);

                    const sourcePath = imageEl.getAttribute('source').replace('../', '');

                    return PIXI.Assets.load(sourcePath)
                        .then(texture => ({ id, texture }))
                        .catch(err => {
                            console.warn(`Failed to load texture for tile ID ${id} at ${sourcePath}:`, err);
                            return null;
                        });
                });
                return Promise.all(texturePromises);
            });

        const manifestPath = 'images/player/mPlayer Human.json';
        const manifestPromise = fetch(manifestPath).then(res => res.json());

        const [loadedParts, gameObjectTextures] = await Promise.all([
             Promise.all([...imagePromises, ...weaponPromises, mapPromise]),
             gameObjectsTilesetPromise
        ]);

        for (const part of loadedParts) {
            if (part.type === 'weapon' && part.texture) {
                 this.assets.weapons[part.key] = part.texture;
            } else if (part.type === 'map' && part.data) {
                 this.assets[part.key] = part.data;
            } else if (part.type === 'tileset' && part.data) {
                this.assets.tilesets[part.key] = part.data;
            } else if (!part.type) {
                 Object.assign(this.assets, part);
            }
        }

        if (gameObjectTextures) {
            gameObjectTextures.forEach(item => {
                if (item) {
                    this.assets.gameObjectTextures.set(item.id, item.texture);
                }
            });
        }


        const catalog = this.assets.objectCatalog;
        if (catalog && catalog.layers) {
            const objectLayer = catalog.layers.find(l => l.type === 'objectgroup');
            if (objectLayer && objectLayer.objects) {
                objectLayer.objects.forEach(obj => {
                    const type = getProperty(obj, 'type');
                    const assetKey = getProperty(obj, 'assetKey', '');

                    if (type === 'Tree') {
                        if (assetKey.includes('Autumn')) {
                            this.assets.objectDefinitions.AutumnTree.push(obj);
                        } else if (assetKey.includes('Broken')) {
                            this.assets.objectDefinitions.BrokenTree.push(obj);
                        } else {
                            this.assets.objectDefinitions.NormalTree.push(obj);
                        }
                    } else if (type === 'Crystal') {
                        this.assets.objectDefinitions.Crystal.push(obj);
                    }
                });
            }
        }


        const bulletAnimationData = generateBulletAnimations();
        const bulletPromises = Object.entries(bulletSpritesheetPaths).map(([key, src]) =>
            PIXI.Assets.load(src).then(texture => {
                const spritesheet = new PIXI.Spritesheet({ texture: texture, data: { ...bulletAnimationData, meta: { image: src, format: texture.source.format, size: { w: texture.width, h: texture.height }, scale: 1 }}});
                return spritesheet.parse().then(() => ({ type: 'bullet', key, spritesheet }));
            }).catch(error => {
                console.warn(`Could not load or parse bullet spritesheet for ${key} from ${src}:`, error);
                return { type: 'bullet', key, spritesheet: null };
            })
        );
        const loadedBullets = await Promise.all(bulletPromises);
        for (const part of loadedBullets) {
            if (part.type === 'bullet' && part.spritesheet) { this.assets.bullets[part.key] = part.spritesheet; }
        }
        const manifestData = await manifestPromise;
        const characterSpritesheetPromises = [];
        for (const charKey in characterData) {
            const imagePath = characterData[charKey].image;
            const promise = PIXI.Assets.load(imagePath).then(texture => {
                const spritesheet = new PIXI.Spritesheet({ texture: texture, data: manifestData });
                return spritesheet.parse().then(() => ({ type: 'character', charKey, spritesheet }));
            }).catch(error => {
                console.warn(`Could not load character texture for ${charKey} from ${imagePath}:`, error);
                return { type: 'character', charKey, spritesheet: null };
            });
            characterSpritesheetPromises.push(promise);
        }
        // --- FIX: Corrected the variable name in Promise.all() ---
        const loadedCharacters = await Promise.all(characterSpritesheetPromises);
        for (const part of loadedCharacters) {
            if (part.type === 'character' && part.spritesheet) { this.assets.characters[part.charKey] = part.spritesheet; }
        }

        return this.assets;
    }
}

export const assetManager = new AssetManager();