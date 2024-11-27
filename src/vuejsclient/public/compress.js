const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const brotli = require('brotli');

const directory = path.join(__dirname, '../'); // On devrait démarrer dans dist/public/vuejsclient

function compressFile(filePath) {
    const fileContents = fs.readFileSync(filePath);

    if (!fileContents) {
        console.error('Error reading file:', filePath);
        return;
    }

    try {

        // Gzip compression
        const gzipped = zlib.gzipSync(fileContents);
        fs.writeFileSync(filePath + '.gz', gzipped);
    } catch (error) {

        console.error('Error compressing file:', filePath, error);
    }

    try {

        // Brotli compression
        const brotliCompressed = brotli.compress(fileContents);
        fs.writeFileSync(filePath + '.br', Buffer.from(brotliCompressed));
    } catch (error) {

        console.error('Error compressing file:', filePath, error);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        console.debug('Compression processing ', fullPath);

        if (fs.lstatSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else {
            // Ignore already compressed files
            if (!fullPath.endsWith('.gz') && !fullPath.endsWith('.br')) {

                if (fs.existsSync(fullPath + '.gz') && fs.existsSync(fullPath + '.br')) {
                    return;
                }

                compressFile(fullPath);
            }
        }
    });
}

console.log('Compression starting...');

// Start compressing
walkDir(directory);

console.log('Compression completed.');
