/* eslint-disable @typescript-eslint/no-magic-numbers */
import { expect } from 'chai';
import * as fs from 'fs';
import { LetterTree } from './letter-tree.class';
const jsonDictionary = JSON.parse(fs.readFileSync('./assets/dictionary.json', 'utf8'));

describe('Letter Trie tests', () => {
    let trie: LetterTree;
    before(() => {
        trie = new LetterTree(jsonDictionary.words);
    });

    it('constructor should insert words from french dictionary into trie', () => {
        expect(trie.root.children.size).to.be.equal(26);
    });

    it('lookUp() should return node if string passed as a parameter is not a real word but a sub-string', () => {
        const subWord = 'avio';
        expect(trie.lookUp(subWord)).to.not.be.eql(null);
    });

    it('insertWords() should insert all words from list into trie', () => {
        const wordList: string[] = ['djaiosd', 'dokasd', 'jsdga'];
        trie.insertWords(wordList);
        for (const word of wordList) {
            expect(trie.isWord(word)).to.be.equal(true);
        }
    });
});
