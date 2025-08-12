const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const crypto = require('crypto');

const outDir = path.join(__dirname, '..', 'out');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function fixNext() {
  const oldDir = path.join(outDir, '_next');
  const newDir = path.join(outDir, 'next-assets');

  if (!fs.existsSync(oldDir)) {
    console.log('Build output "out/_next" not found, skipping fix.');
    return;
  }

  console.log('Fixing build for Chrome Extension...');

  // Rename _next -> next-assets
  fs.renameSync(oldDir, newDir);

  // Prepare inline-scripts directory
  const inlineScriptsDir = path.join(outDir, 'inline-scripts');
  ensureDirSync(inlineScriptsDir);

  // Recursive file walker
  const walk = (dir) => {
    let results = [];
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(full));
      } else {
        results.push(full);
      }
    }
    return results;
  };

  const files = walk(outDir);

  // Matches <script ...>...</script> capturing attributes and content
  const scriptBlockRE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const srcAttrRE = /\bsrc\s*=\s*(['"])[\s\S]*?\1/i;
  const typeJSONRE = /\btype\s*=\s*(['"])application\/json\1/i;
  const typeModuleRE = /\btype\s*=\s*(['"])module\1/i;

  for (const file of files) {
    let data = fs.readFileSync(file, 'utf8');

    // Replace /_next/ references
    data = data.replace(/\/_next\//g, '/next-assets/');

    if (file.endsWith('.html')) {
      let modified = false;
      data = data.replace(scriptBlockRE, (fullMatch, attrStr, innerContent) => {
        // Skip if already has a src attribute
        if (srcAttrRE.test(attrStr)) return fullMatch;

        // Skip JSON scripts (Next.js __NEXT_DATA__)
        if (typeJSONRE.test(attrStr)) return fullMatch;

        // Skip empty/whitespace scripts
        if (!innerContent.trim()) return '';

        // Create hash-based filename
        const contentHash = hashContent(innerContent).slice(0, 16);
        const outFileName = `inline-${contentHash}.js`;
        const outFilePath = path.join(inlineScriptsDir, outFileName);

        // Detect if this is a <script type="module"> so we don't wrap in IIFE
        const isModule = typeModuleRE.test(attrStr);

        if (!fs.existsSync(outFilePath)) {
          const wrapped = isModule
            ? innerContent // modules already have scope isolation
            : `// extracted inline script\n(function(){\n${innerContent}\n})();\n`;
          fs.writeFileSync(outFilePath, wrapped, 'utf8');
          console.log(`Extracted inline script -> ${path.relative(outDir, outFilePath)}`);
        }

        modified = true;
        // Relative path from HTML file to script file
        const relPath = path.relative(path.dirname(file), outFilePath).split(path.sep).join('/');
        const scriptSrc = relPath.startsWith('.') ? relPath : './' + relPath;

        // Preserve original attributes except for any inline content
        const cleanedAttr = attrStr.trim();
        return `<script ${cleanedAttr} src="${scriptSrc}"></script>`;
      });

      if (modified) {
        fs.writeFileSync(file, data, 'utf8');
        console.log(`Patched HTML -> ${path.relative(outDir, file)}`);
      }
    } else {
      fs.writeFileSync(file, data, 'utf8');
    }
  }

  console.log('Successfully fixed build for Chrome Extension (no inline JS, JSON preserved, attributes kept).');
}

function zip() {
  const zipFile = path.join(__dirname, '..', 'dist.zip');
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('Archive finalized and output closed.');
  });

  archive.on('error', (err) => { throw err; });

  archive.pipe(output);
  archive.directory(outDir, false);
  archive.finalize();
}

module.exports.fixNext = fixNext;

if (require.main === module) {
  try {
    fixNext();
  } catch (err) {
    console.error('Error running fixNext:', err);
    process.exit(1);
  }

  try {
    zip();
  } catch (err) {
    console.error('Error zipping:', err);
    process.exit(1);
  }
}
