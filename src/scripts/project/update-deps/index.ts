import { DependencyWorker } from './dependency-worker';

const dependenciesToReinstall = process.argv.slice(2);

const dependencyWorker = new DependencyWorker();
dependencyWorker.update(dependenciesToReinstall);
