import { ArgsParser, ArgStore } from './args-parser';

describe('ArgsParser', () => {
    const parser = new ArgsParser();

    function getExpectedValue(entries: [string, string | string[] | boolean][]): ArgStore {
        return new Map(entries);
    }

    describe('#get', () => {

        it('should correct parse empty args', () => {
            expect(parser.get([])).toEqual(new Map());
        });

        it('should parse empty value arg as boolean', () => {
            expect(parser.get(['--name'])).toEqual(getExpectedValue([['name', true]]));
        });

        it('should parse args without key', () => {
            expect(parser.get(['cat', 'dog'])).toEqual(getExpectedValue([['_', ['cat', 'dog']]]));
        });

        it('should parse primitive type arg with key', () => {
            const expected = getExpectedValue([['animal', 'dog']]);
            expect(parser.get(['--animal=dog'])).toEqual(expected);
        });

        it('should parse array type arg', () => {
            const expected = getExpectedValue([['animal', ['dog', 'monkey']]]);
            expect(parser.get(['--animal[]=dog,monkey'])).toEqual(expected);
        });

        it('should parse and group args without key', () => {
            const expected = getExpectedValue([['_', ['cat', 'monkey']], ['animal', 'dog']]);
            expect(parser.get(['cat', '--animal=dog', 'monkey'])).toEqual(expected);
        });

        it('should ignore a hyphen inside keys', () => {
            expect(parser.get(['ani-mal', 'dog'])).toEqual(getExpectedValue([['_', ['ani-mal', 'dog']]]));
        });
    });
});
