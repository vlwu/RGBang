import { Player } from './player';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS } from './color';
import { Boss } from './boss';
import { roundRect } from './utils';

export class UI {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }
    
    draw(player: Player, score: number, boss: Boss | null) {
        this.drawHealthBar(player);
        this.drawHotbar(player);
        this.drawScore(score);
        if (boss && boss.isAlive) {
            this.drawBossHealthBar(boss);
        }
    }

    private drawHealthBar(player: Player) {
        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = 20;
        const borderRadius = 10;
        
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = 'rgba(75, 85, 99, 0.5)'; // gray-600 with transparency
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();
        
        // Health
        const healthPercentage = player.health / player.maxHealth;
        const healthWidth = barWidth * healthPercentage;
        
        this.ctx.fillStyle = '#4ade80'; // green-400
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, healthWidth > 0 ? healthWidth : 0, barHeight, borderRadius);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = 'rgba(229, 231, 235, 0.7)'; // gray-200 with transparency
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();
        
        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${Math.round(player.health)} / ${player.maxHealth}`, x + barWidth / 2, y + barHeight / 2 + 1);
        this.ctx.restore();
    }
    
    private drawBossHealthBar(boss: Boss) {
        const barWidth = this.canvas.width * 0.6;
        const barHeight = 25;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 20;
        const borderRadius = 12;

        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();

        // Health
        const healthPercentage = boss.health / boss.maxHealth;
        const healthWidth = barWidth * healthPercentage;

        this.ctx.fillStyle = COLOR_DETAILS[boss.color].hex;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, healthWidth > 0 ? healthWidth : 0, barHeight, borderRadius);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();
        
        // Text
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
        const totalWidth = (boxSize + spacing) * PRIMARY_COLORS.length - spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = this.canvas.height - boxSize - 20;
        const borderRadius = 8;

        this.ctx.save();
        this.ctx.font = 'bold 18px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        PRIMARY_COLORS.forEach((color, index) => {
            const x = startX + index * (boxSize + spacing);
            const detail = COLOR_DETAILS[color];
            
            // Background box
            this.ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
            this.ctx.fill();
            
            // Color indicator
            this.ctx.fillStyle = detail.hex;
            this.ctx.globalAlpha = 0.9;
            this.ctx.beginPath();
            roundRect(this.ctx, x + 3, y + 3, boxSize - 6, boxSize - 6, borderRadius-2);
            this.ctx.fill();


            // Selection highlight
            if (player.primaryColor === color || player.secondaryColor === color) {
                this.ctx.strokeStyle = '#7DF9FF'; // Accent color
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#7DF9FF';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
                this.ctx.stroke();
                this.ctx.shadowColor = 'transparent'; // reset shadow
            } else {
                 this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                 this.ctx.lineWidth = 1;
                 this.ctx.beginPath();
                 roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
                 this.ctx.stroke();
            }
            
            // Keybinding text
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'white';
            this.ctx.shadowColor = 'black';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(detail.key, x + boxSize / 2, y + boxSize / 2 + 2);
        });
        
        this.ctx.restore();
    }

    private drawScore(score: number) {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px "Space Grotesk"';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;

        this.ctx.fillText(`Score: ${score}`, this.canvas.width - 20, 20);
        this.ctx.restore();
    }
}
