import { ArgumentParser } from '@eigenspace/argument-parser';
import { Bundler } from './bundler';

const argParser = new ArgumentParser();
const argv = argParser.get(process.argv.slice(2));

const sourceDirParam = argv.get('src') as string | undefined;
const sourceDir = sourceDirParam || 'dist';
const distDirParam = argv.get('dist') as string | undefined;
const distDir = distDirParam || sourceDir;

const bundler = new Bundler();
bundler.bundle(sourceDir, distDir);
