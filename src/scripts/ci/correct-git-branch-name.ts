#!/usr/bin/env node
/**
 * The script allows you to correct the name of the git branch,
 * incorrectly computed by jenkins.
 *
 * See issue on jenkins board: https://is.gd/vxh37N
 *
 * Parameters:
 *  --branch      (required) You must set an automatically calculated branch name.
 *
 *  @type {string}
 */

import * as childProcess from 'child_process';
import { ArgsParser } from '../..';
const exec = childProcess.execSync;

const argv = new ArgsParser().get(process.argv.slice(2));
const autoCalculatedBranchName = argv.get('branch') as string | undefined;

if (!Boolean(autoCalculatedBranchName)) {
    throwError('Must pass auto calculated branch name as run param with key "branch"');
}

const verifiedBranchName = autoCalculatedBranchName!;

const lastCommit = run('git log -1 --oneline');

// Different commit messages for different merge cases
const localBranchIntoMaster = /Merge branch '.+'$/g;
const remoteBranchIntoMaster = /Merge remote-tracking branch '.+'$/g;
const pullRequestIntoMaster = /Merge pull request .+ from .+$/g;
const remoteBranchIntoAnyBranch = /Merge remote-tracking branch 'origin\/.+' into (.+)$/g;
const localBranchIntoAnyBranch = /Merge branch '.+' into (.+)$/g;

const intoMaster = [localBranchIntoMaster, remoteBranchIntoMaster, pullRequestIntoMaster];
const intoAnyBranch = [remoteBranchIntoAnyBranch, localBranchIntoAnyBranch];

if (![...intoMaster, ...intoAnyBranch].some(regx => regx.test(lastCommit))) {
    returnResult(verifiedBranchName);
}

if (intoMaster.some(regx => regx.test(lastCommit))) {
    returnResult('origin/master');
}

const intoBranches = intoAnyBranch.map(matcher => lastCommit.match(matcher))
    .filter(match => Boolean(match))
    // @ts-ignore: Object is possibly 'null'
    .map(match => match[0]);

if (intoBranches.length !== 1) {
    throwError('Have problem with matchers!');
}

const branch = intoBranches[0];

returnResult(branch.startsWith('origin/') ? branch : `origin/${branch}`);

function run(command: string): string {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
    return stdout;
}

function returnResult(result: string): void {
    console.log(result);
    process.exit(0);
}

function throwError(error: string): void {
    console.error(error);
    process.exit(1);
}
