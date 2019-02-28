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
const updateAllSnapshotDependencies = !dependenciesToReinstall.length;

const dependencyFlags = new Map([
    ['dependencies', ''],
    ['devDependencies', '-D'],
    ['optionalDependencies', '-O'],
    ['peerDependencies', '-P']
]);

const dependencyTypes = Array.from(dependencyFlags.keys());

dependencyTypes.forEach(dependencyType => {
    const dependenciesMap = packageJson[dependencyType];

    if (dependenciesMap) {
        const packagesToRemove = findPackagesToRemove(dependenciesMap);
        if (!packagesToRemove.length) {
            return;
        }

        const dependenciesToInstall = getDependenciesToInstall(dependenciesMap, packagesToRemove);
        console.log('packages to remove', packagesToRemove);

        run(getCommand(packagesToRemove, dependenciesToInstall, dependencyType));
    }
});

function findPackagesToRemove(dependenciesMap) {
    if (updateAllSnapshotDependencies) {
        const snapshotDependencyPattern = /[\^|~]?\d+\.\d+\.\d+-.+/;
        return Object.keys(dependenciesMap).filter(key => snapshotDependencyPattern.test(dependenciesMap[key]));

    }

    return dependenciesToReinstall.filter(dependency => dependenciesMap[dependency]);
}

function getDependenciesToInstall(dependenciesMap, packagesToRemove) {
    return packagesToRemove.map(packageToRemove => `${packageToRemove}@${dependenciesMap[packageToRemove]}`);
}

function getCommand(packagesToRemove, dependenciesToInstall, dependencyType) {
    const packages = packagesToRemove.join(' ');
    const dependencies = dependenciesToInstall.join(' ');
    return `yarn remove ${packages} && yarn add ${dependencies} ${dependencyFlags.get(dependencyType)}`;
}

function run(command) {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
}