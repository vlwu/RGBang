import { eventBus } from '../utils/event-bus.js';

export class UISystem {
    constructor() {
        this.uiRoot = document.querySelector('rgbang-ui');
        if (!this.uiRoot) {
            console.error("RGBANG UI component not found in DOM!");
        }

        eventBus.subscribe('gameStateUpdated', (gameState) => {
            if (this.uiRoot) this.uiRoot.gameState = gameState;
        });
    }

    setGameStarted(hasStarted) {
        if (this.uiRoot) {
            this.uiRoot.gameHasStarted = hasStarted;
            if(!hasStarted) this.uiRoot.activeModal = 'main-menu';
        }
    }
    
    update(dt) {
        // The UI is event-driven and self-updates via Lit, so this can be minimal
    }
}