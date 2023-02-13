import { Gameboard } from '@app/classes/gameboard.class';
import { LetterTree } from '@app/classes/trie/letter-tree.class';
import { Word } from '@app/classes/word.class';
import { ValidateWordReturn } from '@app/interfaces/validate-word-return';

export class DictionaryValidation {
    dictionary: Set<string> = new Set();
    trie: LetterTree;
    gameboard: Gameboard = new Gameboard();
    jsonDictionary: string[];

    constructor(dictionary: string[]) {
        this.jsonDictionary = dictionary;
        this.jsonDictionary.forEach((word: string) => {
            this.dictionary.add(word);
        });
        this.createTrieDictionary();
    }

    validateWord(word: Word, gameboard: Gameboard): ValidateWordReturn {
        const foundWords = Word.findAdjacentWords(word, gameboard);
        this.checkWordInDictionary(foundWords);
        return this.calculateTurnPoints(foundWords, gameboard);
    }

    createTrieDictionary() {
        this.trie = new LetterTree(this.jsonDictionary);
    }

    private checkWordInDictionary(wordList: Word[]): void {
        wordList.forEach((word) => {
            if (!this.dictionary.has(word.stringFormat)) word.isValid = false;
        });
    }

    private calculateTurnPoints(foundWords: Word[], gameboard: Gameboard): ValidateWordReturn {
        const invalidWords: [boolean, Word[]] = this.isolateInvalidWords(foundWords);
        if (this.isolateInvalidWords(foundWords)[0]) return { points: 0, invalidWords: invalidWords[1] };
        else {
            let pointsForTurn = 0;
            foundWords.forEach((foundWord: Word) => {
                pointsForTurn += foundWord.calculateWordPoints(foundWords[0], gameboard);
            });
            return { points: pointsForTurn, invalidWords: invalidWords[1] };
        }
    }

    private isolateInvalidWords(foundWords: Word[]): [boolean, Word[]] {
        return [foundWords.filter((word) => !word.isValid).length !== 0, foundWords.filter((word) => !word.isValid)];
    }
}
