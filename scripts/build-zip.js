const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function fixNext() {
    // Copy essential files to the out directory
    const outDir = path.join(__dirname, '..', 'out');
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Ensure out directory exists
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Copy manifest.json
    const manifestSrc = path.join(publicDir, 'manifest.json');
    const manifestDest = path.join(outDir, 'manifest.json');
    if (fs.existsSync(manifestSrc)) {
        fs.copyFileSync(manifestSrc, manifestDest);
        console.log('✓ Copied manifest.json');
    } else {
        console.error('✗ manifest.json not found in public directory');
    }
    
    // Copy background.js
    const backgroundSrc = path.join(publicDir, 'background.js');
    const backgroundDest = path.join(outDir, 'background.js');
    if (fs.existsSync(backgroundSrc)) {
        fs.copyFileSync(backgroundSrc, backgroundDest);
        console.log('✓ Copied background.js');
    } else {
        console.error('✗ background.js not found in public directory');
    }
    
    // Copy icons directory
    const iconsSrc = path.join(publicDir, 'icons');
    const iconsDest = path.join(outDir, 'icons');
    
    if (fs.existsSync(iconsSrc)) {
        // Create icons directory in out
        if (!fs.existsSync(iconsDest)) {
            fs.mkdirSync(iconsDest, { recursive: true });
        }
        
        // Copy all icon files
        const iconFiles = fs.readdirSync(iconsSrc);
        iconFiles.forEach(file => {
            const srcFile = path.join(iconsSrc, file);
            const destFile = path.join(iconsDest, file);
            fs.copyFileSync(srcFile, destFile);
            console.log(`✓ Copied icon: ${file}`);
        });
    } else {
        console.error('✗ icons directory not found in public directory');
    }
    
    // Copy sounds directory if it exists
    const soundsSrc = path.join(publicDir, 'sounds');
    const soundsDest = path.join(outDir, 'sounds');
    
    if (fs.existsSync(soundsSrc)) {
        if (!fs.existsSync(soundsDest)) {
            fs.mkdirSync(soundsDest, { recursive: true });
        }
        
        const soundFiles = fs.readdirSync(soundsSrc);
        soundFiles.forEach(file => {
            const srcFile = path.join(soundsSrc, file);
            const destFile = path.join(soundsDest, file);
            fs.copyFileSync(srcFile, destFile);
            console.log(`✓ Copied sound: ${file}`);
        });
    }
    
    console.log('✓ Build fix complete');
}

function createZip() {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(path.join(__dirname, '..', 'rgbang-extension.zip'));
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            console.log(`✓ Extension packaged: ${archive.pointer()} total bytes`);
            resolve();
        });
        
        archive.on('error', (err) => {
            reject(err);
        });
        
        archive.pipe(output);
        archive.directory('out/', false);
        archive.finalize();
    });
}

if (require.main === module) {
    // If run directly, create the zip
    createZip().catch(console.error);
}

module.exports = { fixNext, createZip };