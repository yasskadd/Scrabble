import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { Gameboard } from './gameboard.class';

const SEVEN_LETTERS = 7;
const SEVEN_LETTER_BONUS = 50;

export class Word {
    isValid: boolean;
    stringFormat: string = '';
    newLetterCoords: Coordinate[] = [];
    wordCoords: Coordinate[] = [];
    points: number;
    private isHorizontal: boolean | undefined;

    constructor(commandInfo: CommandInfo, gameboard: Gameboard) {
        this.isValid = true;
        this.isHorizontal = commandInfo.isHorizontal;
        this.points = 0;
        this.stringFormat = '';
        this.newLetterCoords = [];
        this.wordCoords = [];

        if (commandInfo.isHorizontal === undefined) this.setIsHorizontal(commandInfo.firstCoordinate, gameboard);

        const firstCoord = this.findFirstCoord(commandInfo.firstCoordinate, gameboard);
        this.setWordAttributes(firstCoord, commandInfo.letters, gameboard);
    }

    static findAdjacentWords(word: Word, gameboard: Gameboard): Word[] {
        const allWords: Word[] = [];
        allWords.push(word);
        word.newLetterCoords.forEach((coord: Coordinate) => {
            this.pushNewAdjacentWord(word, gameboard, coord, allWords);
        });
        return allWords;
    }

    static pushNewAdjacentWord(word: Word, gameboard: Gameboard, coord: Coordinate, allWords: Word[]) {
        const newWord = new Word(
            {
                firstCoordinate: coord,
                isHorizontal: !word.isHorizontal,
                letters: [''],
            },
            gameboard,
        );
        if (newWord.wordCoords.length !== 1) allWords.push(newWord);
    }

    calculateWordPoints(placedWord: Word, gameboard: Gameboard): number {
        this.addLetterPoints(placedWord, gameboard);
        this.addWordMultiplierPoints(placedWord, gameboard);
        if (this.newLetterCoords.length === SEVEN_LETTERS) this.points += SEVEN_LETTER_BONUS;
        return this.points;
    }

    private setIsHorizontal(firstCoord: Coordinate, gameboard: Gameboard) {
        if (this.upDownIsOccupied(gameboard, firstCoord)) this.isHorizontal = false;
        else if (this.leftRightIsOccupied(gameboard, firstCoord)) this.isHorizontal = true;
        else this.isValid = false;
    }

    private upDownIsOccupied(gameboard: Gameboard, firstCoord: Coordinate) {
        const up = { x: firstCoord.x, y: firstCoord.y - 1 };
        const down = { x: firstCoord.x, y: firstCoord.y + 1 };
        return (
            (gameboard.getLetterTile(up).isOccupied && gameboard.isWithinBoardLimits(up)) ||
            (gameboard.getLetterTile(down).isOccupied && gameboard.isWithinBoardLimits(down))
        );
    }

    private leftRightIsOccupied(gameboard: Gameboard, firstCoord: Coordinate) {
        const left = { x: firstCoord.x - 1, y: firstCoord.y };
        const right = { x: firstCoord.x + 1, y: firstCoord.y };
        return (
            (gameboard.getLetterTile(left).isOccupied && gameboard.isWithinBoardLimits(left)) ||
            (gameboard.getLetterTile(right).isOccupied && gameboard.isWithinBoardLimits(right))
        );
    }

    private findFirstCoord(coord: Coordinate, gameboard: Gameboard): Coordinate {
        const backwardPosition = this.isHorizontal ? { x: coord.x - 1, y: coord.y } : { x: coord.x, y: coord.y - 1 };

        if (gameboard.isWithinBoardLimits(backwardPosition) && gameboard.getLetterTile(backwardPosition).isOccupied) {
            while (gameboard.isWithinBoardLimits(backwardPosition) && gameboard.getLetterTile(backwardPosition).isOccupied)
                this.decrementBackwardPosition(backwardPosition);
            this.incrementPosition(backwardPosition);
            return backwardPosition;
        } else return coord;
    }

