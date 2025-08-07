import { Engine } from './src/core/Engine.js';

// Get the container for our game
const gameContainer = document.getElementById('game-container');

// Create a new instance of the game engine
const engine = new Engine(gameContainer);

// Initialize and start the game
engine.init();