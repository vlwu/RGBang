const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function fixNext() {
    const outDir = path.join(__dirname, '..', 'out');
    const publicDir = path.join(__dirname, '..', 'public');

    // Rename _next to next_assets to avoid Chrome extension error
    const oldNextDir = path.join(outDir, '_next');
    const newNextDir = path.join(outDir, 'next_assets');
    if (fs.existsSync(oldNextDir)) {
        fs.renameSync(oldNextDir, newNextDir);
        console.log('✓ Renamed _next directory to next_assets');
    }

    // Process HTML files to extract inline scripts
    const htmlFilePath = path.join(outDir, 'index.html');
    if (fs.existsSync(htmlFilePath)) {
        let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        const inlineScriptRegex = /<script id="__NEXT_DATA__" type="application\/json">.*?<\/script>|<script>(.*?)<\/script>/gs;
        const nextDataRegex = /<script id="__NEXT_DATA__" type="application\/json">.*?<\/script>/gs;
        
        let inlineScripts = [];
        let nextDataScript = '';
        let match;

        // First, find and preserve the __NEXT_DATA__ script
        htmlContent = htmlContent.replace(nextDataRegex, (scriptTag) => {
            nextDataScript = scriptTag;
            return '<!-- __NEXT_DATA__ placeholder -->';
        });

        // Then, extract and remove other inline scripts
        while ((match = inlineScriptRegex.exec(htmlContent)) !== null) {
            if (match[1] && match[1].trim().length > 0) {
                inlineScripts.push(match[1]);
            }
        }
        
        htmlContent = htmlContent.replace(inlineScriptRegex, (match, scriptContent) => {
             return (scriptContent && scriptContent.trim().length > 0) ? '' : match;
        });

        // Restore the __NEXT_DATA__ script
        htmlContent = htmlContent.replace('<!-- __NEXT_DATA__ placeholder -->', nextDataScript);
        
        // Create a new file for the extracted scripts
        if (inlineScripts.length > 0) {
            let combinedScripts = inlineScripts.join('\n\n');

            // **THE FIX**: Replace the problematic forEach with a standard for loop
            const problematicCode = 'document.querySelectorAll("link[data-precedence]").forEach(function(e){';
            const fixedCode = 'var a=document.querySelectorAll("link[data-precedence]");for(var i=0;i<a.length;i++){var e=a[i];';
            
            if (combinedScripts.includes(problematicCode)) {
                combinedScripts = combinedScripts.replace(problematicCode, fixedCode);
                console.log('✓ Patched NodeList.forEach issue in runtime script.');
            }
            
            const externalScriptDir = path.join(outDir, 'next_assets', 'static', 'runtime');
            if (!fs.existsSync(externalScriptDir)) {
                fs.mkdirSync(externalScriptDir, { recursive: true });
            }
            const externalScriptFile = path.join(externalScriptDir, 'inline-scripts.js');
            fs.writeFileSync(externalScriptFile, combinedScripts, 'utf8');
            console.log(`✓ Extracted inline scripts to inline-scripts.js`);

            // Add a script tag to load the new external script file
            const scriptTag = `<script src="./next_assets/static/runtime/inline-scripts.js" defer></script>`;
            htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
            console.log(`✓ Added script tag for inline-scripts.js to index.html`);
        }

        fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
    }

    // Recursively find and replace asset paths in built files
    function patchFileContent(directory) {
        if (!fs.existsSync(directory)) return;

        const items = fs.readdirSync(directory);
        items.forEach(item => {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                patchFileContent(fullPath);
            } else if (/\.(html|js|css)$/.test(item)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                // Replace both /_next/ and ./_next/ asset paths
                const newContent = content.replace(/(\.\/|\/)?_next\//g, 'next_assets/');
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`✓ Patched asset paths in: ${item}`);
                }
            }
        });
    }

    patchFileContent(outDir);

    // Helper to copy assets from public to out
    function copyAsset(assetPath, isDir = false) {
        const src = path.join(publicDir, assetPath);
        const dest = path.join(outDir, assetPath);
        if (fs.existsSync(src)) {
            if (isDir) {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                fs.readdirSync(src).forEach(file => {
                    const srcFile = path.join(src, file);
                    const destFile = path.join(dest, file);
                    fs.copyFileSync(srcFile, destFile);
                    console.log(`✓ Copied ${assetPath.replace(/\/$/, '')}: ${file}`);
                });
            } else {
                fs.copyFileSync(src, dest);
                console.log(`✓ Copied ${assetPath}`);
            }
        } else if (assetPath === 'manifest.json' || assetPath === 'background.js') {
             console.error(`✗ ${assetPath} not found in public directory`);
        }
    }

    copyAsset('manifest.json');
    copyAsset('background.js');
    copyAsset('icons/', true);
    copyAsset('sounds/', true);
    
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

        const outDir = path.join(__dirname, '..', 'out');
        const allowedFiles = [
            'index.html',
            'manifest.json',
            'background.js',
            'icons',
            'sounds',
            'next_assets'
        ];

        allowedFiles.forEach(file => {
            const fullPath = path.join(outDir, file);
            if (fs.existsSync(fullPath)) {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    archive.directory(fullPath, file);
                } else {
                    archive.file(fullPath, { name: file });
                }
            }
        });

        archive.finalize();
    });
}

if (require.main === module) {
    createZip().catch(console.error);
}

module.exports = { fixNext, createZip };