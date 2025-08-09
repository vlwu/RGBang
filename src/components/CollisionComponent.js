export class CollisionComponent {
    /**
     * @param {object} options
     * @param {string} [options.shape='circle'] - The shape of the collision body.
     * @param {number} [options.radius=16] - The radius for a circle shape.
     * @param {number} [options.offsetX=0] - X offset from the entity's position.
     * @param {number} [options.offsetY=0] - Y offset from the entity's position.
     * @param {boolean} [options.isDynamic=false] - If true, this entity will be moved during collision resolution.
     */
    constructor({ shape = 'circle', radius = 16, offsetX = 0, offsetY = 0, isDynamic = false }) {
        this.shape = shape;
        this.radius = radius;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.isDynamic = isDynamic;
    }
}