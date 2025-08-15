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

    private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result, 16),
            g: parseInt(result, 16),
            b: parseInt(result, 16)
        } : null;
    }

    private drawText(text: string, x: number, y: number, size: number, color: string, align: 'left' | 'right' | 'center' = 'left') {
        this.ctx.save();
        this.ctx.font = `bold ${size}px "Space Grotesk"`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';

        this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }


    draw(player: Player, score: number, boss: Boss | null, currentWave: number, enemies: Enemy[], currentWaveCountdown: number, isBetweenWaves: boolean) {
        const liveEnemies = enemies.filter(e => e.isAlive);

        this.drawHealthBar(player);
        this.drawDashCooldownBar(player);
        this.drawHotbar(player);

        if (boss && boss.isAlive) {
            this.drawBossHealthBar(boss);
            this.drawTopRightUI(score, 0, player.scoreMultiplier, 60);
        } else {
            this.drawWaveInfo(currentWave, isBetweenWaves);
            this.drawTopRightUI(score, liveEnemies.length, player.scoreMultiplier, 20);
        }

        this.drawOffscreenIndicators(liveEnemies);

        if (isBetweenWaves) {
            this.drawWaveCountdown(currentWaveCountdown);
        }
    }

    private drawHealthBar(player: Player) {
        const barWidth = 250;
        const barHeight = 25;
        const x = 20;
        const y = 20;
        const borderRadius = 12;
        const maxHealth = player.getMaxHealth();
        const healthPercentage = player.health / maxHealth;

        this.ctx.save();


        this.ctx.fillStyle = 'rgba(20, 20, 30, 0.6)';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();
        this.ctx.shadowColor = 'transparent';


        const healthWidth = barWidth * healthPercentage;

        if (healthWidth > 0) {

            const highHealthColor = { r: 74, g: 222, b: 128 };
            const midHealthColor = { r: 253, g: 165, b: 77 };
            const lowHealthColor = { r: 255, g: 77, b: 77 };

            let r, g, b;
            if (healthPercentage > 0.5) {
                const factor = (healthPercentage - 0.5) * 2;
                r = midHealthColor.r + factor * (highHealthColor.r - midHealthColor.r);
                g = midHealthColor.g + factor * (highHealthColor.g - midHealthColor.g);
                b = midHealthColor.b + factor * (highHealthColor.b - midHealthColor.b);
            } else {
                const factor = healthPercentage * 2;
                r = lowHealthColor.r + factor * (midHealthColor.r - lowHealthColor.r);
                g = lowHealthColor.g + factor * (midHealthColor.g - lowHealthColor.g);
                b = lowHealthColor.b + factor * (midHealthColor.b - lowHealthColor.b);
            }

            const r_base = Math.round(r), g_base = Math.round(g), b_base = Math.round(b);
            const baseColor = `rgb(${r_base}, ${g_base}, ${b_base})`;


            const amt = 30;
            const r_light = Math.min(255, r_base + amt);
            const g_light = Math.min(255, g_base + amt);
            const b_light = Math.min(255, b_base + amt);
            const lightColor = `rgb(${r_light}, ${g_light}, ${b_light})`;


            const offset = (Math.sin(Date.now() / 500) + 1) / 2;
            const healthGradient = this.ctx.createLinearGradient(x, y, x + healthWidth, y);
            healthGradient.addColorStop(0, baseColor);
            healthGradient.addColorStop(Math.max(0, offset - 0.1), lightColor);
            healthGradient.addColorStop(offset, baseColor);
            healthGradient.addColorStop(Math.min(1, offset + 0.1), lightColor);
            healthGradient.addColorStop(1, baseColor);

            this.ctx.fillStyle = healthGradient;
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, healthWidth, barHeight, borderRadius);
            this.ctx.fill();


            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, healthWidth, barHeight, borderRadius);
            this.ctx.stroke();
        }


        this.ctx.strokeStyle = 'rgba(229, 231, 235, 0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();


        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText(`${Math.round(player.health)} / ${maxHealth}`, x + barWidth / 2, y + barHeight / 2 + 1);
        this.ctx.restore();
    }

    private drawBossHealthBar(boss: Boss) {
        const barWidth = this.canvas.width * 0.6;
        const barHeight = 30;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 20;
        const borderRadius = 15;

        this.ctx.save();


        this.ctx.fillStyle = 'rgba(20, 20, 30, 0.6)';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();


        const healthPercentage = boss.health / boss.maxHealth;
        const healthWidth = barWidth * healthPercentage;
        const bossColorHex = COLOR_DETAILS[boss.color].hex;
        const bossColorRgb = this.hexToRgb(bossColorHex);

        if (healthWidth > 0 && bossColorRgb) {
            const amt = 40;
            const r_light = Math.min(255, bossColorRgb.r + amt);
            const g_light = Math.min(255, bossColorRgb.g + amt);
            const b_light = Math.min(255, bossColorRgb.b + amt);
            const lightColor = `rgb(${r_light}, ${g_light}, ${b_light})`;

            const gradient = this.ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(1, bossColorHex);
            this.ctx.fillStyle = gradient;

            this.ctx.shadowColor = bossColorHex;
            this.ctx.shadowBlur = 20;

            this.ctx.beginPath();
            roundRect(this.ctx, x, y, healthWidth, barHeight, borderRadius);
            this.ctx.fill();
        }
        this.ctx.shadowColor = 'transparent';


        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();


        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px "Space Grotesk"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'black';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText('SPECTRAL ANOMALY', x + barWidth / 2, y + barHeight / 2 + 1);

        this.ctx.restore();
    }

    private drawDashCooldownBar(player: Player) {
        const boxSize = 50;
        const spacing = 12;
        const hotbarTotalWidth = (boxSize + spacing) * ALL_COLORS.length - spacing;
        const barWidth = hotbarTotalWidth;
        const barHeight = 12;
        const borderRadius = 6;

        const x = (this.canvas.width - barWidth) / 2;
        const y = this.canvas.height - boxSize - 20 - spacing - barHeight;

        this.ctx.save();

        this.ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.fill();
        this.ctx.shadowColor = 'transparent';

        const progress = player.dashCooldownTimer <= 0 ? 1 : 1 - (player.dashCooldownTimer / player.getDashCooldown());

        if (progress > 0) {
            const progressWidth = barWidth * progress;

            this.ctx.save();
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, progressWidth, barHeight, borderRadius);
            this.ctx.clip();

            const panOffset = (Date.now() / 2000 * barWidth) % (barWidth);
            const gradient = this.ctx.createLinearGradient(x - panOffset, y, x + barWidth * 2 - panOffset, y);

            const colors = ['#ff4d4d', '#ffff66', '#66ff8c', '#4d94ff', '#d966ff'];
            for(let i = 0; i < colors.length * 2; i++) {
                gradient.addColorStop(i / (colors.length * 2 -1), colors[i % colors.length]);
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, y, barWidth, barHeight);

            const highlightOffset = (Math.sin(Date.now() / 400) + 1) / 2;
            const highlightGradient = this.ctx.createLinearGradient(x, y, x + barWidth, y);
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            highlightGradient.addColorStop(Math.max(0, highlightOffset - 0.2), 'rgba(255, 255, 255, 0.4)');
            highlightGradient.addColorStop(highlightOffset, 'rgba(255, 255, 255, 0)');
            highlightGradient.addColorStop(Math.min(1, highlightOffset + 0.2), 'rgba(255, 255, 255, 0.4)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.ctx.fillRect(x, y, barWidth, barHeight);

            this.ctx.restore();

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, progressWidth, barHeight, borderRadius);
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = 'rgba(229, 231, 235, 0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        roundRect(this.ctx, x, y, barWidth, barHeight, borderRadius);
        this.ctx.stroke();

        this.ctx.restore();
    }

    private drawHotbar(player: Player) {
        const boxSize = 50;
        const spacing = 12;
        const totalWidth = (boxSize + spacing) * ALL_COLORS.length - spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = this.canvas.height - boxSize - 20;
        const borderRadius = 10;

        this.ctx.save();


        this.ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
        this.ctx.strokeStyle = 'rgba(150, 150, 180, 0.3)';
        this.ctx.lineWidth = 1.5;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        roundRect(this.ctx, startX, y, totalWidth, boxSize, borderRadius);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.shadowColor = 'transparent';

        ALL_COLORS.forEach((color, index) => {
            const x = startX + (boxSize + spacing) * index;
            const detail = COLOR_DETAILS[color];
            const isAvailable = player.availableColors.has(color);

            this.ctx.save();

            if (!isAvailable) {
                this.ctx.filter = 'saturate(0.1) brightness(0.7)';
            }


            this.ctx.fillStyle = detail.hex;
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
            this.ctx.fill();


            const shapePos = new Vec2(x + boxSize / 2, y + boxSize / 2);
            drawShapeForColor(this.ctx, shapePos, boxSize * 0.4, color, isAvailable ? 'black' : 'rgba(0,0,0,0.5)');


            if (player.currentColor === color) {
                const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
                this.ctx.strokeStyle = '#7DF9FF';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#7DF9FF';
                this.ctx.shadowBlur = 10 + pulse * 10;
                this.ctx.beginPath();
                roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
                this.ctx.stroke();
            } else if (isAvailable) {
                 this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                 this.ctx.lineWidth = 1;
                 this.ctx.beginPath();
                 roundRect(this.ctx, x, y, boxSize, boxSize, borderRadius);
                 this.ctx.stroke();
            }
            this.ctx.restore();
        });

        this.ctx.restore();
    }

    private drawTopRightUI(score: number, enemyCount: number, scoreMultiplier: number, startY: number) {
        const x = this.canvas.width - 20;
        let y = startY;

        this.drawText(`Score: ${Math.round(score)}`, x, y, 24, '#FFFFFF', 'right');
        y += 35;

        if (enemyCount > 0) {
            this.drawText(`Enemies: ${enemyCount}`, x, y, 18, '#CCCCCC', 'right');
            y += 25;
        }

        if (scoreMultiplier > 1) {
            this.drawText(`Multiplier: x${scoreMultiplier.toFixed(1)}`, x, y, 18, '#ffff66', 'right');
        }
    }

    private drawWaveInfo(waveNumber: number, isBetweenWaves: boolean) {
        const y = 20;
        const x = this.canvas.width / 2;

        if (isBetweenWaves) {
            this.drawText(`WAVE ${waveNumber} CLEARED`, x, y, 32, '#7DF9FF', 'center');
        } else {
            this.drawText(`WAVE ${waveNumber}`, x, y, 32, '#FFFFFF', 'center');
        }
    }

    private drawOffscreenIndicators(enemies: Enemy[]) {
        const padding = 25;
        const indicatorSize = 10;

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
                const pulse = (Math.sin(Date.now() / 200 + enemy.pos.x) + 1) / 2;

                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle);
                this.ctx.fillStyle = enemy.hexColor;
                this.ctx.globalAlpha = 0.6 + pulse * 0.4;
                this.ctx.shadowColor = enemy.hexColor;
                this.ctx.shadowBlur = 8;

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

    private drawWaveCountdown(countdown: number) {
        if (countdown <= 0) return;

        this.ctx.save();
        const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
        const fontSize = 80 + pulse * 10;
        this.ctx.font = `bold ${fontSize}px "Space Grotesk"`;

        this.ctx.globalAlpha = 0.7 + pulse * 0.3;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = '#7DF9FF';
        this.ctx.shadowBlur = 25;

        const gradient = this.ctx.createLinearGradient(0, this.canvas.height / 2 - fontSize/2, 0, this.canvas.height / 2 + fontSize/2);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#7DF9FF');
        this.ctx.fillStyle = gradient;

        this.ctx.fillText(`${countdown}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.restore();
    }
}