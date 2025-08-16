import { Vec2 } from './utils';
import { GameColor } from './color';

export interface IVortex {
    pos: Vec2;
    radius: number;
    strength: number;
    lifespan: number;
}

export interface IActionCallbacks {
    dealAreaDamage: (pos: Vec2, radius: number, damage: number, color: GameColor) => void;
    createSlowField: (pos: Vec2, radius: number, lifespan: number) => void;
}