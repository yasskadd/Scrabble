// /* eslint-disable import/no-unresolved */
// /* eslint-disable prettier/prettier */
// import { Coordinate } from '@app/classes/Coordinate.class';
// import { Gameboard } from '@app/classes/Gameboard.class';
// import { Word } from '@app/classes/Word.class';
// import { Letter } from '@app/letter';
// import { expect } from 'chai';
// import { Container } from 'typedi';
// import { BoxMultiplier } from './box-multiplier.service';
// import { WordFinderService } from './word-finder.service';

// describe.only('WordFinderService', () => {
//     let gameboard: Gameboard;
//     let boxMultiplierService: BoxMultiplier;
//     let wordFinderService: WordFinderService;
//     const letterA: Letter = {} as Letter;
//     const letterB: Letter = {} as Letter;
//     const letterC: Letter = {} as Letter;

//     beforeEach(() => {
//         boxMultiplierService = Container.get(BoxMultiplier);
//         wordFinderService = Container.get(WordFinderService);
//         gameboard = new Gameboard(boxMultiplierService);
//         letterA.stringChar = 'A';
//         letterB.stringChar = 'B';
//         letterC.stringChar = 'C';
//     });

//     it('buildFirstWord should build word with string being abc', () => {
//         gameboard.placeLetter(new Coordinate(0, 0, letterA));
//         gameboard.placeLetter(new Coordinate(1, 0, letterB));
//         gameboard.placeLetter(new Coordinate(2, 0, letterC));
//         const placedLetters: Coordinate[] = [new Coordinate(0, 0, letterA), new Coordinate(1, 0, letterB), new Coordinate(1, 0, letterC)];
//         const word: Word = wordFinderService.buildFirstWord(gameboard, placedLetters);
//         expect(word.stringFormat).to.eql('abc');
//     });
// });
