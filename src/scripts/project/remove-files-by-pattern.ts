/**
 * Script removes all files that matches specified pattern in folder you also provide.
 *
 * Parameters:
 *  --searchDir Directory where script will do search
 *
 *  @type {string}
 *
 *  --pattern RegExp pattern without slashes (/). For example, styles.d.ts$ becomes /styles.d.ts$/
 *
 *  @type {string}
 */

import { walkThrough } from '../..';
import * as fs from 'fs';
import * as path from 'path';
import { ArgumentParser } from '@eigenspace/argument-parser';

const argParser = new ArgumentParser();
const argv = argParser.get(process.argv.slice(2));
const searchDir = argv.get('searchDir') as string | undefined;
const pattern = argv.get('pattern') as string | undefined;

if (!searchDir || !pattern) {
    throw new Error('pattern and searchDir properties is required');
}

const regExp = new RegExp(pattern);

walkThrough(
    searchDir,
    (dir: string, file: string) => {
        const concatenatedPath = path.join(dir, file);
        if (fs.statSync(concatenatedPath).isFile() && regExp.test(file.toString())) {
            fs.unlinkSync(concatenatedPath);
            // eslint-disable-next-line no-console
            console.log('removed file:', file);
        }
    }
);