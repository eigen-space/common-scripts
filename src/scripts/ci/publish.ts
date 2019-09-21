/* eslint-disable no-console */
/**
 * Script automates versioning/publishing process of packages.
 * It allows us to introduce such type of dependencies like snapshots.
 * We name dependency as `snapshot` if its version looks like: `x.x.x-<branch-name`.
 * We name dependency as `release` if its version does not have suffix: `x.x.x`.
 *
 * Environmental requirements.
 * It is necessary that at the time of launching the script in the root of the project there was a .npmrc file
 * containing an access token at the time of launching the script.
 *
 * Parameters:
 *  --dist      (optional)  You can specify destination of package you want to publish.
 *                          Default: './dist' or current directory if no ./dist is there.
 *
 * @type {string}
 * @see {@link https://www.notion.so/arrivalms/Versioning-5bf1876eb2f142339d719f818cc2250c}
 */

import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import { ArgumentParser } from '@eigenspace/argument-parser';

const exec = childProcess.execSync;

const argParser = new ArgumentParser();
const argv = argParser.get(process.argv.slice(2));

const projectPaths: string[] = argv.get('projectPaths') as string[] || ['/'];

let currentBranch = getCurrentBranchName();

if (!Boolean(currentBranch)) {
    console.log('Current branch is undefined!');
    process.exit(1);
}

console.log('branch:', currentBranch);
// We consider snapshot as any non-master dependency version.
// Every snapshot dependency version should be prerelease version that has suffix contains branch name
const isSnapshotVersion = currentBranch !== 'master';
const suffix = prepareSuffix(isSnapshotVersion ? `-${currentBranch}` : '');

projectPaths.forEach(projectPath => publishPackage(projectPath));

if (isSnapshotVersion) {
    process.exit(0);
}

checkout('dev');
merge('master');

projectPaths.forEach(projectPath => updatePackageVersionInDev(projectPath));
push();

// Functions
// -----------

function publishPackage(projectPath: string): void {
    const currentDir = `${process.cwd()}${projectPath}`;

    const packageJsonPath = path.join(currentDir, 'package.json');
    // Get dependency suffix (branch name)
    const { name, version, private: isPrivate } = require(packageJsonPath);
    // We consider project private if it has either `private: true` or do not has private field.
    const access = isPrivate ? '' : '--access public';

    const dist = getDistDirectory(currentDir);

    console.log('package to publish:', dist);

    const fullVersion = `${name}@${version}${suffix}`;

    // If branch name is not master, i.e. there is no suffix
    if (isSnapshotVersion) {
        console.log('start publishing snapshot package...');
        // Then remove dependency from registry
        run(`npm unpublish ${fullVersion}`);
        publish(dist, access, `${version}${suffix}`);

        if (dist === currentDir) {
            // Remove snapshot version from package.json
            run('git checkout package.json');
        }
    } else {
        console.log('start publishing release package...');

        const projectExists = checkForProjectExistence(name);
        // If it is production version (master), we check it exists in npm registry
        const versionInRegistry = projectExists && run(`npm view ${fullVersion} version`);
        if (versionInRegistry) {
            console.log(`package '${fullVersion}' exists in registry`);
            process.exit(1);
        }

        publish(dist, access);
    }
}

function updatePackageVersionInDev(projectPath: string): void {
    const currentDir = `${process.cwd()}${projectPath}`;

    const packageJsonPath = path.join(currentDir, 'package.json');
    const dist = getDistDirectory(currentDir);

    incrementVersionAndCommit(packageJsonPath, dist);
}

function run(command: string): string {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
    return stdout;
}

function publish(dist: string, access: string, packageVersion?: string): void {
    if (packageVersion) {
        setVersionToDistPackage(packageVersion, dist);
    }

    run(`npm publish ${dist} ${access}`);
}

function incrementVersionAndCommit(packageJsonPath: string, dist: string): void {
    // We getting new package.json to get always actual package.json for case when we change our branch.
    // For example, we move from master to dev. There at dev branch package.json will be different.
    const parsedPackageJsonFile = require(packageJsonPath);
    // Same with version. Always getting actual version of package.
    const { name, version: packageVersion } = parsedPackageJsonFile;

    const [major, minor, patch] = packageVersion.split('.');
    const incrementedVersion = `${major}.${minor}.${Number(patch) + 1}`;
    console.log('incremented version:', incrementedVersion);

    parsedPackageJsonFile.version = incrementedVersion;
    const indent = 4;
    const packageJsonStringified = JSON.stringify(parsedPackageJsonFile, undefined, indent);
    fs.writeFileSync(packageJsonPath, packageJsonStringified);
    fs.writeFileSync(`${dist}/package.json`, packageJsonStringified);

    run(`git commit --all --no-verify --message "auto/ci: set version of ${name} to ${incrementedVersion}"`);
}

function push(): void {
    run(`git push --no-verify origin ${currentBranch}`);
}

function setVersionToDistPackage(packageVersion: string, dist: string): void {
    console.log('update version in dist package.json to:', packageVersion);

    const packageJsonPath = path.join(dist, 'package.json');
    const distPackageJsonFile = require(packageJsonPath);
    distPackageJsonFile.version = packageVersion;

    const indent = 4;
    const packageJsonStringified = JSON.stringify(distPackageJsonFile, undefined, indent);
    fs.writeFileSync(`${dist}/package.json`, packageJsonStringified);

    console.log('version in dist package.json was successfully updated');
}

function checkout(branchName: string): void {
    currentBranch = branchName;
    run('git fetch origin --progress --prune');
    run(`git checkout --track origin/${branchName}`);
}

function merge(branchName: string): void {
    run(`git merge --no-ff ${branchName}`);
}

function getCurrentBranchName(): string | undefined {
    const branchList: string = run('git branch');
    const branch = branchList.split('\n')
        .find(branchName => branchName.startsWith('*'));

    return (branch || '').replace('* ', '');
}

function prepareSuffix(rawSuffix: string): string {
    return rawSuffix.replace(/\//g, '-');
}

function getDistDirectory(currentDir: string): string {
    const distDir = path.join(currentDir, 'dist');
    return fs.existsSync(distDir) && distDir || currentDir;
}

function checkForProjectExistence(name: string): boolean {
    const search = JSON.parse(run(`npm search ${name} --json`));
    return search.some((project: { name: string }) => project.name === name);
}