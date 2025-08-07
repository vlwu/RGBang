const FONT_MAP = {
    'A': { x: 0, y: 0 }, 'B': { x: 8, y: 0 }, 'C': { x: 16, y: 0 }, 'D': { x: 24, y: 0 }, 'E': { x: 32, y: 0 },
    'F': { x: 40, y: 0 }, 'G': { x: 48, y: 0 }, 'H': { x: 56, y: 0 }, 'I': { x: 64, y: 0 }, 'J': { x: 72, y: 0 },
    'K': { x: 0, y: 10 }, 'L': { x: 8, y: 10 }, 'M': { x: 16, y: 10 }, 'N': { x: 24, y: 10 }, 'O': { x: 32, y: 10 },
    'P': { x: 40, y: 10 }, 'Q': { x: 48, y: 10 }, 'R': { x: 56, y: 10 }, 'S': { x: 64, y: 10 }, 'T': { x: 72, y: 10 },
    'U': { x: 0, y: 20 }, 'V': { x: 8, y: 20 }, 'W': { x: 16, y: 20 }, 'X': { x: 24, y: 20 }, 'Y': { x: 32, y: 20 },
    'Z': { x: 40, y: 20 },
    '0': { x: 0, y: 30 }, '1': { x: 8, y: 30 }, '2': { x: 16, y: 30 }, '3': { x: 24, y: 30 }, '4': { x: 32, y: 30 },
    '5': { x: 40, y: 30 }, '6': { x: 48, y: 30 }, '7': { x: 56, y: 30 }, '8': { x: 64, y: 30 }, '9': { x: 72, y: 30 },
    '.': { x: 0, y: 40 }, ',': { x: 8, y: 40 }, ':': { x: 16, y: 40 }, '?': { x: 24, y: 40 }, '!': { x: 32, y: 40 },
    '(': { x: 40, y: 40 }, ')': { x: 48, y: 40 }, '+': { x: 56, y: 40 }, '-': { x: 64, y: 40 }, '/': { x: 48, y: 20 },
    ' ': { x: 0, y: 0, space: true }, '%': { x: 56, y: 20 }, "'": { x: 64, y: 20 }, '&': { x: 72, y: 20 }
};
const CHAR_WIDTH = 8;
const CHAR_HEIGHT = 10;

export class FontRenderer {
    constructor(fontSprite) {
        this.sprite = fontSprite;
        if (!this.sprite) {
            console.error("Font spritesheet not provided to FontRenderer!");
        }

        this.characterCache = new Map();
    }

    _getCachedCharacter(char, color) {
        const key = `${char}_${color}`;
        if (this.characterCache.has(key)) {
            return this.characterCache.get(key);
        }

        const charData = FONT_MAP[char];
        if (!charData) return null;

        const charCanvas = document.createElement('canvas');
        charCanvas.width = CHAR_WIDTH;
        charCanvas.height = CHAR_HEIGHT;
        const charCtx = charCanvas.getContext('2d');

        charCtx.imageSmoothingEnabled = false;
        charCtx.drawImage(this.sprite, charData.x, charData.y, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT);
        charCtx.globalCompositeOperation = 'source-in';
        charCtx.fillStyle = color;
        charCtx.fillRect(0, 0, CHAR_WIDTH, CHAR_HEIGHT);

        this.characterCache.set(key, charCanvas);

        return charCanvas;
    }

    _renderText(ctx, text, startX, startY, { scale = 1, color = null } = {}) {
        if (!this.sprite) return;
        const upperText = text.toUpperCase();
        let currentX = startX;

        ctx.imageSmoothingEnabled = false;

        for (const char of upperText) {
            const charData = FONT_MAP[char];
            if (!charData) {
                currentX += CHAR_WIDTH * scale;
                continue;
            }

            if (charData.space) {
                currentX += CHAR_WIDTH * scale;
                continue;
            }

            let imageToDraw;
            let sx = charData.x;
            let sy = charData.y;

            if (color) {
                imageToDraw = this._getCachedCharacter(char, color);
                sx = 0;
                sy = 0;
            } else {
                imageToDraw = this.sprite;
            }

            if (imageToDraw) {
                ctx.drawImage(
                    imageToDraw,
                    sx, sy, CHAR_WIDTH, CHAR_HEIGHT,
                    currentX, startY, CHAR_WIDTH * scale, CHAR_HEIGHT * scale
                );
            }

            currentX += CHAR_WIDTH * scale;
        }
    }

    drawText(ctx, text, startX, startY, { scale = 1, align = 'left', color = 'white', outlineColor = null, outlineWidth = 1 } = {}) {
        const textWidth = this.getTextWidth(text, scale);
        let x = startX;
        if (align === 'center') {
            x = startX - textWidth / 2;
        } else if (align === 'right') {
            x = startX - textWidth;
        }

        if (outlineColor) {
            const outlineOptions = { scale, color: outlineColor };
            this._renderText(ctx, text, x - outlineWidth, startY, outlineOptions);
            this._renderText(ctx, text, x + outlineWidth, startY, outlineOptions);
            this._renderText(ctx, text, x, startY - outlineWidth, outlineOptions);
            this._renderText(ctx, text, x, startY + outlineWidth, outlineOptions);
        }

        this._renderText(ctx, text, x, startY, { scale, color });
    }

    getTextWidth(text, scale = 1) {
        return text.length * CHAR_WIDTH * scale;
    }

    renderTextToCanvas(text, options) {
        if (!this.sprite) return null;

        const padding = (options.outlineColor && options.outlineWidth) ? options.outlineWidth * 2 : 0;
        const textWidth = this.getTextWidth(text, options.scale);
        const textHeight = CHAR_HEIGHT * options.scale;

        const canvas = document.createElement('canvas');
        canvas.width = textWidth + padding;
        canvas.height = textHeight + padding;
        const ctx = canvas.getContext('2d');

        const drawOptions = { ...options, align: 'left' };

        this.drawText(ctx, text, padding / 2, padding / 2, drawOptions);

        return canvas;
    }
}