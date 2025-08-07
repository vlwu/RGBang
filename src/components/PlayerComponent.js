export class PlayerComponent {
    constructor() {
        this.state = 'idle'; // Current animation state: 'idle', 'run', 'turning', etc.
        this.facingDirection = 'right'; // 'left' or 'right'
        this.isTurning = false;
    }
}