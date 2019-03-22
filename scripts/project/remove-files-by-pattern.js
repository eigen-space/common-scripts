/**
 * Script removes all files that matches specified pattern in folder you also provide.
 *
 * Parameters:
 *  --searchDir Directory where script will do search
 *  @type {string}
 *
 *  --pattern RegExp pattern without slashes (/). For example, styles.d.ts$ becomes /styles.d.ts$/
 *  @type {string}
 */

const { walkThrough } = require('../common/common');
const path = require('path');
const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));

const searchDir = argv.searchDir;
const pattern = argv.pattern;

if (!searchDir || !pattern) {
    throw new Error('pattern and searchDir properties is required');
}

const regExp = new RegExp(pattern);

walkThrough(
    searchDir,
    (dir, file) => {
        const concatenatedPath = path.join(dir, file);
        if (fs.statSync(concatenatedPath).isFile() && regExp.test(file.toString())) {
            fs.unlinkSync(concatenatedPath);
            console.log('removed file:', file);
        }
    }
);