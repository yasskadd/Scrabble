/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { LetterTile } from '@common/classes/letter-tile.class';
import { Coordinate } from '@common/interfaces/coordinate';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { Gameboard } from './gameboard.class';

describe('gameboard', () => {
    let gameboard: Gameboard;

    beforeEach(() => {
        gameboard = new Gameboard();
    });

    it('game array length should be 225', () => {
        expect(gameboard.gameboardTiles.length).to.equal(225);
    });

    it('constructor should create the array with each element being a GameboardCoordinate', () => {
        const checkArrayType = (coordList: LetterTile[]) => {
            let bool = true;
            coordList.forEach((coord: LetterTile) => {
                if (typeof coord !== 'object' && coord !== null) {
                    bool = false;
                }
            });
            return bool;
        };
        expect(checkArrayType(gameboard.gameboardTiles)).to.equal(true);
    });

    it('constructor should call createLetterTiles and applyBoxMultipliers', () => {
        const spyCreateLetterTiles = Sinon.spy(Gameboard.prototype, 'createLetterTiles');
        const spyApplyBoxMultipliers = Sinon.spy(Gameboard.prototype, 'applyBoxMultipliers');
        new Gameboard();
        expect(spyCreateLetterTiles.called).to.equal(true);
        expect(spyApplyBoxMultipliers.called).to.equal(true);
    });

    it('should place letter on board when placeLetter() is called', () => {
        const gameboardTestCoord = gameboard.gameboardTiles[0];
        gameboard.placeLetter({ x: 1, y: 1 }, 'a');

        expect(gameboardTestCoord.letter).to.eql('a');
        expect(gameboardTestCoord.points).to.eql(1);
        expect(gameboardTestCoord.isOccupied).to.equal(true);
    });

    it('should set isOccupied attribute to false if removeLetter is called', () => {
        gameboard.gameboardTiles[0].letter = 'f';
        gameboard.removeLetter({ x: 1, y: 1 });

        expect(gameboard.gameboardTiles[0].isOccupied).to.equal(false);
        expect(gameboard.gameboardTiles[0].letter).to.eql('');
    });

    it('should not change isOccupied attribute if removeLetter is called on a coord that is not occupied', () => {
        gameboard.removeLetter({ x: 5, y: 5 });
        expect(gameboard.getLetterTile({ x: 5, y: 5 }).isOccupied).to.equal(false);
    });

    it('should return correct LetterTile when getLetterTile is called', () => {
        gameboard.placeLetter({ x: 2, y: 2 }, 'c');
        expect(gameboard.getLetterTile({ x: 2, y: 2 }).letter).to.eql('c');
        expect(gameboard.getLetterTile({ x: 2, y: 2 }).coordinate).to.eql({ x: 2, y: 2 });
    });

    it('should return false when if coordinates are less than 1', () => {
        gameboard.placeLetter({ x: -1, y: -1 }, '');
        expect(gameboard.getLetterTile({ x: -1, y: -1 })).to.eql({} as LetterTile);
    });

    it('should return false when if coordinates are greater than 15', () => {
        gameboard.placeLetter({ x: 16, y: 16 }, '');
        expect(gameboard.getLetterTile({ x: 16, y: 16 })).to.eql({} as LetterTile);
    });

    it('should modify letterMultiplier to two for coordinate (4,1)', () => {
        expect(gameboard.getLetterTile({ x: 4, y: 1 }).multiplier.number).to.equal(2);
        expect(gameboard.getLetterTile({ x: 4, y: 1 }).multiplier.type).to.equal('LETTRE');
    });

    it('should modify letterMultiplier to three for coordinate (6,2)', () => {
        expect(gameboard.getLetterTile({ x: 6, y: 2 }).multiplier.number).to.equal(3);
        expect(gameboard.getLetterTile({ x: 6, y: 2 }).multiplier.type).to.equal('LETTRE');
    });

    it('should modify wordMultiplier to two for coordinate (2,2)', () => {
        expect(gameboard.getLetterTile({ x: 2, y: 2 }).multiplier.number).to.equal(2);
        expect(gameboard.getLetterTile({ x: 2, y: 2 }).multiplier.type).to.equal('MOT');
    });

    it('should modify wordMultiplier to three for coordinate (6,2)', () => {
        expect(gameboard.getLetterTile({ x: 1, y: 1 }).multiplier.number).to.equal(3);
        expect(gameboard.getLetterTile({ x: 1, y: 1 }).multiplier.type).to.equal('MOT');
    });

    it('should modify wordMultiplier to two for middle coordinate (8,8)', () => {
        expect(gameboard.getLetterTile({ x: 8, y: 8 }).multiplier.number).to.equal(2);
        expect(gameboard.getLetterTile({ x: 8, y: 8 }).multiplier.type).to.equal('MOT');
    });

    context('findAnchors() tests', () => {
        beforeEach(() => {
            gameboard.placeLetter({ x: 7, y: 7 }, '');
        });

        it('findAnchors() should return correct anchors tiles', () => {
            const foundTiles: Coordinate[] = gameboard.findAnchors();
            expect(foundTiles.length).to.be.greaterThan(0);
        });
    });
});
