/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { Service } from 'typedi';
import { Coordinate } from '../classes/coordinate.class';
import { Gameboard } from '../classes/gameboard.class';
import { Letter } from '../letter';

@Service()
export class BoxMultiplier {
    letterMultipliersByTwo: Coordinate[] = [
        new Coordinate(3, 0, {} as Letter),
        new Coordinate(11, 0, {} as Letter),
        new Coordinate(6, 2, {} as Letter),
        new Coordinate(8, 2, {} as Letter),
        new Coordinate(0, 3, {} as Letter),
        new Coordinate(7, 3, {} as Letter),
        new Coordinate(14, 3, {} as Letter),
        new Coordinate(2, 6, {} as Letter),
        new Coordinate(6, 6, {} as Letter),
        new Coordinate(8, 6, {} as Letter),
        new Coordinate(12, 6, {} as Letter),
        new Coordinate(3, 7, {} as Letter),
        new Coordinate(11, 7, {} as Letter),
        new Coordinate(2, 8, {} as Letter),
        new Coordinate(6, 8, {} as Letter),
        new Coordinate(8, 8, {} as Letter),
        new Coordinate(12, 8, {} as Letter),
        new Coordinate(0, 11, {} as Letter),
        new Coordinate(7, 11, {} as Letter),
        new Coordinate(14, 11, {} as Letter),
        new Coordinate(6, 12, {} as Letter),
        new Coordinate(8, 12, {} as Letter),
        new Coordinate(3, 14, {} as Letter),
        new Coordinate(11, 14, {} as Letter),
    ];

    letterMultipliersByThree: Coordinate[] = [
        new Coordinate(5, 1, {} as Letter),
        new Coordinate(9, 1, {} as Letter),
        new Coordinate(1, 5, {} as Letter),
        new Coordinate(5, 5, {} as Letter),
        new Coordinate(9, 5, {} as Letter),
        new Coordinate(13, 5, {} as Letter),
        new Coordinate(1, 9, {} as Letter),
        new Coordinate(5, 9, {} as Letter),
        new Coordinate(9, 9, {} as Letter),
        new Coordinate(13, 9, {} as Letter),
        new Coordinate(5, 13, {} as Letter),
        new Coordinate(9, 13, {} as Letter),
    ];

    wordMultipliersByTwo: Coordinate[] = [
        new Coordinate(1, 1, {} as Letter),
        new Coordinate(2, 2, {} as Letter),
        new Coordinate(3, 3, {} as Letter),
        new Coordinate(4, 4, {} as Letter),
        new Coordinate(10, 4, {} as Letter),
        new Coordinate(11, 3, {} as Letter),
        new Coordinate(12, 2, {} as Letter),
        new Coordinate(13, 1, {} as Letter),
        new Coordinate(1, 13, {} as Letter),
        new Coordinate(2, 12, {} as Letter),
        new Coordinate(3, 11, {} as Letter),
        new Coordinate(4, 10, {} as Letter),
    ];

    wordMultipliersByThree: Coordinate[] = [
        new Coordinate(0, 0, {} as Letter),
        new Coordinate(7, 0, {} as Letter),
        new Coordinate(14, 0, {} as Letter),
        new Coordinate(0, 7, {} as Letter),
        new Coordinate(7, 7, {} as Letter),
        new Coordinate(14, 7, {} as Letter),
        new Coordinate(0, 14, {} as Letter),
        new Coordinate(7, 14, {} as Letter),
        new Coordinate(14, 14, {} as Letter),
    ];

    applyBoxMultipliers(gameboard: Gameboard) {
        this.letterMultipliersByTwo.forEach((multiplyLetterByTwoPosition) => {
            const gameboardCoord = gameboard.getCoord(multiplyLetterByTwoPosition);
            gameboardCoord.letterMultiplier = 2;
        });

        this.letterMultipliersByThree.forEach((multiplyLetterByThreePosition) => {
            const gameboardCoord = gameboard.getCoord(multiplyLetterByThreePosition);
            gameboardCoord.letterMultiplier = 3;
        });

        this.wordMultipliersByTwo.forEach((multiplyWordByTwoPosition) => {
            const gameboardCoord = gameboard.getCoord(multiplyWordByTwoPosition);
            gameboardCoord.wordMultiplier = 2;
        });

        this.wordMultipliersByThree.forEach((multiplyWordByThreePosition) => {
            const gameboardCoord = gameboard.getCoord(multiplyWordByThreePosition);
            gameboardCoord.wordMultiplier = 3;
        });
    }
}
