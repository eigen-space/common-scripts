/**
 * Utility for parsing script startup parameters.
 *
 * Types of script startup parameters:
 *
 * keylessValue - param without key.
 * --key=value - primitive type value with key.
 * --collectionKey[]=value1,value2 - array type value with key. Values ​​are comma separated.
 *
 * Example:
 *
 * node script.js keylessValue1 --key=value --collectionKey[]=value1,value2
 */

/**
 * A type that returns a `get` method after attempting to process parameters.
 */
export type ArgStoreType = Map<string, string | string[] | boolean>;

export class ArgsParser {
    static DEFAULT_KEY = '_';

    private static KEY_PREFIX = '-';
    private static EXPRESSION_SIGN = '=';
    private static LIST_TYPE_KEY = '[]';
    private static LIST_VALUE_SEPARATOR = ',';

    /**
     * Get parsed arguments.
     *
     * @param {string[]} rawArgs - collection of raw arguments.
     * @return {Map<string, string | string[] | boolean>} - args store.
     */
    get(rawArgs: string[]): ArgStoreType {

        const keylessValues = rawArgs.filter(arg => !arg.startsWith(ArgsParser.KEY_PREFIX));
        const valuesWithKey = rawArgs.filter(arg => arg.startsWith(ArgsParser.KEY_PREFIX));

        const booleanValues = valuesWithKey.filter(arg => !this.isExpression(arg));
        const booleanEntries = booleanValues.map(key => [this.getKeyFromRawKey(key), true]);

        const expressions = valuesWithKey.filter(arg => this.isExpression(arg));
        const exprEntries = expressions.map(expr => expr.split(ArgsParser.EXPRESSION_SIGN))
            .map(entry => {
                const [rawKey, rawValue] = entry;
                const isListType = this.isListTypeExpression(rawKey);
                const key = this.getKeyFromRawKey(entry[0]);
                const value = isListType ? rawValue.split(ArgsParser.LIST_VALUE_SEPARATOR) : rawValue;
                return [key, value];
            });

        return new Map([
            [ArgsParser.DEFAULT_KEY, keylessValues],
            ...booleanEntries as [string, boolean][],
            ...exprEntries as [string, string[] | string][]
        ] as [string, boolean | string | string[]][]);
    }

    // noinspection JSMethodCanBeStatic
    private getKeyFromRawKey(rawKey: string): string {
        const isListType = this.isListTypeExpression(rawKey);
        const lastTwoSymbols = 2;
        const key = isListType ? rawKey.slice(0, -lastTwoSymbols) : rawKey;
        return key.match(/^-+(.*)/)![1] as string;
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
