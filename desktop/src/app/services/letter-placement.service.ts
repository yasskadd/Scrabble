import { Injectable } from '@angular/core';
import { BOARD_TILES } from '@app/constants/board-tiles';
import { BoardTileInfo } from '@app/interfaces/board-tile-info';
import { AlphabetLetter } from '@common/models/alphabet-letter';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';
import * as constants from '@common/constants/board-info';
// import { Coordinate } from '@common/interfaces/coordinate';
import { Letter } from '@common/interfaces/letter';
import { ChatboxHandlerService } from './chat/chatbox-handler.service';
import { GameClientService } from './game-client.service';
import { GridService } from './grid.service';
import { PlayDirection } from '@app/models/play-direction';
import { PlacingState } from '@app/models/placing-state';
import { CENTER_TILE } from '@app/constants/board-view';

const ASCII_ALPHABET_START = 96;

@Injectable({
    providedIn: 'root',
})
export class LetterPlacementService {
    boardTiles: BoardTileInfo[];
    defaultBoardTiles: BoardTileInfo[];
    currentSelection: Letter;
    direction: PlayDirection;
    currentPosition: number;
    placingMode: PlacingState;

    private placedLetters: {
        letter: Letter;
        tile: BoardTileInfo;
    }[];
    // private isHorizontal: boolean;
    private hasPlacingEnded: boolean;

    constructor(private gridService: GridService, private gameClientService: GameClientService, private chatboxService: ChatboxHandlerService) {
        this.boardTiles = [];

        this.setPropreties();
        this.gameClientService.gameboardUpdated.subscribe(() => {
            this.resetView();
        });
    }

    resetTile(coord: number): void {
        this.boardTiles[coord] = {
            type: this.defaultBoardTiles[coord].type,
            state: this.defaultBoardTiles[coord].state,
            letter: this.defaultBoardTiles[coord].letter,
            coord: this.defaultBoardTiles[coord].coord,
        };
    }

    handleDragPlacement(index: number, letter: Letter, tile: BoardTileInfo): void {
        if (this.placingMode !== PlacingState.Drag || this.hasPlacingEnded || !this.gameClientService.playerOneTurn) {
            return;
        }
        if (index === constants.INVALID_INDEX) {
            return;
        }

        this.placeLetter(letter, tile);
    }

    handleKeyPlacement(keyPressed: string) {
        if (this.placingMode !== PlacingState.Keyboard || this.hasPlacingEnded || !this.gameClientService.playerOneTurn) {
            return;
        }

        const indexOfLetter: number = this.findLetterFromRack(this.normalizeLetter(keyPressed));
        if (indexOfLetter === constants.INVALID_INDEX) {
            return;
        }

        const placedLetter: Letter = this.gameClientService.playerOne.rack[indexOfLetter];
        if (placedLetter.value === '*') {
            placedLetter.value = keyPressed.toUpperCase() as AlphabetLetter;
        }

        this.placeLetter(placedLetter, this.boardTiles[this.currentPosition]);
    }

    submitPlacement() {
        if (this.noLettersPlaced()) return;

        const verticalPlacement = String.fromCharCode(this.currentPosition + ASCII_ALPHABET_START);
        const lettersToSubmit = this.placedLetters.map((letter) => letter.letter.value).join('');
        this.chatboxService.submitMessage(`!placer ${verticalPlacement}${this.currentPosition}${this.direction} ${lettersToSubmit}`);
    }

    undoPlacement() {
        if (this.placingMode === PlacingState.Drag) {
            return;
        }
        if (this.noLettersPlaced()) return;

        // this.resetGameBoardView();
        const removedLetter = this.placedLetters.pop();
        this.gameClientService.playerOne.rack.push(removedLetter.letter);
        this.resetTile(removedLetter.tile.coord);

        this.computeNewPosition(undefined, true);
        this.hasPlacingEnded = this.isPositionOutOfBound();
        this.currentSelection = undefined;
    }

    undoEverything() {
        this.placedLetters.forEach((letter) => {
            this.gameClientService.playerOne.rack.push(letter.letter);
            this.resetTile(letter.tile.coord);
        });
        this.resetView();
    }

    // placeLetterStartPosition() {
    //     if (
    //         !this.gameClientService.playerOneTurn ||
    //         this.isPositionOutOfBound() ||
    //         this.gameClientService.gameboard[this.getArrayIndex(position)].isOccupied ||
    //         this.placedLetters.length !== 0
    //     )
    //         return;
    //     if (this.startTile.x === position.x && this.startTile.y === position.y) {
    //         this.isHorizontal = !this.isHorizontal;
    //         this.updateLettersView();
    //         return;
    //     }
    //     this.resetGameBoardView();
    //     this.startTile = position;
    //     this.isHorizontal = true;
    //     this.isPlacingActive = true;
    //     this.updateLettersView();
    // }

    placeLetter(letter: Letter, tile: BoardTileInfo) {
        if (!this.isValidPlacing(tile.coord)) {
            return;
        }

        this.boardTiles[tile.coord] = {
            type: tile.type,
            state: BoardTileState.Pending,
            letter,
            coord: tile.coord,
        };
        this.gameClientService.playerOne.rack.splice(
            this.gameClientService.playerOne.rack.findIndex((letterElement: Letter) => {
                return letterElement.value === letter.value;
            }),
            1,
        );
        this.placedLetters.push({ letter, tile });

        if (this.isPositionOutOfBound()) {
            this.hasPlacingEnded = true;
        }
        if (this.placedLetters.length === 2 && this.placingMode === PlacingState.Drag) {
            this.computeDirection(tile.coord);
        }

        this.computeNewPosition(tile.coord, false);
    }

