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

/**
 * Replace /_next/ urls with /next-assets/ to match renamed folder.
 * Also extracts inline <script>...</script> into separate files under out/inline-scripts/
 * and replaces them with <script src="./inline-scripts/<hash>.js"></script>
 */
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

  // Ensure inline-scripts folder exists
  const inlineScriptsDir = path.join(outDir, 'inline-scripts');
  ensureDirSync(inlineScriptsDir);

  // Walk all files in outDir
  const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(full));
      } else {
        results.push(full);
      }
    });
    return results;
  }

  const files = walk(outDir);

  // Regexes
  // Matches <script ...>...</script> capturing attributes and content.
  // We'll skip scripts that already have a src attribute.
  const scriptBlockRE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const srcAttrRE = /\bsrc\s*=\s*(['"])[\s\S]*?\1/i;

  for (const file of files) {
    if (!(file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css'))) continue;

    let data = fs.readFileSync(file, 'utf8');

    // First replace any /_next/ references with /next-assets/
    data = data.replace(/\/_next\//g, '/next-assets/');

    // If HTML file, extract inline <script> blocks without src
    if (file.endsWith('.html')) {
      let modified = false;
      data = data.replace(scriptBlockRE, (fullMatch, attrStr, innerContent) => {
        // If script tag has a src attribute, keep it as-is
        if (srcAttrRE.test(attrStr)) {
          return fullMatch;
        }

        // Trim whitespace-only scripts
        if (!innerContent || !innerContent.trim()) {
          // Keep an empty script tag (no-op) but better to remove it to be clean
          modified = true;
          return '';
        }

        // Create a hashed filename to dedupe identical inline scripts
        const contentHash = hashContent(innerContent).slice(0, 16);
        const outFileName = `inline-${contentHash}.js`;
        const outFilePath = path.join(inlineScriptsDir, outFileName);

        // If file does not exist yet, write it.
        if (!fs.existsSync(outFilePath)) {
          // Wrap content in IIFE to avoid leaking local variables (keeps behavior same)
          // But if script expects top-level module behavior this is safest default.
          const wrapped = `// extracted inline script\n(function(){\n${innerContent}\n})();\n`;
          fs.writeFileSync(outFilePath, wrapped, 'utf8');
          console.log(`Extracted inline script -> ${path.relative(outDir, outFilePath)}`);
        } else {
          console.log(`Re-using extracted script ${path.relative(outDir, outFilePath)}`);
        }

        modified = true;
        // Use a relative path from the HTML file to the inline-scripts folder.
        // If the HTML is in a nested folder, compute proper relative path.
        const relPath = path.relative(path.dirname(file), outFilePath).split(path.sep).join('/');
        // Ensure relative path starts with ./ or ../
        const scriptSrc = relPath.startsWith('.') ? relPath : './' + relPath;
        return `<script src="${scriptSrc}"></script>`;
      });

      if (modified) {
        fs.writeFileSync(file, data, 'utf8');
        console.log(`Patched HTML -> ${path.relative(outDir, file)}`);
      }
    } else {
      // For .js and .css files we only needed the /_next/ -> /next-assets/ replacement
      fs.writeFileSync(file, data, 'utf8');
    }
  }

  console.log('Successfully fixed build for Chrome Extension (extracted inline scripts).');
}

function zip() {
  const zipFile = path.join(__dirname, '..', 'dist.zip');
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });

  output.on('end', function() {
    console.log('Data has been drained');
  });

  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {

    } else {
      throw err;
    }
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);
  archive.directory(outDir, false);
  archive.finalize();
}

module.exports.fixNext = fixNext;

if (require.main === module) {
  // run the fix, then zip
  try {
    fixNext();
  } catch (err) {
    console.error('Error running fixNext:', err);
    process.exit(1);
  }

  // optionally zip (keeps previous behavior)
  try {
    zip();
  } catch (err) {
    console.error('Error zipping:', err);
    process.exit(1);
  }
}