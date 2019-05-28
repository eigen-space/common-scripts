import { ArgsParser } from './args-parser';

describe('ArgsParser', () => {

    describe('#get', () => {

        it('should correct parse empty args', () => {
            expect(ArgsParser.get([])).toEqual(new Map([['_', null]]));
        });

        it('should correct parse empty values args', () => {
            expect(ArgsParser.get(['-name'])).toEqual(new Map([['_', null], ['name', null]]));
        });

        it('should parse args without key', () => {
            expect(ArgsParser.get(['cat', 'dog'])).toEqual(new Map([['_', ['cat', 'dog']]]));
        });

        it('should parse args without key in the presence of arguments with the key', () => {
            const expected = new Map([['_', ['cat']], ['animal', ['dog']]]);
            expect(ArgsParser.get(['cat', '-animal', 'dog'])).toEqual(expected);
        });

        it('should parse keys starting with a hyphen', () => {
            expect(ArgsParser.get(['-animal', 'dog'])).toEqual(new Map([['_', null], ['animal', ['dog']]]));
            expect(ArgsParser.get(['--animal', 'dog'])).toEqual(new Map([['_', null], ['animal', ['dog']]]));
        });

        it('should ignore a hyphen inside keys', () => {
            expect(ArgsParser.get(['ani-mal', 'dog'])).toEqual(new Map([['_', ['ani-mal', 'dog']]]));
        });
    });
});
