'use strict';

import * as path from 'path';

// This is a custom Jest transformer turning file imports into filenames.
// It is mock for files that do not matter during spec runs.
// https://jestjs.io/docs/en/webpack#handling-static-assets

export function process(_: string, filename: string): string {
    return `module.exports = ${JSON.stringify(path.basename(filename))};`;
}
