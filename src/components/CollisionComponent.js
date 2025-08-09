export class CollisionComponent {
    constructor({ shape = 'circle', radius = 16, width, height, offsetX = 0, offsetY = 0, isDynamic = false }) {
        this.shape = shape;
        this.radius = radius;
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.isDynamic = isDynamic;
    }
}