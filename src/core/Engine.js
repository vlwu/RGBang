import * as PIXI from 'pixi.js';
import { EntityManager } from './EntityManager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { InputSystem } from '../systems/InputSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';

export class Engine {
    constructor(container) {
        this.container = container;
        this.pixiApp = new PIXI.Application();
        this.entityManager = new EntityManager();
        this.systems = [];
    }

    async init() {
        // New: Initialize PixiJS Assets with texture preferences for pixel art
        await PIXI.Assets.init({
            texturePreference: {
                scaleMode: 'nearest',
            },
        });

        // Initialize PixiJS Application
        await this.pixiApp.init({
            width: 1920,
            height: 1080,
            backgroundColor: 0xFFFFFF, // White background
        });
        this.container.appendChild(this.pixiApp.canvas);

        // Load assets (the JSON file automatically loads the associated PNG)
        await PIXI.Assets.load('images/player/mPlayer Human.json');

        // Create player
        this.player = createPlayer(this.entityManager, this.pixiApp.screen.width / 2, this.pixiApp.screen.height / 2);

        // Initialize systems
        this.inputSystem = new InputSystem(this.entityManager);
        this.movementSystem = new MovementSystem(this.entityManager);
        this.renderSystem = new RenderSystem(this.entityManager, this.pixiApp.stage);

        this.systems = [
            this.inputSystem,
            this.movementSystem,
            this.renderSystem
        ];

        // Start the game loop
        this.pixiApp.ticker.add((ticker) => {
            this.update(ticker.deltaMS / 1000); // Convert delta to seconds
        });
    }

    update(dt) {
        // Update all systems
        for (const system of this.systems) {
            system.update(dt);
        }
    }
}