import * as fs from 'fs';
import * as path from 'path';
import { walkThrough } from '../../..';

export class FileWorker {

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
    }
}
