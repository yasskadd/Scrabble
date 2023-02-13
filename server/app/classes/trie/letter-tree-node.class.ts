export class LetterTreeNode {
    letter: string;
    isWord: boolean;
    children: Map<string, LetterTreeNode>;
    constructor(isWord: boolean) {
        this.letter = '';
        this.isWord = isWord;
        this.children = new Map();
    }
}
