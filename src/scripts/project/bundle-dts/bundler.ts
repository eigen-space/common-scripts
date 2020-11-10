import * as fs from 'fs';
import * as path from 'path';
import { walkThrough } from '../../..';

export class Bundler {

    bundle(fromDir: string, toDir: string): void {
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
}
