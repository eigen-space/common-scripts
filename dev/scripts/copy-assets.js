const { copy } = require('../../dist/index');

const target = 'dist';
copy(['package.json', 'yarn.lock'], target);