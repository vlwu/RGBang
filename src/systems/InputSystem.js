import { InputComponent } from '../components/InputComponent.js';
import { PlayerComponent } from '../components/PlayerComponent.js';

export class InputSystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.keys = {};

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update() {
        const entities = this.entityManager.query([PlayerComponent, InputComponent]);
        for (const entity of entities) {
            const input = this.entityManager.getComponent(entity, InputComponent);
            input.up = this.keys['KeyW'] || this.keys['ArrowUp'] || false;
            input.down = this.keys['KeyS'] || this.keys['ArrowDown'] || false;
            input.left = this.keys['KeyA'] || this.keys['ArrowLeft'] || false;
            input.right = this.keys['KeyD'] || this.keys['ArrowRight'] || false;
        }
    }
}