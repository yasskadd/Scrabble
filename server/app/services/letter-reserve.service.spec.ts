// import { Letter } from '@app/letter';
import { expect } from 'chai';
import * as letterJSON from '../../assets/letter-reserve.json';
import { Letter, LetterReserveService } from './letter-reserve.service';

describe('LetterReserveService', () => {
    let service: LetterReserveService;
    let sampleRack: Letter[];
    let emptyRack: Letter[];

    beforeEach(() => {
        service = new LetterReserveService();
        emptyRack = [];
        sampleRack = [
            { letter: 'A', quantity: 8, weight: 3 },
            { letter: 'B', quantity: 0, weight: 4 },
            { letter: 'B', quantity: 0, weight: 4 },
            { letter: 'C', quantity: 1, weight: 3 },
            { letter: 'D', quantity: 2, weight: 2 },
        ];
    });

    it('should generate default letter reserve', () => {
        const expectedReserve = JSON.stringify(letterJSON.letters);
        const defaultLetterReserve = JSON.stringify(service.getDefaultLetterReserve());
        expect(defaultLetterReserve).to.equal(expectedReserve);
    });

    it('should subtract letter quantity by 1', () => {
        const expectedQuantity = service.lettersReserve[0].quantity - 1;
        const letterToRemove: Letter = { letter: 'A', quantity: 9, weight: 3 };
        service.updateReserve(letterToRemove);
        expect(service.lettersReserve[0].quantity).to.equal(expectedQuantity);
    });

    it('should remove the letter form the reserve if the quantity of the letter is 0', () => {
        const expectedLength = service.lettersReserve.length - 1;
        const letterToRemove: Letter = { letter: 'Z', quantity: 1, weight: 10 };
        service.updateReserve(letterToRemove);

        expect(service.lettersReserve.length).to.equal(expectedLength);
    });

    it('should return random letter', () => {
        const expectedLength = sampleRack.length + 1;
        service.distributeLetter(sampleRack);

        expect(sampleRack.length).to.equal(expectedLength);
    });

    it('should remove one letter from the rack', () => {
        const expectedLength = sampleRack.length - 1;
        const updatedRack = service.removeLettersFromRack([{ letter: 'A', quantity: 8, weight: 3 }], sampleRack);
        expect(updatedRack.length).to.equal(expectedLength);
    });

    it('should remove one and only one letter B from the rack which contains two B', () => {
        const expectedLength = sampleRack.length - 1;
        const letterToRemove = { letter: 'B', quantity: 0, weight: 4 };
        const updatedRack = service.removeLettersFromRack([letterToRemove], sampleRack);

        expect(updatedRack).to.deep.include(letterToRemove);
        expect(updatedRack.length).to.equal(expectedLength);
    });

    it('should properly exchange letters from rack', () => {
        const oldRack = sampleRack;
        const newRack = service.exchangeLetter(sampleRack, sampleRack);
        expect(newRack).to.not.equal(oldRack);
        expect(newRack.length).to.equal(oldRack.length);
    });

    it('should not exchange letter when the reserve has less than 7 letters', () => {
        const nLetters = 6;
        const oldRack = sampleRack;
        service.lettersReserve = service.lettersReserve.slice(0, nLetters);
        const newRack = service.exchangeLetter(sampleRack, sampleRack);
        expect(newRack).to.equal(oldRack);
        expect(newRack.length).to.equal(oldRack.length);
    });

    it('should be able to generate a random quantity of letters', () => {
        const randomQuantity = 7;
        const rack = service.generateLetters(randomQuantity, emptyRack);
        expect(rack.length).to.equal(randomQuantity);
    });
});
