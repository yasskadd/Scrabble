/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Gameboard } from '@app/classes/gameboard.class';
import { LetterTree } from '@app/classes/trie/letter-tree.class';
import { Word } from '@app/classes/word.class';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { DictionaryValidation } from './dictionary-validation.class';

const jsonDictionary = ['bonjour', 'chevalier'];

describe('Dictionary Validation', () => {
    let dictionaryValidation: DictionaryValidation;
    let gameboard: Gameboard;

    let validWord1: Word;
    let validWord2: Word;
    let invalidWord1: Word;
    let invalidWord2: Word;

    before(() => {
        dictionaryValidation = new DictionaryValidation(jsonDictionary);
    });
    beforeEach(() => {
        gameboard = new Gameboard();

        validWord1 = new Word({ isHorizontal: true, firstCoordinate: { x: 1, y: 1 }, letters: ['b', 'o', 'n', 'j', 'o', 'u', 'r'] }, gameboard);
        validWord2 = new Word(
            { isHorizontal: true, firstCoordinate: { x: 1, y: 3 }, letters: ['c', 'h', 'e', 'v', 'a', 'l', 'i', 'e', 'r'] },
            gameboard,
        );

        invalidWord1 = new Word(
            { isHorizontal: true, firstCoordinate: { x: 1, y: 5 }, letters: ['d', 'i', 'j', 'a', 's', 'd', 'i', 'j', 'a', 's', 'd'] },
            gameboard,
        );
        invalidWord2 = new Word({ isHorizontal: true, firstCoordinate: { x: 1, y: 7 }, letters: ['h', 'h', 'h', 'h', 'h'] }, gameboard);
    });

    it('constructor() should add dictionary words to Set object and Set length should equal json words list', () => {
        expect(dictionaryValidation.dictionary).to.not.eql(null);
        expect(dictionaryValidation.dictionary).to.have.lengthOf(jsonDictionary.length);
    });

    it('checkWordInDictionary() should set word isValid attribute to false if they dont exist', () => {
        const validWords: Word[] = [invalidWord1, invalidWord2];
        dictionaryValidation['checkWordInDictionary'](validWords);
        expect(invalidWord1.isValid && invalidWord2.isValid).to.eql(false);
    });

    it('isolateInvalidWords() should return true if words are not in dictionary', () => {
        const wordList: Word[] = [validWord1, validWord2, invalidWord2, invalidWord1];
        dictionaryValidation['checkWordInDictionary'](wordList);
        expect(dictionaryValidation['isolateInvalidWords'](wordList)[0]).to.eql(true);
    });

    it('isolateInvalidWords() should return array of length 2 if 2 words are not in dictionary', () => {
        const wordList: Word[] = [validWord1, validWord2, invalidWord2, invalidWord1];
        dictionaryValidation['checkWordInDictionary'](wordList);
        expect(dictionaryValidation['isolateInvalidWords'](wordList)[1].length).to.be.equal(2);
    });

    it('isolateInvalidWords should return false if words are in dictionary', () => {
        const wordList: Word[] = [validWord1, validWord2];
        dictionaryValidation['checkWordInDictionary'](wordList);
        expect(dictionaryValidation['isolateInvalidWords'](wordList)[0]).to.eql(false);
    });

    it('isolateInvalidWords should return array of 0 if words are in dictionary', () => {
        const wordList: Word[] = [validWord1, validWord2];
        dictionaryValidation['checkWordInDictionary'](wordList);
        expect(dictionaryValidation['isolateInvalidWords'](wordList)[1].length).to.be.equal(0);
    });

    it('should call calculateTurnPoints() and checkWordInDictionary() when validateWord() is called', () => {
        const spyCalculateTurnPoints = Sinon.spy(dictionaryValidation, 'calculateTurnPoints' as keyof DictionaryValidation);
        const spyCheckWordInDictionary = Sinon.spy(dictionaryValidation, 'checkWordInDictionary' as keyof DictionaryValidation);
        dictionaryValidation.validateWord(validWord1, gameboard);
        expect(spyCalculateTurnPoints.called && spyCheckWordInDictionary.called).to.eql(true);
    });

    it('should call isolateInvalidWords() when calculateTurnPoints() is called', () => {
        const spyIsolateInvalidWords = Sinon.spy(dictionaryValidation, 'isolateInvalidWords' as keyof DictionaryValidation);
        dictionaryValidation['calculateTurnPoints']([validWord1], gameboard);
        expect(spyIsolateInvalidWords.called).to.eql(true);
    });

    it('should call calculateWordPoints() when calculateTurnPoints() is called for each word in the list if there is no invalid words', () => {
        const spyCalculate1 = Sinon.spy(validWord1, 'calculateWordPoints');
        dictionaryValidation['calculateTurnPoints']([validWord1], gameboard);
        expect(spyCalculate1.called).to.eql(true);
    });

    it('should not call calculatePoints() when validateWord() is called if there is at least one invalid word', () => {
        const spyCalculate1 = Sinon.spy(invalidWord2, 'calculateWordPoints');
        dictionaryValidation.validateWord(invalidWord2, gameboard);
        expect(spyCalculate1.called).to.eql(false);
    });

    it('should return 0 points when validateWord() is called and wordList is invalid', () => {
        expect(dictionaryValidation.validateWord(invalidWord1, gameboard).points).to.equal(0);
    });

    it('should return array with invalidWord when validateWord() is called and wordList is invalid', () => {
        expect(dictionaryValidation.validateWord(invalidWord1, gameboard).invalidWords[0]).to.eql(invalidWord1);
    });

    context('Trie Dictionary tests', () => {
        let trie: LetterTree;
        before(() => {
            dictionaryValidation = new DictionaryValidation(['conforme', 'matrice']);
            dictionaryValidation['createTrieDictionary']();
            trie = dictionaryValidation.trie;
        });

        it('should initialize trie', () => {
            expect(trie).to.not.equal(null);
        });

        it('trie should contain existing word from French dictionary', () => {
            expect(trie.isWord('conforme')).to.equal(true);
            expect(trie.isWord('matrice')).to.equal(true);
        });

        it('trie should not contain non-existing word from the French dictionary', () => {
            expect(trie.isWord('dijasdij')).to.equal(false);
            expect(trie.isWord('ocas')).to.equal(false);
        });

        it('should insert word into trie', () => {
            trie.insertWord('dijasdij');
            expect(trie.isWord('dijasdij')).to.equal(true);
        });
    });
});
