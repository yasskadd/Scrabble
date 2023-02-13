/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { LetterTile } from '@common/classes/letter-tile.class';
import { expect } from 'chai';

describe('LetterTile', () => {
    let letterTile: LetterTile;

    beforeEach(async () => {
        letterTile = new LetterTile({ x: 1, y: 1 });
    });

    it('should correctly set class attributes when constructor is called', () => {
        expect(letterTile.coordinate).to.eql({ x: 1, y: 1 });
        expect(letterTile.multiplier.number).to.equal(1);
        expect(letterTile.multiplier.type).to.equal('');
        expect(letterTile.isOccupied).to.equal(false);
        expect(letterTile.letter).to.eql('');
    });

    it('setLetter() should correctly set letter string', () => {
        letterTile.letter = 'a';
        expect(letterTile.letter).to.eql('a');
    });

    it('setPoints() should correctly set points if letter is an empty string', () => {
        letterTile.letter = '';
        expect(letterTile.points).to.eql(0);
    });

    it('setPoints() should correctly set points if letter is given', () => {
        letterTile.letter = 'a';
        expect(letterTile.points).to.eql(1);
    });

    it('setPoints() should correctly set points if letter is given', () => {
        letterTile.letter = 'z';
        expect(letterTile.points).to.eql(10);
    });
});
