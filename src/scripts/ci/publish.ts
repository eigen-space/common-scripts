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
 *  --branch      (optional)  You can specify branch you are in. It is useful when you in detached mode.
 *                          Default: gets current branch by `git branch` command.
 *  --projectPaths      (optional)  You can specify project dirs you want to publish as array.
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

const projectPaths = argv.get('projectPaths') as string[] || ['/'];
const currentBranch = argv.get('branch') || getCurrentBranchName();

// We assume that we publish only packages from the master branch
if (currentBranch !== 'master') {
    console.error('Current branch is not master!');
    process.exit(1);
}

console.log('branch:', currentBranch);

projectPaths.forEach(projectPath => {
    publishPackage(projectPath);
    updatePackageVersion(projectPath);
});

push();

// Functions
// -----------

function publishPackage(projectPath: string): void {
    const currentDir = `${process.cwd()}${projectPath}`;

    const packageJsonPath = path.join(currentDir, 'package.json');
    const { name, version } = require(packageJsonPath);

    const dist = getDistDirectory(currentDir);

    console.log('package to publish:', dist);

    const fullVersion = `${name}@${version}`;

    console.log('start publishing release package...');

    const projectExists = checkForProjectExistence(name);
    // We check it exists in npm registry in case we try to push already published version
    const versionInRegistry = projectExists && run(`npm view ${fullVersion} version`);
    if (versionInRegistry) {
        console.log(`package '${fullVersion}' exists in registry`);
        process.exit(1);
    }

    publish(dist);
}

function updatePackageVersion(projectPath: string): void {
    const currentDir = `${process.cwd()}${projectPath}`;
    const packageJsonPath = path.join(currentDir, 'package.json');
    incrementVersionAndCommit(packageJsonPath);
}

function run(command: string): string {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
    return stdout;
}

function publish(dist: string): void {
    // We use public access to be able publish public packages at first time to npm registry.
    // Private packages are on private hosting so it does not affect them.
    run(`npm publish ${dist} --access public`);
}

function incrementVersionAndCommit(packageJsonPath: string): void {
    // TODO: Try to remove getting package json every time because it will be the same
    const parsedPackageJsonFile = require(packageJsonPath);
    const { name, version } = parsedPackageJsonFile;

    const [major, minor, patch] = version.split('.');
    const incrementedVersion = `${major}.${minor}.${Number(patch) + 1}`;
    console.log('incremented version:', incrementedVersion);

    parsedPackageJsonFile.version = incrementedVersion;
    const indent = 4;
    const packageJsonStringified = JSON.stringify(parsedPackageJsonFile, undefined, indent);
    fs.writeFileSync(packageJsonPath, packageJsonStringified);

    run(`git commit --all --no-verify --message "auto/ci: set version of ${name} to ${incrementedVersion}"`);
}

function push(): void {
    run(`git push --no-verify origin ${currentBranch}`);
}

function getCurrentBranchName(): string {
    const branchList: string = run('git branch');
    const branch = branchList.split('\n')
        .find(branchName => branchName.startsWith('*'));

    return (branch || '').replace('* ', '');
}

function getDistDirectory(currentDir: string): string {
    const distDir = path.join(currentDir, 'dist');
    return fs.existsSync(distDir) && distDir || currentDir;
}

function checkForProjectExistence(name: string): boolean {
    const search = JSON.parse(run(`npm search ${name} --json`));
    return search.some((project: { name: string }) => project.name === name);
}
