import * as fs from 'fs';
import * as path from 'path';
import { walkThrough } from '../../..';

export class Bundler {
    private files: string[];

    constructor() {
        this.findDeclarationFile = this.findDeclarationFile.bind(this);
    }

    bundle(fromDir: string, toDir: string): void {
        this.files = [];

        walkThrough(fromDir, this.findDeclarationFile);

        const statements = this.files
            .map(file => file.replace(/\\/g, '/'))
            .map(file => new RegExp(`^${fromDir}/(.*)\.d\.ts$`).exec(file))
            .filter(match => Boolean(match))
            .map(match => match![1])
            .map(file => `export * from './${file}';`)
            .join('\n');

        fs.writeFileSync(`${toDir}/index.d.ts`, statements);
    }

    private findDeclarationFile(dir: string, file: string): void {
        const fillPath = path.join(dir, file);
        if (fs.statSync(fillPath).isFile() && /\.d\.ts$/.test(fillPath)) {
            this.files.push(fillPath);
        }
    }
}
