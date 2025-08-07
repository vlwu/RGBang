export class PlayerComponent {
    constructor(characterId = 'm_human') {
        this.state = 'idle';
        this.facingDirection = 'right';
        this.isTurning = false;
        this.isRolling = false;
        this.characterId = characterId;
    }
}