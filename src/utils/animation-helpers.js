export function generateBulletAnimations() {
    const frames = {};
    const animations = {};
    const frameWidth = 16;
    const frameHeight = 16;
    const numRows = 25;
    const numCols = 40;

    let frameCounter = 0;

    for (let r = 0; r < numRows; r++) {
        let currentX = 0;
        let animSectionIndex = 0;

        while (currentX < numCols * frameWidth) {
            const animKey = `anim_${r}_${animSectionIndex}`;
            const frameCount = (animSectionIndex === 0) ? 5 : 4;
            const animFrames = [];

            for (let i = 0; i < frameCount; i++) {
                const frameName = `bullet_frame_${frameCounter++}`;
                frames[frameName] = {
                    frame: { x: currentX, y: r * frameHeight, w: frameWidth, h: frameHeight },
                    sourceSize: { w: frameWidth, h: frameHeight },
                    spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
                };
                animFrames.push(frameName);
                currentX += frameWidth;
            }

            animations[animKey] = animFrames;
            animSectionIndex++;
            currentX += frameWidth; // The 16x16 gap
        }
    }

    return { frames, animations };
}