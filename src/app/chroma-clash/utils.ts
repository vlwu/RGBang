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
}

export function distance(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function circleCollision(c1: { x: number, y: number, radius: number }, c2: { x: number, y: number, radius: number }): boolean {
    const dist = distance(c1, c2);
    return dist < c1.radius + c2.radius;
}

export function lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t;
}

export function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
