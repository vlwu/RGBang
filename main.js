import { Engine } from './src/core/Engine.js';
import { assetManager } from './src/managers/AssetManager.js';
import { FontRenderer } from './src/ui/font-renderer.js';
import './src/ui/ui-main.js';
import { eventBus } from './src/utils/event-bus.js';

const gameContainer = document.getElementById('game-container');
let engine;

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

function resizeCanvas() {
    if (!engine || !engine.pixiApp.canvas) return;
    const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
    const windowRatio = window.innerWidth / window.innerHeight;
    let newWidth, newHeight;

    if (windowRatio > aspectRatio) {
        newHeight = window.innerHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = window.innerWidth;
        newHeight = newWidth / aspectRatio;
    }

    const canvas = engine.pixiApp.canvas;
    const uiRoot = document.getElementById('ui-root');

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;

    if(uiRoot) {
        uiRoot.style.width = `${newWidth}px`;
        uiRoot.style.height = `${newHeight}px`;
    }
}

async function main() {
    await assetManager.loadCoreAssets();

    engine = new Engine(gameContainer, assetManager.assets);
    await engine.init();

    const fontRenderer = new FontRenderer(assetManager.assets.font_spritesheet);
    const uiRootEl = document.querySelector('rgbang-ui');
    if (uiRootEl) {
        uiRootEl.fontRenderer = fontRenderer;
        uiRootEl.assets = assetManager.assets;
        uiRootEl.gameState = engine.gameState;

        eventBus.subscribe('gameStateUpdated', (gameState) => {
            uiRootEl.gameState = gameState;
        });
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

main();