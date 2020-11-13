import { Executor } from './executor';

export class GitExecutor extends Executor {

    branch(): string {
        return this.run('git branch');
    }

    checkout(branch: string): string {
        return this.run(`git checkout ${branch}`);
    }

    commit(message: string): string {
        return this.run(`git commit --all --no-verify --message "${message}"`);
    }

    push(branch: string): string {
        return this.run(`git push --no-verify origin ${branch}`);
    }
}
