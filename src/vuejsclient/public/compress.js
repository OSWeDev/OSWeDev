const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const brotli = require('brotli');

const directory = path.join(__dirname, 'dist', 'public');

function compressFile(filePath) {
    const fileContents = fs.readFileSync(filePath);

    // Gzip compression
    const gzipped = zlib.gzipSync(fileContents);
    fs.writeFileSync(filePath + '.gz', gzipped);

    // Brotli compression
    const brotliCompressed = brotli.compress(fileContents);
    fs.writeFileSync(filePath + '.br', Buffer.from(brotliCompressed));
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        if (fs.lstatSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            // Ignore already compressed files
            if (!fullPath.endsWith('.gz') && !fullPath.endsWith('.br')) {
                compressFile(fullPath);
            }
        }
    });
}

// Start compressing
walkDir(directory);

console.log('Compression completed.');
