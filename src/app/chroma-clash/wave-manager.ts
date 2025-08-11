import { Enemy, BaseEnemy, SplitterEnemy } from './enemy';
import { GameColor, PRIMARY_COLORS } from './color';

export class WaveManager {
    currentWave = 0;
    private waveTimer = 0;
    private timeBetweenWaves = 300; // 5 seconds
    private enemiesPerWave = 5;
    
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    
    public startNextWave() {
        this.currentWave++;
        this.waveTimer = this.timeBetweenWaves;
    }

    public update(enemies: Enemy[], createEnemy: (enemy: Enemy) => void) {
        if (enemies.length === 0 && this.waveTimer === 0) {
            this.startNextWave();
        }

        if (this.waveTimer > 0) {
            this.waveTimer--;
            if (this.waveTimer === 0 && this.currentWave > 0) {
                this.spawnWave(createEnemy);
            }
        }
    }
    
    private spawnWave(createEnemy: (enemy: Enemy) => void) {
        const numEnemies = this.enemiesPerWave + Math.floor(this.currentWave * 1.5);
        
        for (let i = 0; i < numEnemies; i++) {
            const edge = Math.floor(Math.random() * 4);
            let x, y;
            if (edge === 0) { // Top
                x = Math.random() * this.canvasWidth;
                y = -30;
            } else if (edge === 1) { // Right
                x = this.canvasWidth + 30;
                y = Math.random() * this.canvasHeight;
            } else if (edge === 2) { // Bottom
                x = Math.random() * this.canvasWidth;
                y = this.canvasHeight + 30;
            } else { // Left
                x = -30;
                y = Math.random() * this.canvasHeight;
            }

            let enemy: Enemy;
            const enemyTypeChance = Math.random();
            if (this.currentWave > 2 && enemyTypeChance < 0.3) {
                enemy = new SplitterEnemy(x, y);
            } else {
                enemy = new BaseEnemy(x, y);
            }
            createEnemy(enemy);
        }
    }
}
