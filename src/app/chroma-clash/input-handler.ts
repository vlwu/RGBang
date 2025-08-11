import { Vec2 } from './utils';

class InputHandler {
    public keys: Set<string> = new Set();
    public mousePos: Vec2 = new Vec2();
    public isMouseDown: boolean = false;
    private canvas: HTMLCanvasElement | null = null;

    private static instance: InputHandler;

    // Make constructor private for singleton
    private constructor() {
        this.init();
    }
    
    // Static method to get instance
    public static getInstance(canvas?: HTMLCanvasElement): InputHandler {
        if (!InputHandler.instance) {
            InputHandler.instance = new InputHandler();
        }
        if (canvas && !InputHandler.instance.canvas) {
            InputHandler.instance.setCanvas(canvas);
        }
        return InputHandler.instance;
    }

    private setCanvas(canvas: HTMLCanvasElement) {
        if (this.canvas) {
            // Clean up old listeners if canvas is being replaced
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
        }
        this.canvas = canvas;
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('contextmenu', this.preventContextMenu);
    }
    
    private preventContextMenu = (e: MouseEvent) => e.preventDefault();

    private init() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }
    
    private handleKeyDown = (e: KeyboardEvent) => {
        this.keys.add(e.key.toLowerCase());
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.key.toLowerCase());
    }

    private handleMouseMove = (e: MouseEvent) => {
        if (!this.canvas) return;
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
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
        }
    }
}

export default InputHandler;
