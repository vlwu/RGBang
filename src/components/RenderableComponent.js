export class RenderableComponent {
    constructor(sprite, spritesheet = null) {
        this.sprite = sprite; // This will hold the PixiJS Sprite object
        this.spritesheet = spritesheet; // This will hold the full animation data
    }
}