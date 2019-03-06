/**
 * Script automates versioning/publishing process of packages.
 * It allows us to introduce such type of dependencies like snapshots.
 * We name dependency as `snapshot` if its version looks like: `x.x.x-<branch-name`.
 * We name dependency as `release` if its version does not have suffix: `x.x.x`.
 *
 * Parameters:
 *  --dist      (optional)  You can specify destination of package you want to publish.
 *                          Default: './dist' or current directory if no ./dist is there.
 *
 * @type {string}
 * @see {@link https://www.notion.so/arrivalms/Versioning-5bf1876eb2f142339d719f818cc2250c}
 */

const currentDir = process.cwd();
const packageJson = require(`${currentDir}/package.json`);
const fs = require('fs');
const childProcess = require('child_process');
const exec = childProcess.execSync;
const argv = require('minimist')(process.argv.slice(2));

// Get dependency suffix (branch name)
const { name, version } = packageJson;
const dist = argv.dist || fs.existsSync('./dist') && './dist' || currentDir;

let currentBranch = getCurrentBranchName();

console.log('branch:', currentBranch);
console.log('package to publish:', dist);

// We consider snapshot as any non-master dependency version.
// Every snapshot dependency version should be prerelease version
// that has suffix contains branch name
const isSnapshotVersion = currentBranch !== 'master';
const suffix = isSnapshotVersion ? `-${currentBranch}` : '';
const fullVersion = `${name}@${version}${suffix}`;

// If branch name is not master, i.e. there is no suffix
if (isSnapshotVersion) {
    console.log('start publishing snapshot package...');
    // Then remove dependency from registry
    run(`npm unpublish ${fullVersion}`);
    publish(`${version}${suffix}`);

    if (dist === currentDir) {
        // Remove snapshot version from package.json
        run(`git checkout package.json`);
    }

} else {
    console.log('start publishing release package...');
    // If it is production version (master), we check it exists in npm registry
    const versionInRegistry = run(`npm view ${fullVersion} version`);
    if (versionInRegistry) {
        console.log(`package '${fullVersion}' exists in registry`);
        incrementVersionAndPush();
    }

    publish();
    checkout('dev');
    merge('master');
    incrementVersionAndPush();
}

// Functions
// -----------

function run(command) {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
    return stdout;
}

function publish(version) {
    if (version) {
        setVersionToDistPackage(version);
    }

    run(`npm publish ${dist}`);
}

function incrementVersionAndPush() {
    const [major, minor, patch] = version.split('.');
    const incrementedVersion = `${major}.${minor}.${Number(patch) + 1}`;
    console.log('incremented version:', incrementedVersion);

    packageJson.version = incrementedVersion;
    const packageJsonStringified = JSON.stringify(packageJson, undefined, 4);
    fs.writeFileSync('package.json', packageJsonStringified);
    fs.writeFileSync(`${dist}/package.json`, packageJsonStringified);

    run(`git commit --all --no-verify --message "auto/ci: set version ${incrementedVersion}"`);
    run(`git push --no-verify origin ${currentBranch}`);
}

function setVersionToDistPackage(version) {
    console.log('update version in dist package.json to:', version);

    const packageJson = readJsonFile(`${dist}/package.json`);
    packageJson.version = version;

    const packageJsonStringified = JSON.stringify(packageJson, undefined, 4);
    fs.writeFileSync(`${dist}/package.json`, packageJsonStringified);

    console.log('version in dist package.json was successfully updated');
}

function checkout(branchName) {
    currentBranch = branchName;
    run(`git fetch origin --progress --prune`);
    run(`git checkout --track origin/${branchName}`);
}

function merge(branchName) {
    run(`git merge --no-ff ${branchName}`)
}

function getCurrentBranchName() {
    const branchList = run('git branch');
    const branch = branchList.split('\n')
        .find(branch => branch.startsWith('*'));
    return branch.replace('* ', '');
}

function readJsonFile(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}