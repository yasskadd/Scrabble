import { Injectable } from '@angular/core';
import * as constants from '@common/constants/board-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { Letter } from '@common/interfaces/letter';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { GameClientService } from './game-client.service';
import { GridService } from './grid.service';

const ASCII_ALPHABET_START = 96;

@Injectable({
    providedIn: 'root',
})
export class LetterPlacementService {
    private startTile: Coordinate;
    private placedLetters: Letter[];
    private isHorizontal: boolean;
    private isPlacingActive: boolean;
    private hasPlacingEnded: boolean;

    constructor(private gridService: GridService, private gameClientService: GameClientService, private chatboxService: ChatboxHandlerService) {
        this.setPropreties();
        this.gameClientService.gameboardUpdated.subscribe(() => {
            this.resetView();
        });
    }

    handlePlacement(letterValue: string) {
        if (!this.isPlacingActive || this.hasPlacingEnded) return;
        const normalizedLetter = this.normalizeLetter(letterValue);
        const indexOfLetter = this.findLetterFromRack(normalizedLetter);
        if (indexOfLetter === constants.INVALID_INDEX) return;
        const placedLetter = this.gameClientService.playerOne.rack.splice(indexOfLetter, 1)[0];
        if (placedLetter.value === '*') placedLetter.value = letterValue;
        this.placeLetter(placedLetter);
    }

    submitPlacement() {
        if (this.noLettersPlaced()) return;
        const direction = this.isHorizontal ? 'h' : 'v';
        const verticalPlacement = String.fromCharCode(this.startTile.y + ASCII_ALPHABET_START);
        const lettersToSubmit = this.placedLetters.map((letter) => letter.value).join('');
        this.chatboxService.submitMessage(`!placer ${verticalPlacement}${this.startTile.x}${direction} ${lettersToSubmit}`);
    }

    undoPlacement() {
        if (this.noLettersPlaced()) return;
        this.resetGameBoardView();
        const letter = this.placedLetters.pop() as Letter;
        letter.value = this.treatLetter(letter.value);
        this.gameClientService.playerOne.rack.push(letter);
        this.hasPlacingEnded = false;
        this.updateLettersView();
    }

    undoEverything() {
        this.placedLetters.forEach((letter) => {
            letter.value = this.treatLetter(letter.value);
            this.gameClientService.playerOne.rack.push(letter);
        });
        this.resetView();
    }

    placeLetterStartPosition(coordinate: Coordinate) {
        const position = this.gridService.getPosition(coordinate);
        if (
            !this.gameClientService.playerOneTurn ||
            this.isOutOfBound(position) ||
            this.gameClientService.gameboard[this.getArrayIndex(position)].isOccupied ||
            this.placedLetters.length !== 0
        )
            return;
        if (this.startTile.x === position.x && this.startTile.y === position.y) {
            this.isHorizontal = !this.isHorizontal;
            this.updateLettersView();
            return;
        }
        this.resetGameBoardView();
        this.startTile = position;
        this.isHorizontal = true;
        this.isPlacingActive = true;
        this.updateLettersView();
    }

    placeLetter(letter: Letter) {
        if (!this.gameClientService.playerOneTurn) return;
        this.placedLetters.push(letter);
        this.updateLettersView();
    }

    resetView() {
        this.resetGameBoardView();
        this.setPropreties();
    }

    resetGameBoardView() {
        this.gridService.drawGrid(this.gameClientService.gameboard);
    }

    noLettersPlaced() {
        return this.placedLetters.length === 0;
    }

    private normalizeLetter(letterValue: string): string {
        return letterValue.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
    }

    private treatLetter(letterValue: string): string {
        if (letterValue === letterValue.toLowerCase()) return letterValue;
        return '*';
    }

    private findLetterFromRack(letterValue: string): number {
        const letterTreated = this.treatLetter(letterValue);
        return this.gameClientService.playerOne.rack.findIndex((letter) => letter.value === letterTreated);
    }

    private updateLettersView() {
        let placementPosition = this.startTile;
        this.placedLetters.forEach((letter) => {
            placementPosition = this.computeNextCoordinate(placementPosition);
            this.gridService.drawUnfinalizedLetter(placementPosition, letter);
            this.incrementByOne(placementPosition);
        });
        placementPosition = this.computeNextCoordinate(placementPosition);
        if (this.isOutOfBound(placementPosition)) {
            this.hasPlacingEnded = true;
            return;
        }
        this.gridService.drawArrow(placementPosition, this.isHorizontal);
    }

    private computeNextCoordinate(startingPoint: Coordinate): Coordinate {
        const computedPosition = { ...startingPoint };
        while (!this.isOutOfBound(computedPosition) && this.gameClientService.gameboard[this.getArrayIndex(computedPosition)].isOccupied) {
            this.incrementByOne(computedPosition);
        }
        return computedPosition;
    }

    private incrementByOne(coordinate: Coordinate) {
        if (!this.isHorizontal) {
            coordinate.y++;
            return;
        }
        coordinate.x++;
    }

    private setPropreties() {
        this.startTile = { x: 0, y: 0 };
        this.placedLetters = [];
        this.isHorizontal = true;
        this.isPlacingActive = false;
        this.hasPlacingEnded = false;
    }

    private isOutOfBound(coordinate: Coordinate): boolean {
        return (
            coordinate.x <= 0 || coordinate.y <= 0 || coordinate.x > constants.TOTAL_TILES_IN_ROW || coordinate.y > constants.TOTAL_TILES_IN_COLUMN
        );
    }

    private getArrayIndex(coordinate: Coordinate): number {
        const DISPLACEMENT = 1;
        return coordinate.x - DISPLACEMENT + (coordinate.y - DISPLACEMENT) * constants.TOTAL_TILES_IN_ROW;
    }
}
