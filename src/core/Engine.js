import * as PIXI from 'pixi.js';
import { EntityManager } from './EntityManager.js';
import { createPlayer } from '../entities/entity-factory.js';
import { InputSystem } from '../systems/InputSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { CooldownSystem } from '../systems/CooldownSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { BulletSystem } from '../systems/BulletSystem.js';
import { GameState } from '../managers/GameState.js';
import { SoundManager } from '../managers/SoundManager.js';
import { UISystem } from '../systems/UISystem.js';
import { eventBus } from '../utils/event-bus.js';
import { PlayerComponent } from '../components/PlayerComponent.js';
import { RenderableComponent } from '../components/RenderableComponent.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { MapSystem } from '../systems/MapSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';

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

        this.worldContainer = new PIXI.Container();
        this.worldContainer.sortableChildren = true;
        this.pixiApp.stage.addChild(this.worldContainer);
        this.pixiApp.stage.interactive = true;
        this.pixiApp.stage.hitArea = this.pixiApp.screen;


        this.gameState = new GameState();
        this.soundManager = new SoundManager();
        this.uiSystem = new UISystem();




        const initialCharacterId = this.gameState.selectedCharacter;
        const initialSpritesheet = this.assets.characters[initialCharacterId];
        this.player = createPlayer(this.entityManager, 0, 0, initialCharacterId, initialSpritesheet, this.assets, this.gameState);


        this.mapSystem = new MapSystem(this.entityManager, this.worldContainer, this.player, this.assets);



        this.inputSystem = new InputSystem(this.entityManager, this.gameState);
        this.movementSystem = new MovementSystem(this.entityManager);
        this.cooldownSystem = new CooldownSystem(this.entityManager);
        this.weaponSystem = new WeaponSystem(this.entityManager, this.worldContainer, this.assets);
        this.bulletSystem = new BulletSystem(this.entityManager);
        this.renderSystem = new RenderSystem(this.entityManager, this.worldContainer);
        this.cameraSystem = new CameraSystem(this.entityManager, this.worldContainer, this.pixiApp.screen, this.player);

        this.systems = [
            this.inputSystem,
            this.movementSystem,
            this.weaponSystem,
            this.bulletSystem,
            this.cooldownSystem,
            this.mapSystem,
            this.cameraSystem,
            this.renderSystem,
            this.uiSystem,
        ];

        eventBus.subscribe('requestStartGame', () => this.start());
        eventBus.subscribe('menuOpened', () => this.pause());
        eventBus.subscribe('allMenusClosed', () => this.resume());
        eventBus.subscribe('exitToMenu', () => this.stop());
        eventBus.subscribe('characterUpdated', (charId) => this.updatePlayerCharacter(charId));

        this.pixiApp.ticker.add((ticker) => {
            if (this.isRunning) {
                this.update(ticker.deltaMS / 1000);
                this.publishHudData(Math.round(ticker.FPS));
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
        eventBus.publish('gamePaused');
    }

    resume() {
        if (!this.isRunning) return;
        this.pixiApp.ticker.start();
        eventBus.publish('gameResumed');
    }

    update(dt) {
        for (const system of this.systems) {
            system.update(dt);
        }
    }

    publishHudData(fps) {
        if (this.player === null) return;
        const playerComp = this.entityManager.getComponent(this.player, PlayerComponent);
        const healthComp = this.entityManager.getComponent(this.player, HealthComponent);

        if (playerComp && healthComp) {
            eventBus.publish('hudUpdate', {
                health: {
                    current: healthComp.currentHealth,
                    max: healthComp.maxHealth,
                },
                weapons: {
                    available: playerComp.availableWeapons,
                    activeIndex: playerComp.equippedWeaponIndex,
                },
                fps,
            });
        }
    }

    updatePlayerCharacter(characterId) {
        if (this.player === null) return;
        const playerComp = this.entityManager.getComponent(this.player, PlayerComponent);
        if (playerComp && playerComp.characterId !== characterId) {
            playerComp.characterId = characterId;
            const renderable = this.entityManager.getComponent(this.player, RenderableComponent);
            const newSpritesheet = this.assets.characters[characterId];
            if (renderable && newSpritesheet) {
                renderable.spritesheet = newSpritesheet;
                const sprite = renderable.sprite;
                const currentAnimation = playerComp.state === 'turning' ? 'turn' : playerComp.state;
                sprite.textures = newSpritesheet.animations[currentAnimation] || newSpritesheet.animations.idle;
                sprite.play();
            }
        }
    }
}