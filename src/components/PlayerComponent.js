export class PlayerComponent {
    constructor(characterId = 'm_human', availableWeapons = ['gun_red', 'gun_blue', 'gun_yellow']) {
        this.state = 'idle';
        this.facingDirection = 'right';
        this.isTurning = false;
        this.isRolling = false;
        this.characterId = characterId;
        this.rollCooldown = 0;
        this.rollDirectionX = 0;
        this.rollDirectionY = 0;
        this.availableWeapons = availableWeapons;
        this.equippedWeaponIndex = 0;
    }
}