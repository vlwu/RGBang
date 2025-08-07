import { Engine } from './src/core/Engine.js';

const gameContainer = document.getElementById('game-container');
const engine = new Engine(gameContainer);

// --- Resizing Logic ---
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

function resizeCanvas() {
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
    if (canvas) {
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
    }
}

// Initialize and start the game, then set up resizing
engine.init().then(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial resize
});