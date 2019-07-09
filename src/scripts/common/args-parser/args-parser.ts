/**
 * A type that returns a `get` method after attempting to process parameters.
 */
export type ArgStore = Map<string, string | string[] | boolean>;

/**
 * Utility for parsing script startup parameters.
 *
 * Types of script parameters:
 *      keylessValue - param without key.
 *      --key=value - primitive type value with key.
 *      --collectionKey[]=value1,value2 - array type value with key. Values ​​are comma separated.
 *
 * Example:
 *
 * node script.js keylessValue1 --key=value --collectionKey[]=value1,value2
 */
export class ArgsParser {
    static DEFAULT_KEY = '_';

    private static KEY_PREFIX = '-';
    private static EXPRESSION_SIGN = '=';
    private static LIST_TYPE_KEY = '[]';
    private static LIST_VALUE_SEPARATOR = ',';

    /**
     * Get parsed arguments.
     *
     * @param rawArgs Collection of raw arguments.
     * @return Args store.
     */
    get(rawArgs: string[]): ArgStore {
        const keylessValues = rawArgs.filter(arg => !arg.startsWith(ArgsParser.KEY_PREFIX));
        const valuesWithKey = rawArgs.filter(arg => arg.startsWith(ArgsParser.KEY_PREFIX));

        const booleanValues = valuesWithKey.filter(arg => !this.isExpression(arg));
        const booleanEntries = booleanValues.map(key => [this.getKeyFromRawKey(key), true]);

        const expressions = valuesWithKey.filter(arg => this.isExpression(arg));
        const expressionEntries = expressions.map(expr => expr.split(ArgsParser.EXPRESSION_SIGN))
            .map(([rawKey, rawValue]) => {
                const isListType = this.isListTypeExpression(rawKey);
                const key = this.getKeyFromRawKey(rawKey);
                const value = isListType ? rawValue.split(ArgsParser.LIST_VALUE_SEPARATOR) : rawValue;
                return [key, value];
            });

        return new Map([
            ...(keylessValues.length ? [[ArgsParser.DEFAULT_KEY, keylessValues]] : []),
            ...booleanEntries,
            ...expressionEntries
        ] as [string, boolean | string | string[]][]);
    }

    // noinspection JSMethodCanBeStatic
    private getKeyFromRawKey(rawKey: string): string {
        return rawKey.replace(/^-+/, '')
            .replace(ArgsParser.LIST_TYPE_KEY, '');
    }

    // noinspection JSMethodCanBeStatic
    private isExpression(arg: string): boolean {
        return arg.includes(ArgsParser.EXPRESSION_SIGN);
    }

    // noinspection JSMethodCanBeStatic
    private isListTypeExpression(expr: string): boolean {
        return expr.endsWith(ArgsParser.LIST_TYPE_KEY);
    }
}
