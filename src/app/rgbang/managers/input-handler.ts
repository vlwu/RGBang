import { Vec2 } from '../common/utils';

export interface Keybindings {
    up: string;
    down: string;
    left: string;
    right: string;
    shoot: string;
    primary1: string;
    primary2: string;
    primary3: string;
    comboRadial: string;
    dash: string;
    viewUpgrades: string;
}

export const defaultKeybindings: Keybindings = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd',
    shoot: 'mouse0',
    primary1: '1',
    primary2: '2',
    primary3: '3',
    comboRadial: 'mouse2',
    dash: ' ',
    viewUpgrades: 'shift',
}

class InputHandler {
    public keys: Set<string> = new Set();
    public keysUp: Set<string> = new Set();
    public mousePos: Vec2 = new Vec2();
    public wheelDeltaY: number = 0;
    private canvas: HTMLCanvasElement | null = null;
    public keybindings: Keybindings = defaultKeybindings;

    private static instance: InputHandler;

    private constructor() {

    }

    public static getInstance(): InputHandler {
        if (!InputHandler.instance) {
            InputHandler.instance = new InputHandler();
        }
        return InputHandler.instance;
    }

    public setKeybindings(keybindings: Keybindings) {
        this.keybindings = keybindings;
    }

    public setCanvas(canvas: HTMLCanvasElement) {

        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
            this.canvas.removeEventListener('wheel', this.handleWheel);

            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
        }

        this.canvas = canvas;

        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('contextmenu', this.preventContextMenu);
        this.canvas.addEventListener('wheel', this.handleWheel);

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        this.keys.add(e.key.toLowerCase());
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        this.keys.delete(key);
        this.keysUp.add(key);
    }

    private handleMouseMove = (e: MouseEvent) => {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.mousePos.x = (e.clientX - rect.left) * scaleX;
        this.mousePos.y = (e.clientY - rect.top) * scaleY;
    }

    private handleMouseDown = (e: MouseEvent) => {
        const key = `mouse${e.button}`;
        this.keys.add(key);
    }

    private handleMouseUp = (e: MouseEvent) => {
        const key = `mouse${e.button}`;
        this.keys.delete(key);
        this.keysUp.add(key);
    }

    private handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        this.wheelDeltaY = e.deltaY;
    }

    public resetEvents() {
        this.wheelDeltaY = 0;
        this.keysUp.clear();
    }

    public isKeyDown(key: string): boolean {
        return this.keys.has(key);
    }


    public isShooting(): boolean {
        return this.keys.has(this.keybindings.shoot);
    }

    public wasKeyReleased(key: string): boolean {
        return this.keysUp.has(key);
    }

    public destroy() {
        if (typeof window === 'undefined') return;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
            this.canvas.removeEventListener('wheel', this.handleWheel);
        }
        this.canvas = null;
        this.keys.clear();
        this.keysUp.clear();
        this.wheelDeltaY = 0;
    }
}

export default InputHandler;