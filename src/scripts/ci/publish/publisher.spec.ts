import { Publisher } from './publisher';
import * as fs from 'fs';
import Mock = jest.Mock;
import { PublishErrorType } from './enums';

jest.mock('child_process');
jest.mock('fs');

describe('Publisher', () => {
    const executor = jest.fn();
    let publisher: Publisher;

    const PACKAGE_JSON = { name: '@eigenspace/helper-scripts', version: '2.0.10' };
    (fs.readFileSync as Mock).mockReturnValue(Buffer.from(JSON.stringify(PACKAGE_JSON)));

    beforeEach(() => {
        executor.mockClear();
        publisher = new Publisher(executor);
    });

    describe('#start', () => {

        it('should set default branch if no specified', () => {
            executor.mockImplementation(command => {
                if (command.startsWith('npm search')) {
                    return JSON.stringify([{ name: PACKAGE_JSON.name }]);
                }

                if (command === 'git branch') {
                    return '* master';
                }
            });

            publisher.start();

            expect(executor).toHaveBeenCalledWith('git branch', expect.anything());
            expect(executor).toHaveBeenCalledWith(expect.stringMatching(/git push.*master/), expect.anything());
        });

        it('should publish several directories', () => {
            executor.mockImplementation(command => {
                if (command.startsWith('npm search')) {
                    return JSON.stringify([{ name: PACKAGE_JSON.name }]);
                }
            });

            publisher.start('master', ['/dir1', '/dir2']);

            expect(executor).toHaveBeenCalledWith(expect.stringMatching(/npm publish.*dir1.*/), expect.anything());
            expect(executor).toHaveBeenCalledWith(expect.stringMatching(/npm publish.*dir2.*/), expect.anything());
            expect(executor).toHaveBeenCalledWith(expect.stringMatching(/git push.*master/), expect.anything());
        });

        it('should not publish not master packages', () => {
            publisher.start('dev');
            expect(executor).not.toHaveBeenCalledWith(expect.stringMatching(/npm publish.*/), expect.anything());
        });

        it('should throw exception if package is already in npm repository', () => {
            executor.mockImplementation(command => {
                if (command.startsWith('npm search')) {
                    return JSON.stringify([{ name: PACKAGE_JSON.name }]);
                }

                if (command.startsWith('npm view')) {
                    return true;
                }
            });

            try {
                publisher.start('master');
            } catch (e) {
                expect(e.message).toEqual(PublishErrorType.ALREADY_IN_REGISTRY);
            }
        });

        it('should publish package and update version in package json and push with auto ci commit', () => {
            executor.mockImplementation(command => {
                if (command.startsWith('npm search')) {
                    return JSON.stringify([{ name: PACKAGE_JSON.name }]);
                }
            });

            publisher.start('master');

            expect(executor).toHaveBeenCalledWith(expect.stringMatching(/npm publish .*/), expect.anything());

            const incrementedPackageJson = JSON.stringify({ ...PACKAGE_JSON, version: '2.0.11' }, null, 4);
            expect(fs.writeFileSync).toBeCalledWith(expect.anything(), incrementedPackageJson);

            const commitPattern = /git commit .*auto\/ci:.*/;
            expect(executor).toHaveBeenCalledWith(expect.stringMatching(commitPattern), expect.anything());
            expect(executor).toHaveBeenCalledWith(expect.stringMatching(/git push.*master/), expect.anything());
        });
    });
});