    private decrementBackwardPosition(backwardPosition: Coordinate) {
        if (this.isHorizontal) backwardPosition.x--;
        else backwardPosition.y--;
    }

    private setWordAttributes(firstCoord: Coordinate, commandLetters: string[], gameboard: Gameboard) {
        const position: Coordinate = { ...firstCoord };
        const commandLettersCopy: string[] = commandLetters.slice();

        if (commandLettersCopy[0] === '') commandLettersCopy.shift();

        while ((commandLettersCopy.length > 0 || gameboard.getLetterTile(position).isOccupied) && gameboard.isWithinBoardLimits(position)) {
            if (!gameboard.getLetterTile(position).isOccupied) this.addNewLetter(position, commandLettersCopy);
            else this.addGameboardLetter(position, gameboard);

            this.incrementPosition(position);
        }

        this.checkValidity(commandLettersCopy);
    }

    private addNewLetter(position: Coordinate, commandLettersCopy: string[]) {
        this.stringFormat += commandLettersCopy[0].toLowerCase();
        commandLettersCopy.shift();
        this.wordCoords.push({ ...position });
        this.newLetterCoords.push({ ...position });
    }

    private addGameboardLetter(position: Coordinate, gameboard: Gameboard) {
        this.wordCoords.push({ ...position });
        this.stringFormat += gameboard.getLetterTile({ ...position }).letter;
    }

    private incrementPosition(position: Coordinate) {
        if (!this.isHorizontal) {
            position.y++;
            return;
        }
        position.x++;
    }

    private checkValidity(commandLettersCopy: string[]) {
        if (commandLettersCopy.length !== 0) this.isValid = false;
        if (this.wordCoords.length < 2) this.isValid = false;
    }

    private addLetterPoints(placedWord: Word, gameboard: Gameboard) {
        this.wordCoords.forEach((coord: Coordinate) => {
            if (this.coordHasLetterMultiplier(gameboard, coord) && this.isNewLetterCoord(placedWord, coord)) {
                this.addLetterPointsWithMultiplier(gameboard, coord);
                return;
            }
            this.addLetterPointsWithoutMultiplier(gameboard, coord);
        });
    }

    private addWordMultiplierPoints(placedWord: Word, gameboard: Gameboard) {
        this.wordCoords.forEach((coord: Coordinate) => {
            if (this.coordHasWordMultiplier(gameboard, coord) && this.isNewLetterCoord(placedWord, coord)) this.multiplyWordPoints(gameboard, coord);
        });
    }

    private coordHasLetterMultiplier(gameboard: Gameboard, coord: Coordinate): boolean {
        return gameboard.getLetterTile(coord).multiplier.type === 'LETTRE' && gameboard.getLetterTile(coord).multiplier.number > 1;
    }

    private addLetterPointsWithMultiplier(gameboard: Gameboard, coord: Coordinate) {
        this.points += gameboard.getLetterTile(coord).points * gameboard.getLetterTile(coord).multiplier.number;
    }

    private addLetterPointsWithoutMultiplier(gameboard: Gameboard, coord: Coordinate) {
        this.points += gameboard.getLetterTile(coord).points;
    }

    private coordHasWordMultiplier(gameboard: Gameboard, coord: Coordinate): boolean {
        return gameboard.getLetterTile(coord).multiplier.type === 'MOT' && gameboard.getLetterTile(coord).multiplier.number > 1;
    }

    private multiplyWordPoints(gameboard: Gameboard, coord: Coordinate) {
        this.points *= gameboard.getLetterTile(coord).multiplier.number;
    }

    private isNewLetterCoord(placedWord: Word, coord: Coordinate): boolean {
        return placedWord.newLetterCoords.filter((newLetterCoord) => coord.x === newLetterCoord.x && coord.y === newLetterCoord.y).length === 1;
    }
}
