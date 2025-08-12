const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

function fixNext() {
    const oldDir = path.join(outDir, '_next');
    const newDir = path.join(outDir, 'next-assets');

    if (!fs.existsSync(oldDir)) {
        console.log('Build output "out/_next" not found, skipping fix.');
        return;
    }

    console.log('Fixing build for Chrome Extension...');
    
    // 1. Rename _next to next-assets
    fs.renameSync(oldDir, newDir);

    // 2. Find and replace all occurrences of /_next/ with /next-assets/
    const walk = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(function(file) {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) { 
                results = results.concat(walk(file));
            } else { 
                results.push(file);
            }
        });
        return results;
    }

    const files = walk(outDir);
    for (const file of files) {
        if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) {
            const data = fs.readFileSync(file, 'utf8');
            // Use a regex to replace all occurrences
            const result = data.replace(/\/_next\//g, '/next-assets/');
            fs.writeFileSync(file, result, 'utf8');
        }
    }
    console.log('Successfully fixed build for Chrome Extension.');
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
      // log warning
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

// Export the fix function to be used in package.json
module.exports.fixNext = fixNext;

// If the script is run directly, just zip the directory.
// This assumes the `build` script has already been run and fixed the contents.
if (require.main === module) {
    zip();
}