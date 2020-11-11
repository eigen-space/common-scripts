# Helper scripts [![Build Status](https://travis-ci.com/eigen-space/helper-scripts.svg?branch=master)](https://travis-ci.com/eigen-space/helper-scripts)

This package contains common scripts which are very helpful in developing other script utils for projects.

[Versionong](src/scripts/ci/publish/README.md)

# Why do we have that dependencies?

* `@eigenspace/argument-parser` - argument parser command line.

# Why do we have that dev dependencies?

* `@eigenspace/codestyle` - includes lint rules, config for typescript.
* `@eigenspace/commit-linter` - linter for commit messages.
* `husky` - used for configure git hooks.
* `@types/*` - contains type definitions for specific library.
* `@eigenspace/common-types` - contains common type definitions.
* `jest` - testing framework to write unit specs (including snapshots).
* `ts-jest` - it lets you use Jest to test projects written in TypeScript.
* `eslint` - it checks code for readability, maintainability, and functionality errors.
* `eslint-plugin-eigenspace-script` - includes set of script linting rules and configuration for them.
* `typescript` - is a superset of JavaScript that have static type-checking and ECMAScript features.
* `lint-staged` - used for configure linters against staged git files.

# CI

**Important!**

Travis creates the .npmrc file during ci startup. This file contains the access token to the npm repository.

**Important!**

Snapshot versions of packages are stored at https://artifacts.arrival.services/
 Therefore, in order to use them, you need to add registry information to .yarnrc:
 
 ```markdown
    registry "https://artifacts.arrival.services/"
 ```
 
Master versions of the packages are stored in the npm registry