    resetView() {
        // this.resetGameBoardView();
        this.setPropreties();
        this.initTiles();
    }

    resetGameBoardView() {
        this.gridService.drawGrid(this.gameClientService.gameboard);
    }

    noLettersPlaced() {
        return this.placedLetters.length === 0;
    }

    rotateDirection() {
        if (this.placingMode === PlacingState.Keyboard) {
            this.direction += 1;
            this.direction %= 4;
        }
    }

    switchPlacingMode(): boolean {
        if (this.placedLetters.length) {
            return false;
        }

        switch (this.placingMode) {
            case PlacingState.Drag:
                this.placingMode = PlacingState.Keyboard;
                break;
            case PlacingState.Keyboard:
                this.placingMode = PlacingState.Drag;
                break;
        }

        return true;
    }

    // private updateLettersView() {
    // let placementPosition = this.startTile;
    // this.placedLetters.forEach((letter) => {
    //     placementPosition = this.computeNextCoordinate(placementPosition);
    //     this.gridService.drawUnfinalizedLetter(placementPosition, letter);
    //     this.incrementByOne(placementPosition);
    // });
    // this.gridService.drawArrow(placementPosition, this.isHorizontal);
    // }

    private normalizeLetter(letterValue: string): string {
        return letterValue.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '');
    }

    private treatLetter(letterValue: string): string {
        if (letterValue === letterValue.toLowerCase()) return letterValue;
        return '*';
    }

    private findLetterFromRack(letterValue: string): number {
        const letterTreated = this.treatLetter(letterValue);
        return this.gameClientService.playerOne.rack.findIndex((letter) => letter.value === letterTreated.toUpperCase());
    }

    // private computeNextCoordinate(startingPoint: Coordinate): Coordinate {
    //     const computedPosition = { ...startingPoint };
    //     while (!this.isPositionOutOfBound(computedPosition) && this.gameClientService.gameboard[this.getArrayIndex(computedPosition)].isOccupied) {
    //         this.incrementByOne(computedPosition);
    //     }
    //     return computedPosition;
    // }

    // private incrementByOne(coordinate: Coordinate) {
    //     if (!this.isHorizontal) {
    //         coordinate.y++;
    //         return;
    //     }
    //     coordinate.x++;
    // }

    private setPropreties() {
        this.currentPosition = CENTER_TILE;
        this.placedLetters = [];
        // this.isHorizontal = true;
        this.direction = PlayDirection.Right;
        // this.placingMode = PlacingState.Drag;
        this.placingMode = PlacingState.Keyboard;
        this.hasPlacingEnded = false;
        this.initTiles();
    }

    private initTiles(): void {
        this.boardTiles = [];
        this.defaultBoardTiles = [];

        let coord = 0;
        BOARD_TILES.forEach((type: BoardTileType) => {
            this.boardTiles.push({
                type,
                state: BoardTileState.Empty,
                letter: {
                    value: AlphabetLetter.None,
                    quantity: undefined,
                    points: undefined,
                },
                coord,
            });
            coord++;
        });
        this.defaultBoardTiles = [...this.boardTiles];
    }

    private isPositionOutOfBound(): boolean {
        if (this.currentPosition < 0 || this.currentPosition > 15 * 15 - 1) {
            return true;
        }

        switch (this.direction) {
            case PlayDirection.Right: {
                if (Math.floor(this.currentPosition / 15) !== Math.floor((this.currentPosition - 1) / 15)) {
                    return true;
                }
                break;
            }
            case PlayDirection.Left: {
                if (Math.floor(this.currentPosition - 1 / 15) !== Math.floor(this.currentPosition / 15)) {
                    return true;
                }
                break;
            }
            default: {
                break;
            }
        }

        return false;
    }

    // private getArrayIndex(coordinate: Coordinate): number {
    //     const DISPLACEMENT = 1;
    //     return coordinate.x - DISPLACEMENT + (coordinate.y - DISPLACEMENT) * constants.TOTAL_TILES_IN_ROW;
    // }

    private computeNewPosition(playedCoord: number, revert: boolean) {
        let factor = 1;
        if (this.placingMode === PlacingState.Drag && this.placedLetters.length === 1) {
            this.currentPosition = playedCoord;
            return;
        }

        if (this.placingMode === PlacingState.Drag && this.placedLetters.length === 2) {
            factor = 2;
        }

        switch (this.direction) {
            case PlayDirection.Up: {
                this.currentPosition = revert ? this.currentPosition + factor * 15 : this.currentPosition - factor * 15;
                break;
            }
            case PlayDirection.Down: {
                this.currentPosition = revert ? this.currentPosition - factor * 15 : this.currentPosition + factor * 15;
                break;
            }
            case PlayDirection.Right: {
                this.currentPosition = revert ? this.currentPosition - factor : this.currentPosition + factor;
                break;
            }
            case PlayDirection.Left: {
                this.currentPosition = revert ? this.currentPosition + factor : this.currentPosition - factor;
                break;
            }
            default: {
                return;
            }
        }
    }

    private isValidPlacing(coord: number): boolean {
        if (this.placingMode === PlacingState.Drag && this.placedLetters.length === 1) {
            return true;
        }

        return coord === this.currentPosition;
    }

    private computeDirection(playedCoord: number) {
        switch (playedCoord) {
            case this.currentPosition + 1: {
                this.direction = PlayDirection.Right;

                break;
            }
            case this.currentPosition - 1: {
                this.direction = PlayDirection.Left;

                break;
            }
            case this.currentPosition + 15: {
                this.direction = PlayDirection.Down;

                break;
            }
            case this.currentPosition - 15: {
                this.direction = PlayDirection.Up;

                break;
            }
        }
    }
}
