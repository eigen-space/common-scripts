#!/bin/bash

# Script checks whether commit is created automatically.
# Exit with error code if it is jenkins's commit, otherwise with success code.

isJenkinsCommitExpression=`git log -1 --oneline | grep auto/ci:`
if [ -z "$isJenkinsCommitExpression" ]; then
    echo 'it is user commit'
    exit 0
else
    echo 'it is auto commit'
    exit 1
fi