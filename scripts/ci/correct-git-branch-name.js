#!/usr/bin/env node

const argv = require('../common/parse-process-args')(process.argv.slice(2));
const childProcess = require('child_process');
const exec = childProcess.execSync;

const autoCalculatedBranchName = (argv.get('branch') || [])[0];

if (!Boolean(autoCalculatedBranchName)) {
    console.log('Must pass auto calculated branch name as run param with key "branch"');
    process.exit(1);
}

const lastCommit = run('git log -1 --oneline');

const mergeCommitNameMatcher = /Merge remote-tracking branch 'origin\/.+' into (.+)$/g;
if (!mergeCommitNameMatcher.test(lastCommit)) {
    returnResult(autoCalculatedBranchName);
}

returnResult(autoCalculatedBranchName);

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