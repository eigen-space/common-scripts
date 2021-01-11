import { ArgumentParser } from '@eigenspace/argument-parser';
import { FileWorker } from './file-worker';

const argParser = new ArgumentParser();
const argv = argParser.get(process.argv.slice(2));

const searchDir = argv.get('searchDir') as string;
const pattern = argv.get('pattern') as string;

const fileWorker = new FileWorker();
fileWorker.removeFilesByPattern(searchDir, pattern);
