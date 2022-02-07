/* eslint-disable prettier/prettier */
import { expect } from 'chai';
import { Letter } from '../letter';
import { Coordinate } from './coordinate.class';
// eslint-disable-next-line @typescript-eslint/no-require-imports
// import sinon = require('sinon');

describe('Coordinate', () => {
    let coordinateClass: Coordinate;

    beforeEach(async () => {
        coordinateClass = new Coordinate(0, 0, {} as Letter);
    });

    // it('should reset letterMultiplier to 1 if resetLetterMultiplier is called', () => {
    //     coordinateClass.letterMultiplier = 5;
    //     coordinateClass.resetLetterMultiplier();
    //     expect(coordinateClass.letterMultiplier).to.equal(1);
    // });

    // it('should reset wordMultiplier if resetWordMultiplier is called', () => {
    //     coordinateClass.wordMultiplier = 5;
    //     coordinateClass.resetWordMultiplier();
    //     expect(coordinateClass.wordMultiplier).to.equal(1);
    // });

    it('should correctly set class attributes when constructor is called', () => {
        expect(coordinateClass.x && coordinateClass.y).to.equal(0);
        expect(coordinateClass.letterMultiplier && coordinateClass.wordMultiplier).to.equal(1);
        expect(coordinateClass.isOccupied).to.equal(false);
        expect(coordinateClass.letter).to.eql({} as Letter);
    });
});
