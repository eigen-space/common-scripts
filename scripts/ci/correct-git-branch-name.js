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

// Different commit messages for different merge cases
const matcher1 = /Merge branch '.+'$/g;
const matcher2 = /Merge remote-tracking branch '.+'$/g;
const matcher3 = /Merge pull request .+ from .+$/g;
const matcher4 = /Merge remote-tracking branch 'origin\/.+' into (.+)$/g;
const matcher5 = /Merge branch '.+' into (.+)$/g;

if (!matcher1.test(lastCommit)
    && !matcher2.test(lastCommit)
    && !matcher3.test(lastCommit)
    && !matcher4.test(lastCommit)
    && !matcher5.test(lastCommit)) {
    returnResult(autoCalculatedBranchName);
}

if (matcher1.test(lastCommit) || matcher2.test(lastCommit) || matcher3.test(lastCommit)) {
    returnResult('origin/master');
}

const intoBranches = [matcher4, matcher5].map(matcher => lastCommit.match(matcher))
    .filter(match => Boolean(match))
    .map(match => match[0]);

if (intoBranches.length !== 1) {
    console.log('Have problem with matchers!');
    process.exit(1);
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