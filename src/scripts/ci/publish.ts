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

import * as fs from 'fs';
import * as childProcess from 'child_process';
import * as minimist from 'minimist';
import { Dictionary } from '@eigenspace/common-types/src/types/dictionary';

const exists = require('npm-exists');

const currentDir = process.cwd();
const packageJson = require(`${currentDir}/package.json`);
const exec = childProcess.execSync;
const argv = minimist(process.argv.slice(2));

// Get dependency suffix (branch name)
const { name, version } = packageJson;
const dist = argv.dist || fs.existsSync('./dist') && './dist' || currentDir;

let currentBranch = getCurrentBranchName();

if (!Boolean(currentBranch)) {
    // eslint-disable-next-line no-console
    console.log('Current branch is undefined!');
    process.exit(1);
}

// eslint-disable-next-line no-console,no-console
console.log('branch:', currentBranch);
// eslint-disable-next-line no-console
console.log('package to publish:', dist);

// We consider snapshot as any non-master dependency version.
// Every snapshot dependency version should be prerelease version that has suffix contains branch name
const isSnapshotVersion = currentBranch !== 'master';
const suffix = prepareSuffix(isSnapshotVersion ? `-${currentBranch}` : '');
const fullVersion = `${name}@${version}${suffix}`;

// If branch name is not master, i.e. there is no suffix
if (isSnapshotVersion) {
    // eslint-disable-next-line no-console
    console.log('start publishing snapshot package...');
    // Then remove dependency from registry
    run(`npm unpublish ${fullVersion}`);
    publish(`${version}${suffix}`);

    if (dist === currentDir) {
        // Remove snapshot version from package.json
        run('git checkout package.json');
    }

} else {
    // eslint-disable-next-line no-console
    console.log('start publishing release package...');
    exists(name).then((projectExists: Boolean) => {
        // If it is production version (master), we check it exists in npm registry
        const versionInRegistry = projectExists && run(`npm view ${fullVersion} version`);
        if (versionInRegistry) {
            // eslint-disable-next-line no-console
            console.log(`package '${fullVersion}' exists in registry`);
            incrementVersionAndPush();
        }

        publish();
        checkout('dev');
        merge('master');
        incrementVersionAndPush();
    });
}

// Functions
// -----------

function run(command: string): string {
    // eslint-disable-next-line no-console
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    // eslint-disable-next-line no-console
    console.log(stdout);
    return stdout;
}

function publish(packageVersion?: string): void {
    if (packageVersion) {
        setVersionToDistPackage(packageVersion);
    }

    run(`npm publish ${dist}`);
}

function incrementVersionAndPush(): void {
    // We getting new package.json to get always actual package.json for case when we change our branch.
    // For example, we move from master to dev. There at dev branch package.json will be different.
    const parsedPackageJsonFile = readJsonFile('package.json');
    // Same with version. Always getting actual version of package.
    const { version: packageVersion } = parsedPackageJsonFile;

    const [major, minor, patch] = packageVersion.split('.');
    const incrementedVersion = `${major}.${minor}.${Number(patch) + 1}`;
    // eslint-disable-next-line no-console
    console.log('incremented version:', incrementedVersion);

    parsedPackageJsonFile.version = incrementedVersion;
    const indent = 4;
    const packageJsonStringified = JSON.stringify(parsedPackageJsonFile, undefined, indent);
    fs.writeFileSync('package.json', packageJsonStringified);
    fs.writeFileSync(`${dist}/package.json`, packageJsonStringified);

    run(`git commit --all --no-verify --message "auto/ci: set version ${incrementedVersion}"`);
    run(`git push --no-verify origin ${currentBranch}`);
}

function setVersionToDistPackage(packageVersion: string): void {
    // eslint-disable-next-line no-console
    console.log('update version in dist package.json to:', packageVersion);

    const distPackageJsonFile = readJsonFile(`${dist}/package.json`);
    distPackageJsonFile.version = packageVersion;

    const indent = 4;
    const packageJsonStringified = JSON.stringify(distPackageJsonFile, undefined, indent);
    fs.writeFileSync(`${dist}/package.json`, packageJsonStringified);

    // eslint-disable-next-line no-console
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

function readJsonFile(filename: string): Dictionary<string> {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function prepareSuffix(rawSuffix: string): string {
    return rawSuffix.replace(/\//g, '-');
}
