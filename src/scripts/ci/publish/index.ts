import { Publisher } from './publisher';
import { ArgumentParser } from '@eigenspace/argument-parser';

const argParser = new ArgumentParser();
const argv = argParser.get(process.argv.slice(2));

const branch = argv.get('branch') as string;
const projectPaths = argv.get('projectPaths') as string[];

const publisher = new Publisher();
publisher.start(branch, projectPaths);
