function parseProcessArgs(rawArgs) {
    const params = new Map();
    rawArgs.map((arg, index) => arg.match(/^-+.*/g) ? index : null)
        .filter(keyPosition => keyPosition !== null)
        .forEach((keyPosition, index, arr) => {
            const key = rawArgs[keyPosition].match(/^-+(.*)/);
            params.set(key[1], rawArgs.slice(keyPosition + 1, arr[index + 1]));
        });

    const startIndexArgWithKey = rawArgs.findIndex(arg => arg.startsWith('-'));
    const argsWithoutKey = startIndexArgWithKey > -1 ? rawArgs.slice(0, startIndexArgWithKey) : rawArgs.slice(0);
    params.set('_', argsWithoutKey);

    return params;
}

module.exports = parseProcessArgs;