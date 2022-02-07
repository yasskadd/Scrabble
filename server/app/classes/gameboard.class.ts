/* eslint-disable prettier/prettier */
import { BoxMultiplier } from 'app/services/box-multiplier.service';
import { Coordinate } from '../../../common/coordinate.class';
import { Letter } from '../../../common/letter';

export class Gameboard {
    gameboardCoords: Coordinate[] = new Array();

    constructor(private boxMultiplierService: BoxMultiplier) {
        this.createCoordinates();
        this.boxMultiplierService.applyBoxMultipliers(this);
    }

    createCoordinates(): void {
        const rowNumbers = 15;
        const columnNumbers = 15;
        for (let i = 0; i < rowNumbers; i++) {
            for (let j = 0; j < columnNumbers; j++) {
                const letter: Letter = {} as Letter;
                const coord: Coordinate = new Coordinate(i, j, letter);
                this.gameboardCoords.push(coord);
            }
        }
    }

    getCoord(coord: Coordinate): Coordinate {
        // eslint-disable-next-line no-unused-vars
        // console.log(coord);
        // console.log(this.gameboardCoords[0]);
        return this.gameboardCoords.filter((gameboardCoord) => {
            return gameboardCoord.x === coord.x && gameboardCoord.y === coord.y;
        })[0];
    }

    placeLetter(letterCoord: Coordinate): boolean {
        const gameboardCoord = this.getCoord(letterCoord);
        if (gameboardCoord.isOccupied === true) {
            return false;
        } else {
            // TODO : removeLetterFromChevalet(gameboardCoord.letter);
            gameboardCoord.letter = letterCoord.letter;
            gameboardCoord.isOccupied = true;
            return true;
        }
    }

    // might not be necessary
    removeLetter(letterCoord: Coordinate) {
        const gameboardCoord = this.getCoord(letterCoord);
        if (gameboardCoord.isOccupied) {
            // TODO : returnLetterToChevalet(gameboardCoord.letter);
            gameboardCoord.letter = {} as Letter;
            gameboardCoord.isOccupied = false;
        } else {
            return;
        }
    }
}
