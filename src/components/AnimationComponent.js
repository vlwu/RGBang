export class AnimationComponent {
    constructor({ frames = [], frameDuration = 0.1, loops = true } = {}) {
        this.frames = frames; // array of tile IDs
        this.frameDuration = frameDuration;
        this.loops = loops;
        this.currentFrameIndex = 0;
        this.timer = 0;
    }
}