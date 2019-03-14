const fs = require('fs');
const path = require('path');
const { walkThrough } = require('../common/common');
const argv = require('minimist')(process.argv.slice(2));

const sourceDir = argv.src || 'dist';
const distDir = argv.dist || sourceDir;

bundleDts(sourceDir, distDir);

function bundleDts(sourceDir, distDir) {
    const files = [];

    walkThrough(
        sourceDir,
        (dir, file) => {
            const fillPath = path.join(dir, file);
            if (fs.statSync(fillPath).isFile() && /\.d\.ts$/.test(fillPath)) {
                files.push(fillPath);
            }
        }
    );

    const statements  = files
        .map(file => file.replace(/\\/g, '/'))
        .map(file => new RegExp(`^${sourceDir}/(.*)\.d\.ts$`).exec(file))
        .filter(match => Boolean(match))
        .map(match => match[1])
        .map(file => `export * from './${file}';`)
        .join('\n');

    fs.writeFileSync(`${distDir}/index.d.ts`, statements);
}
