import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is one level up from scripts/
const distDir = path.resolve(__dirname, '../dist');
const src = path.join(distDir, 'index.html');
const dest = path.join(distDir, '404.html');

console.log(`Copying ${src} to ${dest}...`);

try {
    if (!fs.existsSync(src)) {
        console.error(`Source file ${src} does not exist. Build failed or dist folder missing?`);
        process.exit(1);
    }
    fs.copyFileSync(src, dest);
    console.log('Successfully created 404.html for GitHub Pages SPA support.');
} catch (err) {
    console.error('Error copying 404.html:', err);
    process.exit(1);
}
