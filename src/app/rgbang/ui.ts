import { Player } from './player';
import { GameColor, COLOR_DETAILS, PRIMARY_COLORS } from './color';

export class UI {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }
    
    draw(player: Player, score: number) {
        this.drawHealthBar(player);
        this.drawHotbar(player);
        this.drawScore(score);
        this.drawDashCooldown(player);
    }

    private drawHealthBar(player: Player) {
        const barWidth = 200;
        const barHeight = 20;
        const x = 20;
        const y = 20;
        
        this.ctx.save();
        this.ctx.fillStyle = '#4B5563'; // gray-600
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        const healthPercentage = player.health / player.maxHealth;
        this.ctx.fillStyle = '#4ade80'; // green-400
        this.ctx.fillRect(x, y, barWidth * healthPercentage, barHeight);
        
        this.ctx.strokeStyle = '#E5E7EB'; // gray-200
        this.ctx.strokeRect(x, y, barWidth, barHeight);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${Math.round(player.health)} / ${player.maxHealth}`, x + barWidth / 2, y + barHeight / 2);
        this.ctx.restore();
    }

    private drawDashCooldown(player: Player) {
        const x = 20;
        const y = 50;
        const height = 10;
        const width = 200;

        this.ctx.save();
        this.ctx.fillStyle = '#374151'; // Gray 700
        this.ctx.fillRect(x, y, width, height);

        const progress = 1 - player.getDashCooldownProgress();
        this.ctx.fillStyle = '#7DF9FF'; // Accent
        this.ctx.fillRect(x, y, width * progress, height);
        
        this.ctx.strokeStyle = '#9CA3AF'; // Gray 400
        this.ctx.strokeRect(x, y, width, height);
        
        if (progress >= 1) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 10px "Space Grotesk"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('DASH READY', x + width / 2, y + height / 2);
        }
        
        this.ctx.restore();
    }

    private drawHotbar(player: Player) {
        const boxSize = 40;
        const spacing = 10;
        const totalWidth = (boxSize + spacing) * PRIMARY_COLORS.length - spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = this.canvas.height - boxSize - 20;

        this.ctx.save();
        this.ctx.font = 'bold 16px "Space Grotesk"';
        this.ctx.textAlign = 'center';

        PRIMARY_COLORS.forEach((color, index) => {
            const x = startX + index * (boxSize + spacing);
            const detail = COLOR_DETAILS[color];
            
            this.ctx.fillStyle = detail.hex;
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillRect(x, y, boxSize, boxSize);

            if (player.primaryColor === color || player.secondaryColor === color) {
                this.ctx.strokeStyle = '#7DF9FF'; // Accent color
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - 1, y - 1, boxSize + 2, boxSize + 2);
            }
            
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'black';
            this.ctx.fillText(detail.key, x + boxSize / 2, y + boxSize / 2 + 5);
        });

        // Draw current color
        const currentColor = player.currentColor;
        const currentColorDetail = COLOR_DETAILS[currentColor];
        const currentX = startX + totalWidth + spacing * 2;
        
        this.ctx.fillStyle = currentColorDetail.hex;
        this.ctx.fillRect(currentX, y, boxSize * 1.5, boxSize);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(currentX, y, boxSize * 1.5, boxSize);
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('FIRE', currentX + (boxSize * 1.5) / 2, y + boxSize / 2 + 5);
        
        this.ctx.restore();
    }

    private drawScore(score: number) {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px "Space Grotesk"';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';

        this.ctx.fillText(`Score: ${score}`, this.canvas.width - 20, 20);
        this.ctx.restore();
    }
}
