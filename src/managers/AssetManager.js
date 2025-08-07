import * as PIXI from 'pixi.js';

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

const characterData = {
    m_human: { json: 'images/player/mPlayer Human.json' },
    f_human: { json: 'images/player/fPlayer Human.json' },
    m_elf:   { json: 'images/player/mPlayer Elf.json' },
    f_elf:   { json: 'images/player/fPlayer Elf.json' },
    m_dwarf: { json: 'images/player/mPlayer Dwarf.json' },
    f_dwarf: { json: 'images/player/fPlayer Dwarf.json' },
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
            loadImage(src, key).then(img => ({ [key]: img }))
        );

        const characterPromises = [];
        for (const charKey in characterData) {
            const jsonPath = characterData[charKey].json;
            const promise = PIXI.Assets.load(jsonPath)
                .then(spritesheet => ({ type: 'character', charKey, spritesheet }))
                .catch(error => {
                    console.warn(`Could not load character spritesheet for ${charKey} from ${jsonPath}:`, error);
                    return { type: 'character', charKey, spritesheet: null };
                });
            characterPromises.push(promise);
        }

        const loadedParts = await Promise.all([...imagePromises, ...characterPromises]);

        for (const part of loadedParts) {
            if (part.type === 'character') {
                if(part.spritesheet) {
                    this.assets.characters[part.charKey] = part.spritesheet;
                }
            } else {
                Object.assign(this.assets, part);
            }
        }
        return this.assets;
    }
}

export const assetManager = new AssetManager();