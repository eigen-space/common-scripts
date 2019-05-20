#!/usr/bin/env node
/**
 * Script automates reinstall of packages.
 * Packages with snapshot postfix do not change version.
 * Hence we need to reinstall them manually.
 * This script delete them then install.
 *
 * Parameters:
 *  packages      (optional)  Stream of package names separated by space character you want to reinstall.
 *                            Default: all packages with snapshot postfix.
 *
 * @type {string}
 */

import * as fs from 'fs';
import * as childProcess from 'child_process';
import { Dictionary } from '../../common/types/dictionary';

const currentDir = process.cwd();
const packageJson = require(`${currentDir}/package.json`);
const exec = childProcess.execSync;

const dependenciesToReinstall = process.argv.slice(2);
const isFullUpdate = !Boolean(dependenciesToReinstall.length);

const dependencyFlags = new Map([
    ['dependencies', ''],
    ['devDependencies', '-D'],
    ['optionalDependencies', '-O'],
    ['peerDependencies', '-P']
]);

const dependencyTypes = Array.from(dependencyFlags.keys());

dependencyTypes.forEach(dependencyType => {
    const dependenciesMap = packageJson[dependencyType];

    if (!dependenciesMap) {
        return;
    }

    const dependenciesToUpdate = findDependenciesToUpdate(dependenciesMap);
    if (!dependenciesToUpdate.length) {
        return;
    }

    const latestDependencies = findLatestDependencies(dependenciesMap);

    console.log('dependencies to update', dependenciesToUpdate);

    const dependenciesWithVersion = getDependenciesWithVersion(dependenciesMap, dependenciesToUpdate);
    updateDependencies(dependenciesToUpdate, dependenciesWithVersion, dependencyType);
    restoreLatestDependencies(dependencyType, latestDependencies);
});

function findLatestDependencies(dependencyStore: Dictionary<string>): string[] {
    return Object.keys(dependencyStore)
        .filter(key => dependencyStore[key] === 'latest');
}

function findDependenciesToUpdate(dependencyStore: Dictionary<string>): string[] {
    if (!isFullUpdate) {
        return dependenciesToReinstall.filter(dependency => dependencyStore[dependency]);
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

function getDependenciesWithVersion(dependencyStore: Dictionary<string>, dependenciesToUpdate: string[]): string[] {
    return dependenciesToUpdate.map(packageToRemove => {
        return `${packageToRemove}@${dependencyStore[packageToRemove]}`;
    });
}

function updateDependencies(
    dependenciesToUpdate: string[],
    dependenciesWithVersion: string[],
    dependencyType: string): void {
    const dependencies = dependenciesToUpdate.join(' ');
    run(`yarn remove ${dependencies}`);

    const depsWithVersion = dependenciesWithVersion.join(' ');
    run(`yarn add ${depsWithVersion} ${dependencyFlags.get(dependencyType)}`);
}

function restoreLatestDependencies(dependencyType: string, latestDependencies: string[]): void {
    if (!latestDependencies.length) {
        return;
    }

    const parsedPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const latestDependenciesMap = latestDependencies.reduce((acc, curr) => {
        acc[curr] = 'latest';
        return acc;
    }, {} as Dictionary<string>);
    parsedPackageJson[dependencyType] = { ...parsedPackageJson[dependencyType], ...latestDependenciesMap };

    const indent = 4;
    const packageJsonStringified = JSON.stringify(parsedPackageJson, undefined, indent);
    fs.writeFileSync('package.json', packageJsonStringified);
}

function run(command: string): void {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
}