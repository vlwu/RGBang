import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class InputSystem {
    constructor(entityManager, gameState) {
        this.entityManager = entityManager;
        this.gameState = gameState; 
        this.keys = {};

        window.addEventListener('keydown', (e) => this.keys[e.code.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code.toLowerCase()] = false);
    }

    update() {
        const entities = this.entityManager.query([PlayerComponent, InputComponent]);
        const keybinds = this.gameState.keybinds || { up: 'w', down: 's', left: 'a', right: 'd'};
        
        for (const entity of entities) {
            const input = this.entityManager.getComponent(entity, InputComponent);
            input.up = this.keys[`key${keybinds.up}`] || this.keys[keybinds.up] || false;
            input.down = this.keys[`key${keybinds.down}`] || this.keys[keybinds.down] || false;
            input.left = this.keys[`key${keybinds.left}`] || this.keys[keybinds.left] || false;
            input.right = this.keys[`key${keybinds.right}`] || this.keys[keybinds.right] || false;
        }
    }
}