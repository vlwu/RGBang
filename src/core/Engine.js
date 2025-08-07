import * as PIXI from 'pixi.js';
import { EntityManager } from './EntityManager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { InputSystem } from '../systems/InputSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { GameState } from '../managers/GameState.js';
import { SoundManager } from '../managers/SoundManager.js';
import { UISystem } from '../systems/UISystem.js';
import { eventBus } from '../utils/event-bus.js';

export class Engine {
    constructor(container, assets) {
        this.container = container;
        this.assets = assets;
        this.pixiApp = new PIXI.Application();
        this.entityManager = new EntityManager();
        this.systems = [];
        this.isRunning = false;
    }

    async init() {
        await this.pixiApp.init({
            width: 1920,
            height: 1080,
            backgroundAlpha: 0,
        });
        this.container.appendChild(this.pixiApp.canvas);

        this.gameState = new GameState();
        this.soundManager = new SoundManager();
        this.uiSystem = new UISystem();

        this.player = createPlayer(this.entityManager, this.pixiApp.screen.width / 2, this.pixiApp.screen.height / 2);

        this.inputSystem = new InputSystem(this.entityManager, this.gameState);
        this.movementSystem = new MovementSystem(this.entityManager);
        this.renderSystem = new RenderSystem(this.entityManager, this.pixiApp.stage);

        this.systems = [
            this.inputSystem,
            this.movementSystem,
            this.renderSystem,
            this.uiSystem,
        ];

        eventBus.subscribe('requestStartGame', () => this.start());
        eventBus.subscribe('menuOpened', () => this.pause());
        eventBus.subscribe('allMenusClosed', () => this.resume());
        eventBus.subscribe('exitToMenu', () => this.stop());

        this.pixiApp.ticker.add((ticker) => {
            if (this.isRunning) {
                this.update(ticker.deltaMS / 1000);
            }
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.uiSystem.setGameStarted(true);
        this.pixiApp.ticker.start();
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.uiSystem.setGameStarted(false);
        this.pixiApp.ticker.stop();
    }

    pause() {
        if (!this.isRunning) return;
        this.pixiApp.ticker.stop();
    }

    resume() {
        if (!this.isRunning) return;
        this.pixiApp.ticker.start();
    }

    update(dt) {
        for (const system of this.systems) {
            system.update(dt);
        }
    }
}