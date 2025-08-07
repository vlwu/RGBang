import * as PIXI from 'pixi.js';

async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

const coreImagePaths = {
    font_spritesheet: 'images/ui/Text (White) (8x10).png',
    settings_icon: 'images/ui/Settings.png',
    pause_icon: 'images/ui/Pause.png',
    play_icon: 'images/ui/Play.png',
    levels_icon: 'images/ui/Levels.png',
    character_icon: 'images/ui/Character.png',
    info_icon: 'images/ui/Info.png',
    editor_icon: 'images/ui/Editor.png',
    close_button: 'images/ui/Close.png',
    restart_button: 'images/ui/Restart.png',
    previous_button: 'images/ui/Previous.png',
    next_button: 'images/ui/Next.png',
};

const characterData = {
    PinkMan: { path: 'images/player/' },
    NinjaFrog: { path: 'images/player/' },
    MaskDude: { path: 'images/player/' },
    VirtualGuy: { path: 'images/player/' },
};

class AssetManager {
    constructor() {
        this.assets = { characters: {} };
    }

    async loadCoreAssets() {
        await PIXI.Assets.init({
            texturePreference: {
                scaleMode: 'nearest',
            },
        });

        const imagePromises = Object.entries(coreImagePaths).map(([key, src]) =>
            loadImage(src).then(img => ({ [key]: img }))
        );

        const characterPromises = [];
        for (const charKey in characterData) {
            const jsonPath = `${characterData[charKey].path}mPlayer Human.json`;
            const promise = PIXI.Assets.load(jsonPath)
                .then(spritesheet => ({ type: 'character', charKey, spritesheet }));
            characterPromises.push(promise);
        }

        const loadedParts = await Promise.all([...imagePromises, ...characterPromises]);

        for (const part of loadedParts) {
            if (part.type === 'character') {
                this.assets.characters[part.charKey] = part.spritesheet;
            } else {
                Object.assign(this.assets, part);
            }
        }
        return this.assets;
    }
}

export const assetManager = new AssetManager();