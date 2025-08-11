import { Vec2 } from './utils';

class InputHandler {
    public keys: Set<string> = new Set();
    public mousePos: Vec2 = new Vec2();
    public isMouseDown: boolean = false;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        this.keys.add(e.key.toLowerCase());
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.key.toLowerCase());
    }

    private handleMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }

    private handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0) { // Left click
            this.isMouseDown = true;
        }
    }
    
    private handleMouseUp = (e: MouseEvent) => {
        if (e.button === 0) {
            this.isMouseDown = false;
        }
    }

    public isKeyDown(key: string): boolean {
        return this.keys.has(key);
    }
    
    public destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }
}

export default InputHandler;
