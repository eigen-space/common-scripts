const fs = require('fs');

const target = 'dist';
['package.json', 'yarn.lock'].forEach(file => fs.copyFileSync(file, `${target}/${file}`));