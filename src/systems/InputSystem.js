import { eventBus } from '../utils/event-bus.js';
import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class InputSystem {
    constructor(entityManager, gameState) {
        this.entityManager = entityManager;
        this.gameState = gameState;
        this.keys = new Set();
        this.isShooting = false;

        this._boundKeyDown = this.handleKeyDown.bind(this);
        this._boundKeyUp = this.handleKeyUp.bind(this);
        this._boundMouseDown = this.handleMouseDown.bind(this);
        this._boundMouseUp = this.handleMouseUp.bind(this);
        this._boundBlur = this.handleBlur.bind(this);
        this._boundContextMenu = this.handleContextMenu.bind(this);

        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener('keydown', this._boundKeyDown);
        window.addEventListener('keyup', this._boundKeyUp);
        window.addEventListener('mousedown', this._boundMouseDown);
        window.addEventListener('mouseup', this._boundMouseUp);
        window.addEventListener('blur', this._boundBlur);
        window.addEventListener('contextmenu', this._boundContextMenu);
    }

    destroy() {
        window.removeEventListener('keydown', this._boundKeyDown);
        window.removeEventListener('keyup', this._boundKeyUp);
        window.removeEventListener('mousedown', this._boundMouseDown);
        window.removeEventListener('mouseup', this._boundMouseUp);
        window.removeEventListener('blur', this._boundBlur);
        window.removeEventListener('contextmenu', this._boundContextMenu);
    }

    handleContextMenu(e) {
        e.preventDefault();
    }

    handleBlur() {
        this.keys.clear();
        this.isShooting = false;
    }

    handleMouseDown(e) {
        if (e.button === 0) {
            this.isShooting = true;
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) {
            this.isShooting = false;
        }
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

            input.shoot = this.isShooting;

            input.switchWeapon1 = this.keys.has('1');
            input.switchWeapon2 = this.keys.has('2');
            input.switchWeapon3 = this.keys.has('3');
        }
    }
}