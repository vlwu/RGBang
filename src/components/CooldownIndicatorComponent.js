import * as PIXI from 'pixi.js';

export class CooldownIndicatorComponent {
    constructor(targetEntityId, { width = 40, height = 3, yOffset = -30 } = {}) {
        this.graphics = new PIXI.Graphics();
        this.targetEntityId = targetEntityId;
        this.width = width;
        this.height = height;
        this.yOffset = yOffset;
    }
}