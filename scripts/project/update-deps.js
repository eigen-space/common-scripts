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

const currentDir = process.cwd();
const packageJson = require(`${currentDir}/package.json`);
const exec = require('child_process').execSync;
const dependenciesToReinstall = process.argv.slice(2);
const shouldUpdateAllSnapshotDependencies = !dependenciesToReinstall.length;
let shouldUpdateLatestDependencies = true;

const dependencyFlags = new Map([
    ['dependencies', ''],
    ['devDependencies', '-D'],
    ['optionalDependencies', '-O'],
    ['peerDependencies', '-P']
]);

console.log('dependenciesToReinstall', dependenciesToReinstall);

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

    console.log('dependencies to update', dependenciesToUpdate);

    const dependenciesWithVersion = getDependenciesWithVersion(dependenciesMap, dependenciesToUpdate);
    updateDependencies(dependenciesToUpdate, dependenciesWithVersion, dependencyType);

    shouldUpdateLatestDependencies = false;
});

// If no one package was added then we need explicitly update latest dependencies.
if (shouldUpdateLatestDependencies) {
    run('yarn');
}

function findDependenciesToUpdate(dependenciesMap) {
    if (!shouldUpdateAllSnapshotDependencies) {
        return dependenciesToReinstall.filter(dependency => dependenciesMap[dependency]);
    }

    const snapshotPattern = /-/;
    return Object.keys(dependenciesMap).filter(key => {
        const isSnapshot = snapshotPattern.test(dependenciesMap[key]);
        const isUrl = dependenciesMap[key].startsWith('http');
        const isLatest = dependenciesMap[key] === 'latest';
        return isSnapshot || isUrl || isLatest;
    });
}

function getDependenciesWithVersion(dependenciesMap, dependenciesToUpdate) {
    return dependenciesToUpdate.map(packageToRemove => `${packageToRemove}@${dependenciesMap[packageToRemove]}`);
}

function updateDependencies(dependenciesToUpdate, dependenciesWithVersion, dependencyType) {
    const dependencies = dependenciesToUpdate.join(' ');
    run(`yarn remove ${dependencies}`);

    const depsWithVersion = dependenciesWithVersion.join(' ');
    run(`yarn add ${depsWithVersion} ${dependencyFlags.get(dependencyType)}`);
}

function run(command) {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
}