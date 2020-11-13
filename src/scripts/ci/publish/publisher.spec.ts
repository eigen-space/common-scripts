import { Publisher } from './publisher';
import * as fs from 'fs';
import { PublishErrorType } from './enums';
import { GitExecutor } from '../../../common/executors/git.executor';
import { NpmExecutor } from '../../../common/executors/npm.executor';
import Mock = jest.Mock;

jest.mock('child_process');
jest.mock('fs');

describe('Publisher', () => {

    describe('#start', () => {
        const PACKAGE_JSON = { name: '@eigenspace/helper-scripts', version: '2.0.10' };
        (fs.readFileSync as Mock).mockReturnValue(Buffer.from(JSON.stringify(PACKAGE_JSON)));

        const MockGitExecutor = jest.fn<GitExecutor>(() => ({
            branch: jest.fn(),
            checkout: jest.fn(),
            commit: jest.fn(),
            push: jest.fn()
        }));
        const MockNpmExecutor = jest.fn<NpmExecutor>(() => ({
            publish: jest.fn(),
            view: jest.fn(),
            search: jest.fn().mockReturnValue(JSON.stringify([{ name: PACKAGE_JSON.name }]))
        }));
        const gitExec = new MockGitExecutor();
        const npmExec = new MockNpmExecutor();
        const publisher = new Publisher(gitExec, npmExec);

        it('should set default branch if no specified', () => {
            (gitExec.branch as Mock).mockReturnValueOnce('* master');

            publisher.start();

            expect(gitExec.branch).toHaveBeenCalled();
            expect(gitExec.push).toHaveBeenCalledWith('master');
        });

        it('should publish several directories', () => {
            publisher.start('master', ['/dir1', '/dir2']);

            expect(npmExec.publish).toHaveBeenCalledWith(expect.stringMatching(/.*dir1/));
            expect(npmExec.publish).toHaveBeenCalledWith(expect.stringMatching(/.*dir2/));
            expect(gitExec.push).toHaveBeenCalledWith('master');
        });

        it('should not publish not master packages', () => {
            publisher.start('dev');
            expect(npmExec.publish).not.toHaveBeenCalled();
        });

        it('should checkout branch if branch parameter passed', () => {
            publisher.start('master');
            expect(gitExec.checkout).toHaveBeenCalled();
        });

        it('should throw exception if package is already in npm repository', () => {
            (npmExec.view as Mock).mockReturnValueOnce(true);
            expect(() => publisher.start('master')).toThrow(PublishErrorType.ALREADY_IN_REGISTRY);
        });

        it('should publish package and update version in package json and push with auto ci commit', () => {
            publisher.start('master');

            expect(npmExec.publish).toHaveBeenCalled();
            const incrementedPackageJson = JSON.stringify({ ...PACKAGE_JSON, version: '2.0.11' }, null, 4);
            expect(fs.writeFileSync).toBeCalledWith(expect.anything(), incrementedPackageJson);

            const commitPattern = /auto\/ci:.*/;
            expect(gitExec.commit).toHaveBeenCalledWith(expect.stringMatching(commitPattern));
            expect(gitExec.push).toHaveBeenCalledWith('master');
        });
    });
});
