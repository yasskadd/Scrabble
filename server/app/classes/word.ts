import { Coordinate } from './gameboard-coordinate.class';
import { Letter } from './letter';

export class Word {
    stringFormat: string;
    lettersInOrder: Letter[];
    firstLetterCoordinate: Coordinate;
    isHorizontal: boolean;
    isValid: boolean;
    score: number;

    constructor(stringFormat: string) {}

    calculatePoints() {}
}
