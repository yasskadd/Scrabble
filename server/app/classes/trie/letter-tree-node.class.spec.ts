import { expect } from 'chai';
import { LetterTreeNode } from './letter-tree-node.class';

describe('Letter tree node tests', () => {
    it('should set node attributes when constructor is called', () => {
        const newNode = new LetterTreeNode(true);
        expect(newNode.isWord).to.be.equal(true);
        expect(newNode.letter).to.be.eql('');
        expect(newNode.children).to.be.a('map');
    });
});
