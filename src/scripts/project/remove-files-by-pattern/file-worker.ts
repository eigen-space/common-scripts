import * as fs from 'fs';
import * as path from 'path';
import { walkThrough } from '../../..';

export class FileWorker {
    private filenameRegex: RegExp;

    constructor() {
        this.removeFileByRegExp = this.removeFileByRegExp.bind(this);
    }

    /**
     * Removes all files that matches specified pattern in folder you also provide.
     *
     * @param {string} searchDir Directory where script will do search.
     * @param {string} pattern RegExp pattern without slashes (/). For example, styles.d.ts$ becomes /styles.d.ts$/.
     */
    removeFilesByPattern(searchDir: string, pattern: string): void {
        if (!searchDir || !pattern) {
            throw new Error('pattern and searchDir properties is required');
        }

        this.filenameRegex = new RegExp(pattern);
        walkThrough(searchDir, this.removeFileByRegExp);
    }

    // noinspection JSMethodCanBeStatic
    private removeFileByRegExp(dir: string, file: string): void {
        const concatenatedPath = path.join(dir, file);
        if (fs.statSync(concatenatedPath).isFile() && this.filenameRegex.test(file.toString())) {
            fs.unlinkSync(concatenatedPath);
            console.log('removed file:', file);
        }
    }
}
