# Helper scripts [![Build Status](https://travis-ci.com/eigen-space/helper-scripts.svg?branch=master)](https://travis-ci.com/eigen-space/helper-scripts)

This package contains common scripts which are very helpful in developing other script utils for projects.

# Why do we have that dependencies?

* `@eigenspace/argument-parser` - argument parser command line.
* `npm-exists` - to check exists npm package.

# Why do we have that dev dependencies?

* `@eigenspace/codestyle` - includes lint rules, config for typescript.
* `husky` - used for configure git hooks.
* `@types/*` - contains type definitions for specific library.
* `@eigenspace/common-types` - contains common type definitions.
* `jest` - testing framework to write unit specs (including snapshots).
* `ts-jest` - it lets you use Jest to test projects written in TypeScript.
* `eslint` - it checks code for readability, maintainability, and functionality errors.
* `typescript` - is a superset of JavaScript that have static type-checking and ECMAScript features.
* `lint-staged` - used for configure linters against staged git files.

# CI

**Important!**

Travis creates the .npmrc file during ci startup. This file contains the access token to the npm repository.
