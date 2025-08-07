import { eventBus } from '../utils/event-bus.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class InputSystem {
    constructor(entityManager, gameState) {
        this.entityManager = entityManager;
        this.gameState = gameState;
        this.keys = new Set();

        this._boundKeyDown = this.handleKeyDown.bind(this);
        this._boundKeyUp = this.handleKeyUp.bind(this);
        this._boundBlur = this.handleBlur.bind(this);

        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener('keydown', this._boundKeyDown);
        window.addEventListener('keyup', this._boundKeyUp);
        window.addEventListener('blur', this._boundBlur);
    }

    destroy() {
        window.removeEventListener('keydown', this._boundKeyDown);
        window.removeEventListener('keyup', this._boundKeyUp);
        window.removeEventListener('blur', this._boundBlur);
    }

    handleBlur() {
        this.keys.clear();
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys.add(key);

        if (key === 'escape') {
            eventBus.publish('action_escape_pressed');
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys.delete(key);
    }

    update() {
        const entities = this.entityManager.query([PlayerComponent, InputComponent]);
        const keybinds = this.gameState.keybinds || { up: 'w', down: 's', left: 'a', right: 'd', roll: 'shift' };

        for (const entity of entities) {
            const input = this.entityManager.getComponent(entity, InputComponent);
            input.up = this.keys.has(keybinds.up);
            input.down = this.keys.has(keybinds.down);
            input.left = this.keys.has(keybinds.left);
            input.right = this.keys.has(keybinds.right);
            input.roll = this.keys.has(keybinds.roll);
        }
    }
}