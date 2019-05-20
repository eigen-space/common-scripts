import { WriteFileOptions } from 'fs';
import { Dictionary } from '../../common/types/dictionary';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export function createDirectory(directory: string): void {
    const parentDirectory = path.dirname(directory);

    if (!fs.existsSync(parentDirectory)) {
        createDirectory(parentDirectory);
    }

    if (fs.existsSync(parentDirectory) && !fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}

export function deleteAllFilesInDirectory(directory: string): void {
    fs.readdirSync(directory).forEach((file: string) => {
        fs.unlinkSync(path.join(directory, file));
    });
}

export function removeDirectory(directory: string): void {
    walkThrough(
        directory,
        () => {},
        (dir: string) => {
            deleteAllFilesInDirectory(dir);
            fs.rmdirSync(dir);
        }
    );
}

export function writeObjectAsJson(pathToSave: string, object: Dictionary, options: WriteFileOptions = {}): void {
    const indent = 4;
    const data = JSON.stringify(object, null, indent)
        .replace(/(\r)?\n/g, os.EOL);

    fs.writeFileSync(pathToSave, data, options);
}

export function walkThrough(directory: string, callback: Function, recursiveCallback?: Function): void {
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
