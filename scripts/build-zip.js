const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');




function sha256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex').substring(0, 16);
}


function fixNextForCSP() {
    const outDir = path.join(__dirname, '..', 'out');
    const publicDir = path.join(__dirname, '..', 'public');

    console.log('--- Starting Next.js build fix for Chrome Extension ---');


    if (!fs.existsSync(outDir)) {
        console.error("✗ Error: Build directory 'out' not found. Please run 'next build' first.");
        process.exit(1);
    }


    const oldNextDir = path.join(outDir, '_next');
    const newNextDir = path.join(outDir, 'next_assets');

    if (fs.existsSync(oldNextDir)) {
        fs.renameSync(oldNextDir, newNextDir);
        console.log('✓ Renamed `_next` directory to `next_assets`.');
    } else {
        console.log('✓ `_next` directory not found, assuming it is already renamed.');
    }


    function patchDirectory(directory) {
        const items = fs.readdirSync(directory);
        for (const item of items) {
            const fullPath = path.join(directory, item);
            if (fs.statSync(fullPath).isDirectory()) {
                patchDirectory(fullPath);
            } else if (/\.(html|js|css)$/.test(item)) {
                patchFile(fullPath);
            }
        }
    }

    function patchFile(filePath) {
        let content = fs.readFileSync(filePath, 'utf8');
        let wasModified = false;


        const pathFixedContent = content.replace(/\/(_next|next_assets)\//g, './next_assets/');
        if (content !== pathFixedContent) {
            content = pathFixedContent;
            wasModified = true;
        }


        if (path.extname(filePath) === '.html') {
            // Modified regex to match script tags that do NOT have a 'src' attribute,
            // ensuring all inline executable scripts are captured.
            const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]+?)<\/script>/gi;
            const scriptsToReplace = [];
            let match;
            while ((match = scriptRegex.exec(content)) !== null) {
                const scriptContent = match[1];
                // Still exclude __NEXT_DATA__ content as it's JSON, not executable JS.
                if (scriptContent.trim() && !scriptContent.includes('__NEXT_DATA__')) {
                    const scriptHash = sha256(scriptContent);
                    const scriptFileName = `inline-script-${scriptHash}.js`;
                    const scriptPath = path.join(newNextDir, 'static', 'js', scriptFileName);

                    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
                    fs.writeFileSync(scriptPath, scriptContent, 'utf8');

                    const relativePath = path.relative(path.dirname(filePath), scriptPath).replace(/\\/g, '/');
                    scriptsToReplace.push({ old: match[0], new: `<script src="${relativePath}"></script>` });
                }
            }

            if (scriptsToReplace.length > 0) {
                wasModified = true;
                scriptsToReplace.forEach(rep => {
                    content = content.replace(rep.old, rep.new);
                });
            }
        }

        if (wasModified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Patched: ${path.relative(outDir, filePath)}`);
        }
    }

    console.log('--- Patching build files ---');
    patchDirectory(outDir);


    console.log('--- Copying public assets ---');
    ['manifest.json', 'background.js'].forEach(file => {
        const src = path.join(publicDir, file);
        const dest = path.join(outDir, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✓ Copied ${file}`);
        } else {
            console.error(`✗ Asset not found in public directory: ${file}`);
        }
    });
    ['icons', 'sounds'].forEach(dir => {
        const src = path.join(publicDir, dir);
        const dest = path.join(outDir, dir);
        if (fs.existsSync(src)) {
            fs.cpSync(src, dest, { recursive: true });
            console.log(`✓ Copied directory ${dir}`);
        }
    });

    console.log('--- Build fix complete! ---');
}

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
        archive.directory(path.join(__dirname, '..', 'out'), false);
        archive.finalize();
    });
}


if (require.main === module) {
    fixNextForCSP();
}

module.exports = { fixNextForCSP, createZip };