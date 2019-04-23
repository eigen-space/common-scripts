#!/usr/bin/env node
/**
 * The script allows you to correct the name of the git branch, incorrectly computed jenkins.
 *
 * Parameters:
 *  --branch      (required) You must set an automatically calculated branch name.
 *
 *  @type {string}
 */

const argv = require('../common/parse-process-args')(process.argv.slice(2));
const childProcess = require('child_process');
const exec = childProcess.execSync;

const autoCalculatedBranchName = (argv.get('branch') || [])[0];

if (!Boolean(autoCalculatedBranchName)) {
    throwError('Must pass auto calculated branch name as run param with key "branch"');
}

const lastCommit = run('git log -1 --oneline');

// Different commit messages for different merge cases
const localBranchIntoMaster = /Merge branch '.+'$/g;
const remoteBranchIntoMaster = /Merge remote-tracking branch '.+'$/g;
const pullRequestToMaster = /Merge pull request .+ from .+$/g;
const remoteBranchIntoAnyBranch = /Merge remote-tracking branch 'origin\/.+' into (.+)$/g;
const localBranchIntoAnyBranch = /Merge branch '.+' into (.+)$/g;

if (!localBranchIntoMaster.test(lastCommit)
    && !remoteBranchIntoMaster.test(lastCommit)
    && !pullRequestToMaster.test(lastCommit)
    && !remoteBranchIntoAnyBranch.test(lastCommit)
    && !localBranchIntoAnyBranch.test(lastCommit)) {
    returnResult(autoCalculatedBranchName);
}

if (localBranchIntoMaster.test(lastCommit)
    || remoteBranchIntoMaster.test(lastCommit)
    || pullRequestToMaster.test(lastCommit)) {
    returnResult('origin/master');
}

const intoBranches = [remoteBranchIntoAnyBranch, localBranchIntoAnyBranch]
    .map(matcher => lastCommit.match(matcher))
    .filter(match => Boolean(match))
    .map(match => match[0]);

if (intoBranches.length !== 1) {
    throwError('Have problem with matchers!');
}

const branch = intoBranches[0];

returnResult(branch.startsWith('origin/') ? branch : `origin/${branch}`);

function run(command) {
    console.log('run command:', command);
    const stdout = exec(command, { encoding: 'utf8' });
    console.log(stdout);
    return stdout;
}

function returnResult(result) {
    console.log(result);
    process.exit(0);
}

function throwError(error) {
    console.error(error);
    process.exit(1);
}