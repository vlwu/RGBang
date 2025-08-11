import { Vec2 } from './utils';

export interface Keybindings {
    up: string;
    down: string;
    left: string;
    right: string;
    primary1: string;
    primary2: string;
    primary3: string;
    combine: string;
    dash: string;
}

export const defaultKeybindings: Keybindings = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    primary1: '1',
    primary2: '2',
    primary3: '3',
    combine: 'shift',
    dash: ' ',
}

class InputHandler {
    public keys: Set<string> = new Set();
    public mousePos: Vec2 = new Vec2();
    public isMouseDown: boolean = false;
    public wheelDeltaY: number = 0;
    private canvas: HTMLCanvasElement | null = null;
    public keybindings: Keybindings = defaultKeybindings;

    private static instance: InputHandler;

    private constructor() {
        this.init();
    }
    
    public static getInstance(canvas?: HTMLCanvasElement): InputHandler {
        if (!InputHandler.instance) {
            InputHandler.instance = new InputHandler();
        }
        if (canvas && !InputHandler.instance.canvas) {
            InputHandler.instance.setCanvas(canvas);
        }
        return InputHandler.instance;
    }
    
    public setKeybindings(keybindings: Keybindings) {
        this.keybindings = keybindings;
    }

    private setCanvas(canvas: HTMLCanvasElement) {
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
            this.canvas.removeEventListener('wheel', this.handleWheel);
        }
        this.canvas = canvas;
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('contextmenu', this.preventContextMenu);
        this.canvas.addEventListener('wheel', this.handleWheel);
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
    
    private handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        this.wheelDeltaY = e.deltaY;
    }
    
    public resetScroll() {
        this.wheelDeltaY = 0;
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
            this.canvas.removeEventListener('wheel', this.handleWheel);
        }
    }
}

export default InputHandler;
