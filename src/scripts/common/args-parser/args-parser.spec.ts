import { ArgsParser } from './args-parser';

describe('ArgsParser', () => {

    it('should correct parse empty args', () => {
        expect(ArgsParser.get([])).toEqual(new Map([['_', null]]));
    });

    it('should correct parse empty values args', () => {
        expect(ArgsParser.get(['-name'])).toEqual(new Map([['_', null], ['name', null]]));
    });

    it('should parse args without key', () => {
        expect(ArgsParser.get(['cat', 'dog'])).toEqual(new Map([['_', ['cat', 'dog']]]));
        expect(ArgsParser.get(['cat', '-animal', 'dog'])).toEqual(new Map([['_', ['cat']], ['animal', ['dog']]]));
    });

    it('should parse keys starting with a hyphen', () => {
        expect(ArgsParser.get(['-animal', 'dog'])).toEqual(new Map([['_', null], ['animal', ['dog']]]));
        expect(ArgsParser.get(['--animal', 'dog'])).toEqual(new Map([['_', null], ['animal', ['dog']]]));
        expect(ArgsParser.get(['ani-mal', 'dog'])).toEqual(new Map([['_', ['ani-mal', 'dog']]]));
    });
});
