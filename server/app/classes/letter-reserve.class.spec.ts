import { LetterReserve } from '@app/classes/letter-reserve.class';
import * as letterTypes from '@app/constants/letter-reserve';
import { Letter } from '@common/interfaces/letter';
import { expect } from 'chai';
import { spy, stub } from 'sinon';

describe('LetterReserve', () => {
    let letterReserve: LetterReserve;
    let sampleRack: Letter[];
    let emptyRack: Letter[];

    beforeEach(() => {
        letterReserve = new LetterReserve();
        emptyRack = [];
        sampleRack = [
            { value: 'a', quantity: 8, points: 1 },
            { value: 'b', quantity: 0, points: 3 },
            { value: 'b', quantity: 0, points: 3 },
            { value: 'c', quantity: 1, points: 3 },
            { value: 'd', quantity: 2, points: 2 },
        ];
    });

    it('should generate default letter reserve', () => {
        const defaultLetterReserve = letterReserve.getDefaultLetterReserve();
        expect(defaultLetterReserve).to.eql(letterTypes.LETTERS);
    });

    it('should subtract letter quantity by 1', () => {
        const expectedQuantity = letterReserve.lettersReserve[0].quantity - 1;
        const letterToRemove: Letter = { value: 'a', quantity: 9, points: 3 };
        letterReserve.removeLetter(letterToRemove);
        expect(letterReserve.lettersReserve[0].quantity).to.equal(expectedQuantity);
    });
    it('should increment letter quantity by 1 when a letter is inserted to the letter reserve', () => {
        letterReserve.lettersReserve = [{ value: 'a', quantity: 1, points: 1 }];
        const expectedLength = letterReserve.lettersReserve.length;
        const letterToInsert: Letter[] = [{ value: 'a', points: 1 } as Letter];
        const expectedLetterReserve = letterReserve.insertLetter(letterToInsert);

        expect(expectedLetterReserve.length).to.equal(expectedLength);
        expect(expectedLetterReserve[0].quantity).to.equal(2);
    });

    it('should return random letter', () => {
        const expectedLength = sampleRack.length + 1;
        letterReserve.distributeLetter(sampleRack);
        expect(sampleRack.length).to.equal(expectedLength);
    });

    it('distributeLetter should call shuffleArray()', () => {
        const shuffleArraySpy = spy(letterReserve, 'shuffleArray' as never);
        letterReserve.distributeLetter(sampleRack);
        expect(shuffleArraySpy.called).to.equal(true);
    });

    it('should remove one letter from the rack', () => {
        const expectedLength = sampleRack.length - 1;
        const updatedRack = letterReserve.removeLettersFromRack(['a'], sampleRack)[0];
        expect(updatedRack.length).to.equal(expectedLength);
    });

    it('should remove one and only one letter B from the rack which contains two B', () => {
        const expectedLength = sampleRack.length - 1;
        const letterToRemove = { value: 'b', quantity: 0, points: 3 };
        const updatedRack = letterReserve.removeLettersFromRack([letterToRemove.value], sampleRack)[0];

        expect(updatedRack).to.deep.include(letterToRemove);
        expect(updatedRack.length).to.equal(expectedLength);
    });

    it('should properly exchange letters from rack', () => {
        const oldRack = sampleRack;
        const newRack = letterReserve.exchangeLetter(
            sampleRack.map((letter) => {
                return letter.value;
            }),
            sampleRack,
        );

        expect(newRack).to.not.equal(oldRack);
        expect(newRack.length).to.equal(oldRack.length);
    });

    it('should not exchange letter when the reserve has less than 7 letters', () => {
        const nLetters = 6;
        const oldRack = sampleRack;
        const totalQuantityStub = stub(letterReserve, 'totalQuantity' as never);
        totalQuantityStub.returns(nLetters);
        const newRack = letterReserve.exchangeLetter(
            sampleRack.map((letter) => {
                return letter.value;
            }),
            sampleRack,
        );
        expect(newRack).to.equal(oldRack);
        expect(newRack.length).to.equal(oldRack.length);
    });

    it('should be able to generate a random quantity of letters', () => {
        const randomQuantity = 7;
        const rack = letterReserve.generateLetters(randomQuantity, emptyRack);
        expect(rack.length).to.equal(randomQuantity);
    });

    it('should return true if the reserve is empty', () => {
        letterReserve.lettersReserve = [{ value: 'b', quantity: 0, points: 3 }];
        const isEmpty = letterReserve.isEmpty();
        expect(isEmpty).to.eql(true);
    });

    it('should return false if the reserve is not empty', () => {
        const isEmpty = letterReserve.isEmpty();
        expect(isEmpty).to.eql(false);
    });

    it('shuffleArray should shuffle the letters array passed as argument', () => {
        const array = [{ value: 'a' } as Letter, { value: 'b' } as Letter, { value: 'c' } as Letter];
        // Reason : testing private method
        // eslint-disable-next-line dot-notation
        expect(letterReserve['shuffleArray'](array)).to.not.eql(array);
    });

    it('should return the total of letter in the letter reserve', () => {
        const expectedTotal = 102;
        expect(letterReserve.totalQuantity()).to.equal(expectedTotal);
    });
});
