import { LetterTreeNode } from '@app/classes/trie/letter-tree-node.class';

export class LetterTree {
    root: LetterTreeNode;

    constructor(words: string[]) {
        this.root = new LetterTreeNode(false);
        this.insertWords(words);
    }

    insertWord(word: string) {
        let currentNode = this.root;
        const letterArray = word.split('');
        for (const letter of letterArray) {
            if (!currentNode.children.has(letter)) currentNode.children.set(letter, new LetterTreeNode(false));
            currentNode = currentNode.children.get(letter) as LetterTreeNode;
        }
        currentNode.isWord = true;
    }

    insertWords(words: string[]) {
        for (const word of words) {
            this.insertWord(word);
        }
    }

    lookUp(word: string) {
        let currentNode = this.root;
        const letterArray = word.split('');
        for (const letter of letterArray) {
            if (!currentNode.children.has(letter)) return null;
            currentNode = currentNode.children.get(letter) as LetterTreeNode;
        }
        return currentNode;
    }

    isWord(word: string) {
        const wordNode = this.lookUp(word);
        if (wordNode === null) return false;
        return wordNode.isWord;
    }
}
