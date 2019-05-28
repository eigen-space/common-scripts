import * as fs from 'fs';
import * as path from 'path';

function copyFileSync(source: string, target: string): void {

    let targetFile = target;

    // If target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source: string, target: string): void {
    const targetFolder = path.join(target, path.basename(source));

    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    if (fs.lstatSync(source).isDirectory()) {
        const files = fs.readdirSync(source);

        files.forEach(file => {
            const curSource = path.join(source, file);

            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

export function copy(sources: string[], target: string): void {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    sources.forEach(source => {
        if (fs.lstatSync(source).isFile()) {
            copyFileSync(source, target);
        } else {
            copyFolderRecursiveSync(source, target);
        }
    });
}