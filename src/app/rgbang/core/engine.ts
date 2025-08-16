import { Game } from './game';

class GameEngine {
    private static instance: Game;

    public static getInstance(): Game {
        if (!GameEngine.instance) {
            // The constructor is now simplified and doesn't need DOM elements initially.
            GameEngine.instance = new Game();
        }
        return GameEngine.instance;
    }
}

export const gameEngine = GameEngine.getInstance();