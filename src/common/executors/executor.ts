import * as childProcess from 'child_process';

export abstract class Executor {

    constructor(private readonly exec = childProcess.execSync) {
    }

    protected run(command: string): string {
        console.log('run command:', command);
        const stdout = this.exec(command, { encoding: 'utf8' });
        console.log(stdout);
        return stdout;
    }
}
