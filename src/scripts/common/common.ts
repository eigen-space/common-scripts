import { WriteFileOptions } from 'fs';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AnyDictionary } from '@eigenspace/common-types';

export function writeObjectAsJson(pathToSave: string, object: AnyDictionary, options: WriteFileOptions = {}): void {
    const indent = 4;
    const data = JSON.stringify(object, null, indent)
        .replace(/(\r)?\n/g, os.EOL);

    fs.writeFileSync(pathToSave, data, options);
}

export declare type WalkThroughCallback = (dir: string, file: string) => void;
export declare type RecursiveWalkThroughCallback = (dir: string) => void;
export function walkThrough(
    directory: string,
    callback: WalkThroughCallback,
    recursiveCallback?: RecursiveWalkThroughCallback
): void {
    if (!fs.statSync(directory).isDirectory()) {
        return;
    }

    fs.readdirSync(directory).forEach(file => {
        callback(directory, file);

        const nextDir = path.join(directory, file);
        if (fs.existsSync(nextDir)) {
            walkThrough(nextDir, callback, recursiveCallback);
        }
    });

    if (recursiveCallback) {
        recursiveCallback(directory);
    }
}
