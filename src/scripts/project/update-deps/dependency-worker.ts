import * as fs from 'fs';
import { Dictionary } from '@eigenspace/common-types';
import * as childProcess from 'child_process';

export class DependencyWorker {
    private static DEPENDENCY_FLAGS = new Map([
        ['dependencies', ''],
        ['devDependencies', '-D'],
        ['optionalDependencies', '-O'],
        ['peerDependencies', '-P']
    ]);

    constructor(private readonly exec = childProcess.execSync) {
    }

    /**
     * Script automates reinstall of packages.
     * Packages with snapshot postfix do not change version.
     * Hence we need to reinstall them manually.
     * This script delete them then install.
     *
     * @param {string[]} [packages=(all packages with snapshot postfix)]
     *      Stream of package names separated by space character you want to reinstall.
     */
    update(packages: string[]): void {
        const isFullUpdate = !Boolean(packages.length);

        const dependencyFlags = new Map([
            ['dependencies', ''],
            ['devDependencies', '-D'],
            ['optionalDependencies', '-O'],
            ['peerDependencies', '-P']
        ]);

        const dependencyTypes = Array.from(dependencyFlags.keys());

        const currentDir = process.cwd();
        const packageJson = require(`${currentDir}/package.json`);
        dependencyTypes.forEach(dependencyType => {
            const dependenciesMap = packageJson[dependencyType];

            if (!dependenciesMap) {
                return;
            }

            const dependenciesToUpdate = this.findDependenciesToUpdate(dependenciesMap, packages, isFullUpdate);
            if (!dependenciesToUpdate.length) {
                return;
            }

            const latestDependencies = this.findLatestDependencies(dependenciesMap);

            // eslint-disable-next-line no-console
            console.log('dependencies to update', dependenciesToUpdate);

            const dependenciesWithVersion = this.getDependenciesWithVersion(dependenciesMap, dependenciesToUpdate);
            this.updateDependencies(dependenciesToUpdate, dependenciesWithVersion, dependencyType);
            this.restoreLatestDependencies(dependencyType, latestDependencies);
        });
    }

    private findLatestDependencies(dependencyStore: Dictionary<string>): string[] {
        return Object.keys(dependencyStore)
            .filter(key => dependencyStore[key] === 'latest');
    }

    private findDependenciesToUpdate(
        dependencyStore: Dictionary<string>,
        packages: string[],
        isFullUpdate: boolean
    ): string[] {
        if (!isFullUpdate) {
            return packages.filter(dependency => dependencyStore[dependency]);
        }

        const snapshotPattern = /-/;
        return Object.keys(dependencyStore)
            .filter(key => {
                const isSnapshot = snapshotPattern.test(dependencyStore[key]);
                const isUrl = dependencyStore[key].startsWith('http');
                const isLatest = dependencyStore[key] === 'latest';
                return isSnapshot || isUrl || isLatest;
            });
    }

    private getDependenciesWithVersion(dependencyStore: Dictionary<string>, dependenciesToUpdate: string[]): string[] {
        return dependenciesToUpdate.map(packageToRemove => `${packageToRemove}@${dependencyStore[packageToRemove]}`);
    }

    private updateDependencies(
        dependenciesToUpdate: string[],
        dependenciesWithVersion: string[],
        dependencyType: string): void {
        const dependencies = dependenciesToUpdate.join(' ');
        this.run(`yarn remove ${dependencies}`);

        const depsWithVersion = dependenciesWithVersion.join(' ');
        this.run(`yarn add ${depsWithVersion} ${DependencyWorker.DEPENDENCY_FLAGS.get(dependencyType)}`);
    }

    private restoreLatestDependencies(dependencyType: string, latestDependencies: string[]): void {
        if (!latestDependencies.length) {
            return;
        }

        const parsedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const latestDependenciesMap = latestDependencies.reduce((acc, curr) => {
            return { ...acc, [curr]: 'latest' };
        }, {} as Dictionary<string>);
        parsedPackageJson[dependencyType] = { ...parsedPackageJson[dependencyType], ...latestDependenciesMap };

        const indent = 4;
        const packageJsonStringified = JSON.stringify(parsedPackageJson, undefined, indent);
        fs.writeFileSync('package.json', packageJsonStringified);
    }

    private run(command: string): void {
        // eslint-disable-next-line no-console
        console.log('run command:', command);
        const stdout = this.exec(command, { encoding: 'utf8' });
        // eslint-disable-next-line no-console
        console.log(stdout);
    }
}
