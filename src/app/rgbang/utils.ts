import { GameColor, COLOR_DETAILS, Shape } from './color';

export class Vec2 {
    constructor(public x: number = 0, public y: number = 0) {}

    add(other: Vec2): Vec2 {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    sub(other: Vec2): Vec2 {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    scale(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vec2 {
        const mag = this.magnitude();
        if (mag === 0) return new Vec2(0, 0);
        return new Vec2(this.x / mag, this.y / mag);
    }

    rotate(angle: number): Vec2 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    addInPlace(other: Vec2): this {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    subInPlace(other: Vec2): this {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    scaleInPlace(scalar: number): this {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    normalizeInPlace(): this {
        const mag = this.magnitude();
        if (mag !== 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }
}

export function distance(p1: { pos: Vec2 }, p2: { pos: Vec2 }): number {
    const dx = p1.pos.x - p2.pos.x;
    const dy = p1.pos.y - p2.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function circleCollision(c1: { pos: Vec2, radius: number }, c2: { pos: Vec2, radius: number }): boolean {
    const dist = distance(c1, c2);
    return dist < c1.radius + c2.radius;
}

export function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, pos: Vec2, size: number) {
    const height = size * (Math.sqrt(3) / 2);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - height / 2);
    ctx.lineTo(pos.x - size / 2, pos.y + height / 2);
    ctx.lineTo(pos.x + size / 2, pos.y + height / 2);
    ctx.closePath();
}

function drawSquare(ctx: CanvasRenderingContext2D, pos: Vec2, size: number) {
    ctx.beginPath();
    ctx.rect(pos.x - size / 2, pos.y - size / 2, size, size);
}

function drawCircle(ctx: CanvasRenderingContext2D, pos: Vec2, size: number) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
}

function drawCross(ctx: CanvasRenderingContext2D, pos: Vec2, size: number) {
    ctx.beginPath();
    ctx.moveTo(pos.x - size / 2, pos.y);
    ctx.lineTo(pos.x + size / 2, pos.y);
    ctx.moveTo(pos.x, pos.y - size / 2);
    ctx.lineTo(pos.x, pos.y + size / 2);
}

export function drawShape(ctx: CanvasRenderingContext2D, pos: Vec2, radius: number, shape: Shape, style: string, stroke = false) {
    ctx.save();
    const size = radius * 0.8;
    if(stroke) {
        ctx.strokeStyle = style;
        ctx.lineWidth = 2;
    } else {
        ctx.fillStyle = style;
    }

    switch (shape) {
        case 'circle':
            drawCircle(ctx, pos, size);
            break;
        case 'triangle':
            drawTriangle(ctx, pos, size);
            break;
        case 'square':
            drawSquare(ctx, pos, size);
            break;
        case 'mixed':
            drawCross(ctx, pos, size);
            break;
    }

    if(stroke) ctx.stroke();
    else ctx.fill();
    ctx.restore();
}

export function drawShapeForColor(ctx: CanvasRenderingContext2D, pos: Vec2, radius: number, color: GameColor, style: string, stroke = false) {
    const detail = COLOR_DETAILS[color];
    if (detail.shape === 'mixed' && detail.components) {
        const size = radius * 0.5;
        const offset = size * 0.4;
        const [comp1, comp2] = detail.components;
        drawShape(ctx, pos.add(new Vec2(-offset, 0)), size, COLOR_DETAILS[comp1].shape, style, stroke);
        drawShape(ctx, pos.add(new Vec2(offset, 0)), size, COLOR_DETAILS[comp2].shape, style, stroke);
    } else {
        drawShape(ctx, pos, radius, detail.shape, style, stroke);
    }
}

export class ObjectPool<T extends { reset: (...args: any[]) => void; isActive: boolean }> {
    private pool: T[] = [];
    private createFn: () => T;

    constructor(createFn: () => T, initialSize: number = 0) {
        this.createFn = createFn;
        for (let i = 0; i < initialSize; i++) {
            const obj = this.createFn();
            obj.isActive = false;
            this.pool.push(obj);
        }
    }

    get(...args: Parameters<T['reset']>): T {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.createFn();
        }
        obj.isActive = true;
        obj.reset(...args);
        return obj;
    }

    release(obj: T) {
        obj.isActive = false;
        this.pool.push(obj);
    }
}

interface Boundary {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface QuadtreeObject extends Boundary {
    entity: any;
}

export class Quadtree {
    private boundary: Boundary;
    private capacity: number;
    private objects: QuadtreeObject[] = [];
    private divided = false;
    private northeast!: Quadtree;
    private northwest!: Quadtree;
    private southeast!: Quadtree;
    private southwest!: Quadtree;

    constructor(boundary: Boundary, capacity: number) {
        this.boundary = boundary;
        this.capacity = capacity;
    }

    private subdivide() {
        const { x, y, width, height } = this.boundary;
        const hw = width / 2;
        const hh = height / 2;

        this.northeast = new Quadtree({ x: x + hw, y: y, width: hw, height: hh }, this.capacity);
        this.northwest = new Quadtree({ x: x, y: y, width: hw, height: hh }, this.capacity);
        this.southeast = new Quadtree({ x: x + hw, y: y + hh, width: hw, height: hh }, this.capacity);
        this.southwest = new Quadtree({ x: x, y: y + hh, width: hw, height: hh }, this.capacity);

        this.divided = true;
    }

    insert(obj: QuadtreeObject): boolean {
        if (!this.intersects(obj)) {
            return false;
        }

        if (this.objects.length < this.capacity) {
            this.objects.push(obj);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northeast.insert(obj)) return true;
        if (this.northwest.insert(obj)) return true;
        if (this.southeast.insert(obj)) return true;
        if (this.southwest.insert(obj)) return true;

        return false;
    }

    private intersects(range: Boundary): boolean {
        return !(
            range.x - range.width/2 > this.boundary.x + this.boundary.width ||
            range.x + range.width/2 < this.boundary.x ||
            range.y - range.height/2 > this.boundary.y + this.boundary.height ||
            range.y + range.height/2 < this.boundary.y
        );
    }

    query(range: Boundary, found: QuadtreeObject[] = []): QuadtreeObject[] {
        if (!this.intersects(range)) {
            return found;
        }

        for (const obj of this.objects) {
             const intersects =
                Math.abs(range.x - obj.x) * 2 < (range.width + obj.width) &&
                Math.abs(range.y - obj.y) * 2 < (range.height + obj.height);
            if (intersects) {
                found.push(obj);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }

    clear() {
        this.objects = [];
        this.divided = false;
        if (this.northeast) {
            this.northeast.clear();
            this.northwest.clear();
            this.southeast.clear();
            this.southwest.clear();
        }
    }
}