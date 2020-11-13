import * as path from 'path';
import * as fs from 'fs';
import { PublishErrorType } from './enums';
import { GitExecutor } from '../../../common/executors/git.executor';
import { NpmExecutor } from '../../../common/executors/npm.executor';

interface PackageJson {
    name: string;
    version: string;
}

export class Publisher {

    constructor(private readonly gitExec = new GitExecutor(), private readonly npmExec = new NpmExecutor()) {
    }

    /**
     * Automates versioning/publishing process of master packages.
     * Automatically increment master version in package.json after publishing package.
     *
     * Environmental requirements.
     * It is necessary that at the time of launching the script in the root of the project there was a .npmrc file
     * containing an access token at the time of launching the script.
     * Also be sure you set an auto-commit check on CI to prevent an endless loop of commits and CI.
     *
     * @param {string} [branch=(git branch)] Branch we should work with.
     * @param {string[]} [projectPaths=['/']] projectPaths Project dirs you want to publish.
     *      If there is no ./dist directory the whole directory will be published.
     * @throws Throws error if the package is already in repository.
     */
    start(branch?: string, projectPaths = ['/']): void {
        if (branch) {
            this.gitExec.checkout(branch);
        }

        const currentBranch = branch || this.getCurrentBranchName();

        // We assume that we publish only packages from the master branch
        if (currentBranch !== 'master') {
            console.log('Current branch is not master');
            console.log('Skipping package publishing');
            return;
        }

        console.log('branch:', currentBranch);

        projectPaths.forEach(projectPath => {
            const currentDir = `${process.cwd()}${projectPath}`;
            const packageJsonPath = path.join(currentDir, 'package.json');
            const packageJson = this.readPackageJson(packageJsonPath);

            this.publishPackage(currentDir, packageJson);
            this.incrementVersionAndCommit(packageJsonPath, packageJson);
        });

        this.gitExec.push(currentBranch);
    }

    private publishPackage(currentDir: string, packageJson: PackageJson): void {
        const { name, version } = packageJson;

        const dist = this.getDistDirectory(currentDir);
        console.log('package to publish:', dist);

        const fullVersion = `${name}@${version}`;

        console.log('start publishing package...');

        const projectExists = this.checkForProjectExistence(name);
        // We check it exists in npm registry in case we try to push already published version
        const versionInRegistry = projectExists && this.npmExec.view(fullVersion);
        if (versionInRegistry) {
            throw new Error(PublishErrorType.ALREADY_IN_REGISTRY);
        }

        this.npmExec.publish(dist);
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

        this.gitExec.commit(`auto/ci: set version of ${name} to ${incrementedVersion}`);
    }

    private getCurrentBranchName(): string {
        const branchList: string = this.gitExec.branch();
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

    private checkForProjectExistence(packageName: string): boolean {
        const result = JSON.parse(this.npmExec.search(packageName));
        return result.some((project: { name: string }) => project.name === packageName);
    }
}
