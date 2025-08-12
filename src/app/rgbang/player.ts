
import { Vec2, drawShapeForColor } from './utils';
import { Bullet } from './bullet';
import InputHandler from './input-handler';
import { GameColor, COLOR_DETAILS, ALL_COLORS, SECONDARY_COLORS } from './color';
import { RadialMenu } from './radial-menu';

export class Player {
    pos: Vec2;
    radius = 15;
    speed = 3.2;
    maxHealth = 100;
    health: number;
    isAlive = true;
    
    public currentColor: GameColor;
    private radialMenu: RadialMenu;
    
    private shootCooldown = 10; // frames
    private shootTimer = 0;

    // Dash properties
    private isDashing = false;
    private dashTimer = 0;
    private dashDuration = 12; // frames
    private dashSpeed = 12;
    private dashCooldown = 180; // frames
    private dashCooldownTimer = 0;

    constructor(x: number, y: number, initialColor: GameColor) {
        this.pos = new Vec2(x, y);
        this.health = this.maxHealth;
        this.currentColor = initialColor;
        this.radialMenu = new RadialMenu();
    }
    
    update(input: InputHandler, createBullet: (bullet: Bullet) => void, canvasWidth: number, canvasHeight: number) {
        if (!this.isAlive) return;

        this.handleMovement(input, canvasWidth, canvasHeight);
        this.handleColorSelection(input, createBullet);
        this.handleShooting(input, createBullet);
        
        if (this.shootTimer > 0) this.shootTimer--;
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
    }

    private handleMovement(input: InputHandler, canvasWidth: number, canvasHeight: number) {
        // Dash activation
        if (input.isKeyDown(input.keybindings.dash) && this.dashCooldownTimer === 0) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            this.dashCooldownTimer = this.dashCooldown;
        }
        
        let currentSpeed = this.speed;
        let moveDir = new Vec2(0, 0);

        if (this.isDashing) {
            currentSpeed = this.dashSpeed;
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        }
        
        if (input.isKeyDown(input.keybindings.up)) moveDir.y -= 1;
        if (input.isKeyDown(input.keybindings.down)) moveDir.y += 1;
        if (input.isKeyDown(input.keybindings.left)) moveDir.x -= 1;
        if (input.isKeyDown(input.keybindings.right)) moveDir.x += 1;

        if (moveDir.magnitude() > 0) {
            this.pos = this.pos.add(moveDir.normalize().scale(currentSpeed));
        }

        // Boundary checks
        this.pos.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.pos.x));
        this.pos.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.pos.y));
    }
    
    private handleColorSelection(input: InputHandler, createBullet: (bullet: Bullet) => void) {
        // Keyboard primary selection
        if (input.isKeyDown(input.keybindings.primary1)) this.currentColor = GameColor.RED;
        if (input.isKeyDown(input.keybindings.primary2)) this.currentColor = GameColor.YELLOW;
        if (input.isKeyDown(input.keybindings.primary3)) this.currentColor = GameColor.BLUE;

        // Mouse wheel selection
        if (input.wheelDeltaY !== 0) {
            const currentIndex = ALL_COLORS.indexOf(this.currentColor);
            let nextIndex;
            if (input.wheelDeltaY > 0) { // Scroll down
                nextIndex = (currentIndex + 1) % ALL_COLORS.length;
            } else { // Scroll up
                nextIndex = (currentIndex - 1 + ALL_COLORS.length) % ALL_COLORS.length;
            }
            this.currentColor = ALL_COLORS[nextIndex];
        }

        // Radial menu for secondary colors
        if (input.isKeyDown(input.keybindings.comboRadial)) {
            this.radialMenu.active = true;
            this.radialMenu.update(this.pos, input.mousePos);
        } else {
            this.radialMenu.active = false;
        }

        if (input.wasKeyReleased(input.keybindings.comboRadial)) {
            const selectedColor = this.radialMenu.getSelectedColor();
            if(selectedColor) {
                const direction = input.mousePos.sub(this.pos);
                const bullet = new Bullet(this.pos, direction, selectedColor);
                createBullet(bullet);
                this.shootTimer = this.shootCooldown;
            }
            this.radialMenu.close();
        }
    }

    private handleShooting(input: InputHandler, createBullet: (bullet: Bullet) => void) {
        if (input.isMouseDown && this.shootTimer === 0 && !this.radialMenu.active) {
            const direction = input.mousePos.sub(this.pos);
            const bullet = new Bullet(this.pos, direction, this.currentColor);
            createBullet(bullet);
            this.shootTimer = this.shootCooldown;
        }
    }

    draw(ctx: CanvasRenderingContext2D, input: InputHandler) {
        // Draw dashing effect
        if (this.isDashing) {
            ctx.save();
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 20;
            const dashProgress = this.dashTimer / this.dashDuration;
            ctx.fillStyle = `rgba(226, 232, 240, ${0.5 * dashProgress})`;
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius + 5 * (1 - dashProgress), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw player body
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Dash Cooldown Indicator
        if (this.dashCooldownTimer > 0) {
            this.drawDashIndicator(ctx);
        }

        if (this.radialMenu.active) {
            this.radialMenu.draw(ctx);
        } else {
            // Draw aiming reticle only when radial menu is closed
            const aimDir = input.mousePos.sub(this.pos).normalize();
            const reticlePos = this.pos.add(aimDir.scale(this.radius + 10));
            ctx.strokeStyle = COLOR_DETAILS[this.currentColor].hex;
            ctx.lineWidth = 2;
            ctx.save();
            drawShapeForColor(ctx, reticlePos, 10, this.currentColor, COLOR_DETAILS[this.currentColor].hex, true);
            ctx.restore();
        }
    }
    
     private drawDashIndicator(ctx: CanvasRenderingContext2D) {
        ctx.save();
        const indicatorWidth = 20;
        const indicatorHeight = 4;
        const indicatorX = this.pos.x - indicatorWidth / 2;
        const indicatorY = this.pos.y - this.radius - 12;

        const progress = 1 - (this.dashCooldownTimer / this.dashCooldown);

        // Background
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Cooldown Progress with Gradient
        const gradient = ctx.createLinearGradient(indicatorX, indicatorY, indicatorX + (indicatorWidth * progress), indicatorY);
        gradient.addColorStop(0, '#ff4d4d'); // Red
        gradient.addColorStop(0.5, '#ffff66'); // Yellow
        gradient.addColorStop(1, '#4d94ff'); // Blue
        
        ctx.fillStyle = gradient;
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth * progress, indicatorHeight);

        ctx.restore();
    }
    
    takeDamage(amount: number) {
        if (this.isDashing) return; // Invulnerable while dashing
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    refillHealth() {
        this.health = this.maxHealth;
    }

    public getDashCooldownProgress(): number {
        return this.dashCooldownTimer / this.dashCooldown;
    }
}
