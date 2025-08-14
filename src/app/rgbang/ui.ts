import { Player } from './player';
import { GameColor, COLOR_DETAILS, ALL_COLORS } from './color';
import { Boss } from './boss';
import { roundRect, drawShapeForColor } from './utils';
import { Vec2 } from './utils';
import { Enemy } from './enemy';

export class UI {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    draw(player: Player, score: number, boss: Boss | null, currentWave: number, enemies: Enemy[], currentWaveCountdown: number, isBetweenWaves: boolean) {
        this.drawHealthBar(player);
        this.drawHotbar(player);
        this.drawScore(score, !!boss);
        this.drawWaveNumber(currentWave);
        if (boss && boss.isAlive) {
            this.drawBossHealthBar(boss);
        } else {
            this.drawEnemyCount(enemies.length);
        }
        this.drawScoreMultiplier(player.scoreMultiplier);
        this.drawOffscreenIndicators(enemies);

        if (isBetweenWaves) {
            this.drawWaveCountdown(currentWaveCountdown);
        }
    }

    private drawHealthBar(player: Player) {
        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = 20;
        const borderRadius = 10;
        const maxHealth = player.getMaxHealth();

        this.ctx.save();


        this.ctx.fillStyle = 'rgba(75, 85, 99, 0.5)';
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();


        const healthPercentage = player.health / maxHealth;
        const healthWidth = barWidth * healthPercentage;

        this.ctx.fillStyle = '#4ade80';
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, healthWidth > 0 ? healthWidth : 0, barHeight, borderRadius);
        this.ctx.fill();


        this.ctx.strokeStyle = 'rgba(229, 231, 235, 0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();


        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${Math.round(player.health)} / ${maxHealth}`, x + barWidth / 2, y + barHeight / 2 + 1);
        this.ctx.restore();
    }

    private drawBossHealthBar(boss: Boss) {
        const barWidth = this.canvas.width * 0.6;
        const barHeight = 25;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 20;
        const borderRadius = 12;

        this.ctx.save();


        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();


        const healthPercentage = boss.health / boss.maxHealth;
        const healthWidth = barWidth * healthPercentage;

        this.ctx.fillStyle = COLOR_DETAILS[boss.color].hex;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, healthWidth > 0 ? healthWidth : 0, barHeight, borderRadius);
        this.ctx.fill();


        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();


        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText('B O S S', x + barWidth / 2, y + barHeight / 2 + 1);

        this.ctx.restore();
    }

    private drawHotbar(player: Player) {
        const boxSize = 45;
        const spacing = 10;
        const totalWidth = (boxSize + spacing) * ALL_COLORS.length - spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = this.canvas.height - boxSize - 20;
        const borderRadius = 8;

        this.ctx.save();
        this.ctx.font = 'bold 18px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        ALL_COLORS.forEach((color, index) => {
            const x = startX + index * (boxSize + spacing);
            const detail = COLOR_DETAILS[color];
            const isAvailable = player.availableColors.has(color);


            this.ctx.fillStyle = detail.hex;
            this.ctx.globalAlpha = isAvailable ? 0.8 : 0.2;
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
            this.ctx.fill();


            const shapePos = new Vec2(x + boxSize / 2, y + boxSize / 2);
            drawShapeForColor(this.ctx, shapePos, boxSize * 0.4, color, isAvailable ? 'black' : 'rgba(0,0,0,0.5)');


            if (player.currentColor === color) {
                this.ctx.strokeStyle = '#7DF9FF';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#7DF9FF';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
                this.ctx.stroke();
                this.ctx.shadowColor = 'transparent';
            } else if (isAvailable) {
                 this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                 this.ctx.lineWidth = 1;
                 this.ctx.beginPath();
                 roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
                 this.ctx.stroke();
            }
        });

        this.ctx.restore();
    }

    private drawScore(score: number, isBossActive: boolean) {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px "Space Grotesk"';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;

        this.ctx.fillText(`Score: ${Math.round(score)}`, this.canvas.width - 20, isBossActive ? 60 : 20);
        this.ctx.restore();
    }

    private drawWaveNumber(waveNumber: number) {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 32px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;

        this.ctx.fillText(`WAVE ${waveNumber}`, this.canvas.width / 2, 20);
        this.ctx.restore();
    }

    private drawEnemyCount(count: number) {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px "Space Grotesk"';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;

        this.ctx.fillText(`Enemies: ${count}`, this.canvas.width - 20, 50);
        this.ctx.restore();
    }

    private drawOffscreenIndicators(enemies: Enemy[]) {
        const padding = 20;
        const indicatorSize = 8;

        enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const isOffScreen =
                enemy.pos.x < 0 ||
                enemy.pos.x > this.canvas.width ||
                enemy.pos.y < 0 ||
                enemy.pos.y > this.canvas.height;

            if (isOffScreen) {
                const x = Math.max(padding, Math.min(enemy.pos.x, this.canvas.width - padding));
                const y = Math.max(padding, Math.min(enemy.pos.y, this.canvas.height - padding));

                const angle = Math.atan2(enemy.pos.y - y, enemy.pos.x - x);

                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle);
                this.ctx.fillStyle = enemy.hexColor;
                this.ctx.globalAlpha = 0.9;
                this.ctx.shadowColor = enemy.hexColor;
                this.ctx.shadowBlur = 5;

                this.ctx.beginPath();
                this.ctx.moveTo(indicatorSize, 0);
                this.ctx.lineTo(-indicatorSize / 2, -indicatorSize / 2);
                this.ctx.lineTo(-indicatorSize / 2, indicatorSize / 2);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.restore();
            }
        });
    }

    private drawScoreMultiplier(multiplier: number) {
        if (multiplier <= 1) return;

        this.ctx.save();
        this.ctx.fillStyle = '#ffff66';
        this.ctx.font = 'bold 18px "Space Grotesk"';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = '#ffff66';
        this.ctx.shadowBlur = 5;


        this.ctx.fillText(`Multiplier: x${multiplier.toFixed(1)}`, this.canvas.width - 20, 80);
        this.ctx.restore();
    }

    private drawWaveCountdown(countdown: number) {
        if (countdown <= 0) return;

        this.ctx.save();
        this.ctx.fillStyle = '#7DF9FF';
        this.ctx.font = 'bold 48px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = '#7DF9FF';
        this.ctx.shadowBlur = 15;

        this.ctx.fillText(`${countdown}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
    }
}