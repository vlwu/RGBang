import * as PIXI from 'pixi.js';

export class WeaponComponent {
    /**
     * @param {string} initialWeaponId
     * @param {PIXI.Sprite} gunSprite
     */
    constructor(initialWeaponId, gunSprite) {
        this.currentWeaponId = initialWeaponId;
        this.fireCooldown = 0;
        this.gunSprite = gunSprite;
    }
}