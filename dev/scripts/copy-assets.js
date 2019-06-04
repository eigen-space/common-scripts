const { copy } = require('../../dist/index');

const target = 'dist';
copy(['package.json', 'yarn.lock'], target);

copy(['src/scripts/ci/detect-autocommit.sh'], `${target}/scripts/ci`);