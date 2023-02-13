import * as letterTypes from '../../server/app/constants/letter-reserve';
import { Coordinate } from '../interfaces/coordinate';
import { Multiplier } from '../interfaces/multiplier';

export class LetterTile {
    coordinate: Coordinate;
    isOccupied: boolean;
    private _letter: string;
    points: number;
    multiplier: Multiplier;

    constructor(position: Coordinate) {
        this.coordinate = { ...position };
        this.isOccupied = false;
        this.multiplier = { type: '', number: 1 };
        this.letter = '';
    }

    get letter(): string {
        return this._letter;
    }

    set letter(newLetter: string) {
        this._letter = newLetter.toLowerCase();
        this.setPoints();
    }

    private setPoints() {
        if (this._letter === '') {
            this.points = 0;
        } else {
            const letterType = letterTypes.LETTERS.filter((letter) => {
                return letter.value === this._letter;
            })[0];
            this.points = letterType.points;
        }
    }
}
