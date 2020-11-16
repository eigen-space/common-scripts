import { Publisher } from './publisher';
import * as fs from 'fs';
import { PublishErrorType } from './enums';
import Mock = jest.Mock;

jest.mock('child_process');
jest.mock('fs');

describe('Publisher', () => {

    describe('#start', () => {
        const PACKAGE_JSON = { name: '@eigenspace/helper-scripts', version: '2.0.10' };
        (fs.readFileSync as Mock).mockReturnValue(Buffer.from(JSON.stringify(PACKAGE_JSON)));

        // After jest 24 they stricter returned type from Mock function.
        // So typescript asks for full type matching includes private fields.
        // Mock interface: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/a4a35ecdf937493d4ffed43c956c65fd7ad5ec73/types/jest/index.d.ts#L1088
        // StackOverflow same situation: https://stackoverflow.com/questions/54680300/why-is-jest-v24-mocking-class-requiring-private-methods
        const MockGitExecutor = jest.fn()
            .mockImplementation(() => ({
                branch: jest.fn(),
                checkout: jest.fn(),
                commit: jest.fn(),
                push: jest.fn()
            }));
        const MockNpmExecutor = jest.fn()
            .mockImplementation(() => ({
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

        it('should checkout branch if branch parameter passed', () => {
            publisher.start('master');
            expect(gitExec.checkout).toHaveBeenCalled();
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

        it('should throw exception if package is already in npm repository', () => {
            (npmExec.view as Mock).mockReturnValueOnce(true);
            expect(() => publisher.start('master')).toThrow(PublishErrorType.ALREADY_IN_REGISTRY);
        });

        it(`should increment version in package then publish it 
        after that increment version in project and push it with auto ci commit`, () => {
            publisher.start('master', ['/dir']);

            const incrementedPackageJson = JSON.stringify({ ...PACKAGE_JSON, version: '2.0.11' }, null, 4);
            const packageFileMatcher = expect.stringMatching(/.*dir.*package.json/);
            expect(fs.writeFileSync).toHaveBeenNthCalledWith(1, packageFileMatcher, incrementedPackageJson);
            expect(npmExec.publish).toHaveBeenCalled();

            const repositoryFileMatcher = expect.stringMatching(/.*package.json/);
            expect(fs.writeFileSync).toHaveBeenNthCalledWith(2, repositoryFileMatcher, incrementedPackageJson);
            const commitPattern = /auto\/ci:.*/;
            expect(gitExec.commit).toHaveBeenCalledWith(expect.stringMatching(commitPattern));
            expect(gitExec.push).toHaveBeenCalledWith('master');
        });
    });
});
