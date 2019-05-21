export class ArgsParser {

    static get(rawArgs: string[]): Map<string, string[] | null> {
        const params = new Map();
        rawArgs.map((arg, index) => arg.match(/^-+.*/g) ? index : null)
            .filter(keyPosition => keyPosition !== null)
            .forEach((keyPosition, index, arr) => {
                // @ts-ignore
                const key = rawArgs[keyPosition].match(/^-+(.*)/);
                // @ts-ignore
                const value = rawArgs.slice(keyPosition + 1, arr[index + 1]);
                params.set(key[1], Boolean(value.length) ? value : null);
            });

        const startIndexArgWithKey = rawArgs.findIndex(arg => arg.startsWith('-'));
        const argsWithoutKey = startIndexArgWithKey > -1 ? rawArgs.slice(0, startIndexArgWithKey) : rawArgs.slice(0);
        params.set('_', Boolean(argsWithoutKey.length) ? argsWithoutKey : null);

        return params;
    }
}
