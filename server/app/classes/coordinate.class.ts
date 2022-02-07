import { Letter } from '@app/letter';

export class Coordinate {
    x: number;
    y: number;
    isOccupied: boolean;
    letter: Letter;
    letterMultiplier: number;
    wordMultiplier: number;

    constructor(posX: number, posY: number, letter: Letter) {
        this.x = posX;
        this.y = posY;
        this.isOccupied = false;
        this.letter = letter;
        this.letterMultiplier = 1;
        this.wordMultiplier = 1;
    }
}
