export class PlayerComponent {
    constructor(characterId = 'PinkMan') {
        this.state = 'idle';
        this.facingDirection = 'right';
        this.isTurning = false;
        this.characterId = characterId;
    }
}