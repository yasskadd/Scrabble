import { LetterTile } from '@common/classes/letter-tile.class';
import * as multipliers from '@common/constants/board-multiplier-coords';
import { Coordinate } from '@common/interfaces/coordinate';

const ROWS = 15;
const COLUMNS = 15;
const MIDDLE_COORD = { x: 8, y: 8 };

export class Gameboard {
    gameboardTiles: LetterTile[] = new Array();

    constructor() {
        this.createLetterTiles();
        this.applyBoxMultipliers(this);
    }

    createLetterTiles() {
        for (let i = 1; i <= ROWS; i++) {
            for (let j = 1; j <= COLUMNS; j++) {
                this.gameboardTiles.push(new LetterTile({ x: j, y: i }));
            }
        }
    }

    applyBoxMultipliers(gameboard: Gameboard) {
        multipliers.letterMultipliersByTwo.forEach((coord) => {
            gameboard.getLetterTile(coord).multiplier = { type: 'LETTRE', number: 2 };
        });

        multipliers.letterMultipliersByThree.forEach((coord) => {
            gameboard.getLetterTile(coord).multiplier = { type: 'LETTRE', number: 3 };
        });

        multipliers.wordMultipliersByTwo.forEach((coord) => {
            gameboard.getLetterTile(coord).multiplier = { type: 'MOT', number: 2 };
        });

        multipliers.wordMultipliersByThree.forEach((coord) => {
            gameboard.getLetterTile(coord).multiplier = { type: 'MOT', number: 3 };
        });

        gameboard.getLetterTile(MIDDLE_COORD).multiplier = { type: 'MOT', number: 2 };
    }

    getLetterTile(position: Coordinate): LetterTile {
        if (position === null || !this.isWithinBoardLimits(position)) return {} as LetterTile;

        return this.gameboardTiles.filter(
            (gameboardTile) => gameboardTile.coordinate.x === position.x && gameboardTile.coordinate.y === position.y,
        )[0];
    }

    isWithinBoardLimits(coord: Coordinate): boolean {
        return coord.x >= 1 && coord.x <= ROWS && coord.y >= 1 && coord.y <= COLUMNS;
    }

    placeLetter(position: Coordinate, letter: string) {
        this.getLetterTile(position).letter = letter;
        this.getLetterTile(position).isOccupied = true;
    }

    removeLetter(position: Coordinate) {
        this.getLetterTile(position).letter = '';
        this.getLetterTile(position).isOccupied = false;
    }

    isAnchor(tile: LetterTile): boolean {
        if (tile.isOccupied) return false;
        if (
            this.getLetterTile({ x: tile.coordinate.x - 1, y: tile.coordinate.y } as Coordinate).isOccupied ||
            this.getLetterTile({ x: tile.coordinate.x + 1, y: tile.coordinate.y } as Coordinate).isOccupied ||
            this.getLetterTile({ x: tile.coordinate.x, y: tile.coordinate.y - 1 } as Coordinate).isOccupied ||
            this.getLetterTile({ x: tile.coordinate.x, y: tile.coordinate.y + 1 } as Coordinate).isOccupied
        )
            return true;
        return false;
    }

    findAnchors(): Coordinate[] {
        const anchors: Coordinate[] = [];
        for (const tile of this.gameboardTiles) {
            if (this.isAnchor(tile)) anchors.push(tile.coordinate);
        }
        return anchors;
    }
}
