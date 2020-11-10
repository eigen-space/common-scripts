/* eslint-disable no-console */
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

interface PackageJson {
    name: string;
    version: string;
}

export class Publisher {

    constructor(private readonly exec = childProcess.execSync) {
    }

    /**
     * Automates versioning/publishing process of master packages.
     * Automatically increment master version in package.json after publishing package.
     *
     * Environmental requirements.
     * It is necessary that at the time of launching the script in the root of the project there was a .npmrc file
     * containing an access token at the time of launching the script.
     * Also be sure you set an auto-commit check on CI to prevent an endless loop of commits and CI.
     * @see {@link https://www.notion.so/arrivalms/Versioning-5bf1876eb2f142339d719f818cc2250c}
     *
     * @param {string} [branch=(git branch)] Closest activity that called the logger.
     * @param {string[]} [projectPaths=['/']] projectPaths Project dirs you want to publish.
     *      If there is no ./dist directory the whole directory will be published.
     * @throws Throws error in case branch is not the master or package already in repository
     */
    start(branch?: string, projectPaths = ['/']): void {
        const currentBranch = branch || this.getCurrentBranchName();

        // We assume that we publish only packages from the master branch
        if (currentBranch !== 'master') {
            throw new Error('Current branch is not master');
        }

        console.log('branch:', currentBranch);

        projectPaths.forEach(projectPath => {
            const currentDir = `${process.cwd()}${projectPath}`;
            const packageJsonPath = path.join(currentDir, 'package.json');
            const packageJson = this.readPackageJson(packageJsonPath);

            this.publishPackage(currentDir, packageJson);
            this.incrementVersionAndCommit(packageJsonPath, packageJson);
        });

        this.push(currentBranch);
    }

    private publishPackage(currentDir: string, packageJson: PackageJson): void {
        const { name, version } = packageJson;

        const dist = this.getDistDirectory(currentDir);
        console.log('package to publish:', dist);

        const fullVersion = `${name}@${version}`;

        console.log('start publishing package...');

        const projectExists = this.checkForProjectExistence(name);
        // We check it exists in npm registry in case we try to push already published version
        const versionInRegistry = projectExists && this.run(`npm view ${fullVersion} version`);
        if (versionInRegistry) {
            throw new Error(`package '${fullVersion}' exists in registry`);
        }

        this.publish(dist);
    }

    private run(command: string): string {
        console.log('run command:', command);
        const stdout = this.exec(command, { encoding: 'utf8' });
        console.log(stdout);
        return stdout;
    }

    private publish(dist: string): void {
        // We use public access to be able publish public packages at first time to npm registry.
        // Private packages are on private hosting so it does not affect them.
        this.run(`npm publish ${dist} --access public`);
    }

    private incrementVersionAndCommit(packageJsonPath: string, packageJson: PackageJson): void {
        const { name, version } = packageJson;

        const [major, minor, patch] = version.split('.');
        const incrementedVersion = `${major}.${minor}.${Number(patch) + 1}`;
        console.log('incremented version:', incrementedVersion);

        const incrementedPackageJson = { ...packageJson, version: incrementedVersion };
        const indent = 4;
        const packageJsonStringified = JSON.stringify(incrementedPackageJson, null, indent);
        fs.writeFileSync(packageJsonPath, packageJsonStringified);

        this.run(`git commit --all --no-verify --message "auto/ci: set version of ${name} to ${incrementedVersion}"`);
    }

    private push(branch: string): void {
        this.run(`git push --no-verify origin ${branch}`);
    }

    private getCurrentBranchName(): string {
        const branchList: string = this.run('git branch');
        const branch = branchList.split('\n')
            .find(branchName => branchName.startsWith('*'));

        return (branch || '').replace('* ', '');
    }

    // noinspection JSMethodCanBeStatic
    private readPackageJson(packageJsonPath: string): PackageJson {
        const rawData = fs.readFileSync(packageJsonPath).toString();
        return JSON.parse(rawData);
    }

    // noinspection JSMethodCanBeStatic
    private getDistDirectory(currentDir: string): string {
        const distDir = path.join(currentDir, 'dist');
        return fs.existsSync(distDir) && distDir || currentDir;
    }

    private checkForProjectExistence(name: string): boolean {
        const search = JSON.parse(this.run(`npm search ${name} --json`));
        return search.some((project: { name: string }) => project.name === name);
    }
}
