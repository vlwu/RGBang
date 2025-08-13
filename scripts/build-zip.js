const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');

/**
 * Creates a short hash from a string to generate a unique filename.
 * @param {string} data The content to hash.
 * @returns {string} A 16-character hex hash.
 */
function sha256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex').substring(0, 16);
}

/**
 * A comprehensive function to fix the Next.js output for Chrome Extension CSP.
 * It renames `_next` to `next_assets`, extracts all inline scripts,
 * removes the Next.js CSP meta tag, and patches all asset paths.
 */
function fixNext() {
    const outDir = path.join(__dirname, '..', 'out');
    const publicDir = path.join(__dirname, '..', 'public');

    // Rename _next directory to avoid conflicts and improve clarity.
    const oldNextDir = path.join(outDir, '_next');
    const newNextDir = path.join(outDir, 'next_assets');
    if (fs.existsSync(oldNextDir)) {
        fs.renameSync(oldNextDir, newNextDir);
        console.log('✓ Renamed _next directory to next_assets');
    }

    // Recursively processes files in the output directory.
    function patchFileContent(directory) {
        if (!fs.existsSync(directory)) return;

        const items = fs.readdirSync(directory);
        items.forEach(item => {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                patchFileContent(fullPath);
            } else if (/\.html$/.test(item)) {
                // Process HTML files for inline scripts and path patching.
                let content = fs.readFileSync(fullPath, 'utf8');

                // 1. Remove Next.js's default CSP meta tag. The manifest.json is the source of truth.
                content = content.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/g, '');

                // 2. Find and extract all inline scripts to external files.
                const inlineScriptRegex = /<script(>|\s[^>]*>)([\s\S]*?)<\/script>/gi;
                let finalContent = content;
                const scriptsToReplace = [];
                let match;

                while ((match = inlineScriptRegex.exec(content)) !== null) {
                    const fullTag = match[0];
                    const scriptContent = match[2];

                    // Only extract scripts that are inline (no 'src' attribute) and not the __NEXT_DATA__ JSON blob.
                    if (!/src\s*=\s*/.test(fullTag) && !/type\s*=\s*['"]application\/json['"]/.test(fullTag) && scriptContent.trim().length > 0) {
                        const scriptHash = sha256(scriptContent);
                        const scriptFileName = `inline-${scriptHash}.js`;
                        const scriptSubPath = path.join('static', 'js', scriptFileName);
                        const scriptDiskPath = path.join(newNextDir, scriptSubPath);

                        // Ensure the target directory for extracted scripts exists.
                        fs.mkdirSync(path.dirname(scriptDiskPath), { recursive: true });
                        fs.writeFileSync(scriptDiskPath, scriptContent, 'utf8');
                        console.log(`✓ Extracted inline script to: ${scriptFileName}`);

                        // Replace the inline script tag with a reference to the new external file.
                        const newTag = `<script src="next_assets/${scriptSubPath.replace(/\\/g, '/')}"></script>`;
                        scriptsToReplace.push({ old: fullTag, new: newTag });
                    }
                }

                // Perform the replacements after identifying all scripts.
                for (const replacement of scriptsToReplace) {
                    finalContent = finalContent.replace(replacement.old, replacement.new);
                }

                // 3. Patch all asset paths to point to 'next_assets'.
                finalContent = finalContent.replace(/(\/)?_next\//g, 'next_assets/');
                
                fs.writeFileSync(fullPath, finalContent, 'utf8');
                console.log(`✓ Patched HTML file: ${item}`);

            } else if (/\.(js|css)$/.test(item)) {
                // Patch asset paths in JS and CSS files.
                let content = fs.readFileSync(fullPath, 'utf8');
                const newContent = content.replace(/(\/)?_next\//g, 'next_assets/');
                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`✓ Patched asset paths in: ${item}`);
                }
            }
        });
    }

    patchFileContent(outDir);

    // Copy essential public assets to the final build directory.
    function copyAsset(assetPath, isDir = false) {
        const src = path.join(publicDir, assetPath);
        const dest = path.join(outDir, assetPath);
        if (fs.existsSync(src)) {
            if (isDir) {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
                fs.readdirSync(src).forEach(file => {
                    fs.copyFileSync(path.join(src, file), path.join(dest, file));
                });
            } else {
                fs.copyFileSync(src, dest);
            }
            console.log(`✓ Copied ${assetPath}`);
        } else if (assetPath === 'manifest.json' || assetPath === 'background.js') {
            console.error(`✗ ${assetPath} not found in public directory`);
        }
    }

    copyAsset('manifest.json');
    copyAsset('background.js');
    copyAsset('icons', true);
    copyAsset('sounds', true);

    console.log('✓ Build fix complete');
}

/**
 * Packages the 'out' directory into a zip file for distribution.
 */
function createZip() {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(path.join(__dirname, '..', 'rgbang-extension.zip'));
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`✓ Extension packaged: ${archive.pointer()} total bytes`);
            resolve();
        });
        archive.on('error', (err) => reject(err));
        archive.pipe(output);

        const outDir = path.join(__dirname, '..', 'out');
        archive.directory(outDir, false);
        archive.finalize();
    });
}

if (require.main === module) {
    fixNext();
    createZip().catch(console.error);
}

module.exports = { fixNext, createZip };