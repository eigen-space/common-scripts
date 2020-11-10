#!/bin/bash

# Script checks whether commit is created automatically.
# Exit with error code if it is auto commit made by CI, otherwise with success code.

isAutoCommitExpression=`git log -1 --oneline | grep auto/ci:`
if [ -z "$isAutoCommitExpression" ]; then
    echo 'it is user commit'
    exit 0
else
    echo 'it is auto commit'
    exit 1
fi
