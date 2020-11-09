import * as fs from 'fs';
import * as path from 'path';
import { walkThrough } from '../..';
import { ArgumentParser } from '@eigenspace/argument-parser';

const argParser = new ArgumentParser();
const argv = argParser.get(process.argv.slice(2));

const sourceDirParam = argv.get('src') as string | undefined;
const sourceDir = sourceDirParam || 'dist';
const distDirParam = argv.get('dist') as string | undefined;
const distDir = distDirParam || sourceDir;

bundleDts(sourceDir, distDir);

function bundleDts(fromDir: string, toDir: string): void {
    const files: string[] = [];

    walkThrough(
        fromDir,
        (dir: string, file: string) => {
            const fillPath = path.join(dir, file);
            if (fs.statSync(fillPath).isFile() && /\.d\.ts$/.test(fillPath)) {
                files.push(fillPath);
            }
        }
    );

    const statements = files
        .map(file => file.replace(/\\/g, '/'))
        .map(file => new RegExp(`^${fromDir}/(.*)\.d\.ts$`).exec(file))
        .filter(match => Boolean(match))
        // @ts-ignore: Object is possibly 'null'
        .map(match => match[1])
        .map(file => `export * from './${file}';`)
        .join('\n');

    fs.writeFileSync(`${toDir}/index.d.ts`, statements);
}
