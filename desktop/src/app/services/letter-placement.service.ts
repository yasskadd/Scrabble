/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { BOARD_TILES } from '@app/constants/board-tiles';
import { BoardTileInfo } from '@app/interfaces/board-tile-info';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';
import * as constants from '@common/constants/board-info';
import { AlphabetLetter } from '@common/models/alphabet-letter';
// import { Coordinate } from '@common/interfaces/coordinate';
import { TOTAL_COLUMNS, TOTAL_ROWS } from '@app/constants/board-view';
import { SelectionPosition } from '@app/interfaces/selection-position';
import { PlacingState } from '@app/models/placing-state';
import { PlayDirection } from '@app/models/play-direction';
import { Letter } from '@common/interfaces/letter';
import { ChatboxHandlerService } from './chat/chatbox-handler.service';
import { GameClientService } from './game-client.service';
import { GridService } from './grid.service';

const ASCII_ALPHABET_START = 96;

@Injectable({
    providedIn: 'root',
})
export class LetterPlacementService {
    boardTiles: BoardTileInfo[];
    defaultBoardTiles: BoardTileInfo[];
    currentSelection: Letter;
    selectionPositions: SelectionPosition[];
    origin: number;

    private placedLetters: BoardTileInfo[];
    private placingMode: PlacingState;
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
        if (this.placedLetters.length === 0) {
            this.placingMode = PlacingState.Drag;
        }

        if (this.placingMode !== PlacingState.Drag || this.hasPlacingEnded || !this.gameClientService.playerOneTurn) {
            return;
        }
        if (index === constants.INVALID_INDEX) {
            return;
        }

        this.placeLetter(letter, tile);
    }

    handleKeyPlacement(keyPressed: string) {
        if (this.placedLetters.length === 0) {
            this.placingMode = PlacingState.Keyboard;
        }
        if (this.placingMode !== PlacingState.Keyboard || this.hasPlacingEnded || !this.gameClientService.playerOneTurn) {
            return;
        }

        const indexOfLetter: number = this.findLetterFromRack(this.normalizeLetter(keyPressed));
        if (indexOfLetter === constants.INVALID_INDEX) {
            return;
        }

        const placedLetter: Letter = this.gameClientService.playerOne.rack[indexOfLetter];
        if (placedLetter?.value === '*') {
            placedLetter.value = keyPressed.toUpperCase() as AlphabetLetter;
        }

        this.placeLetter(placedLetter, this.boardTiles[this.selectionPositions[0].coord]);
    }

    submitPlacement() {
        if (this.noLettersPlaced()) return;

        const verticalPlacement = String.fromCharCode(this.selectionPositions[0].coord + ASCII_ALPHABET_START);
        const lettersToSubmit = this.placedLetters.map((letter) => letter.letter.value).join('');
        this.chatboxService.submitMessage(
            `!placer ${verticalPlacement}${this.selectionPositions[0].coord}${this.selectionPositions[0].direction} ${lettersToSubmit}`,
        );
    }

    undoPlacement() {
        if (this.placingMode === PlacingState.Drag) {
            return;
        }
        if (this.noLettersPlaced()) return;

        // this.resetGameBoardView();
        const removedBoardTile = this.placedLetters[this.placedLetters.length - 1];
        this.gameClientService.playerOne.rack.push(removedBoardTile.letter);

        this.resetTile(removedBoardTile.coord);
        this.resetSelectionPositions(removedBoardTile);
    }

    undoEverything() {
        this.placedLetters.forEach((letter) => {
            this.gameClientService.playerOne.rack.push(letter.letter);
            this.resetTile(letter.coord);
        });
        this.resetView();
    }

    resetSelectionPositions(removedBoardTile: BoardTileInfo): void {
        this.placedLetters.pop();
        this.computeNewPosition(removedBoardTile.coord, true);
        this.hasPlacingEnded = this.isPositionOutOfBound();
        this.currentSelection = undefined;
    }

    isRemoveValid(boardTile: BoardTileInfo): boolean {
        return boardTile.coord === this.placedLetters[this.placedLetters.length - 1].coord;
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

    placeLetter(letter: Letter, boardTile: BoardTileInfo) {
        if (!this.isValidPlacing(boardTile.coord)) {
            return;
        }

        const playedTile: BoardTileInfo = {
            type: boardTile.type,
            state: BoardTileState.Pending,
            letter,
            coord: boardTile.coord,
        };
        this.boardTiles[boardTile.coord] = playedTile;

        this.gameClientService.playerOne.rack.splice(
            this.gameClientService.playerOne.rack.findIndex((letterElement: Letter) => {
                return letterElement.value === letter.value;
            }),
            1,
        );
        this.placedLetters.push(playedTile);

        if (this.isPositionOutOfBound()) {
            this.hasPlacingEnded = true;
        }
        if (this.placedLetters.length === 2 && this.placingMode === PlacingState.Drag) {
            this.computeDirection(playedTile.coord);
        }

        this.computeNewPosition(playedTile.coord, false);
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

    handleTileClick(tile: BoardTileInfo) {
        if (this.placingMode && this.placingMode === PlacingState.Drag) return;

        if (tile.coord !== this.origin) {
            this.origin = tile.coord;
            this.computeNewPosition(tile.coord, false);
            return;
        }

        if (this.placedLetters.length === 0) {
            this.selectionPositions[0].direction += 1;
            this.selectionPositions[0].direction %= 2;
        }
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
        this.origin = undefined;
        this.selectionPositions = [];
        this.placedLetters = [];
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
        let outOfBound = false;

        this.selectionPositions.forEach((selection: SelectionPosition) => {
            if (selection.coord < 0 || selection.coord > TOTAL_ROWS * TOTAL_COLUMNS - 1) {
                outOfBound = true;
            }
            switch (selection.direction) {
                case PlayDirection.Right: {
                    if (
                        Math.floor(this.selectionPositions[0].coord / TOTAL_COLUMNS) !==
                        Math.floor((this.selectionPositions[0].coord - 1) / TOTAL_COLUMNS)
                    ) {
                        outOfBound = true;
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        });

        return outOfBound;
    }

    // private getArrayIndex(coordinate: Coordinate): number {
    //     const DISPLACEMENT = 1;
    //     return coordinate.x - DISPLACEMENT + (coordinate.y - DISPLACEMENT) * constants.TOTAL_TILES_IN_ROW;
    // }

    private computeNewPosition(playedCoord: number, revert: boolean) {
        const factor = 1;

        if (!this.selectionPositions || this.placedLetters.length === 0) {
            this.selectionPositions = [
                {
                    coord: playedCoord,
                    direction: PlayDirection.Right,
                },
            ];
            return;
        }

        if (this.placingMode === PlacingState.Drag) {
            if (this.placedLetters.length === 1) {
                this.selectionPositions = [
                    {
                        coord: this.origin + 1,
                        direction: PlayDirection.Right,
                    },
                    {
                        coord: this.origin + TOTAL_COLUMNS,
                        direction: PlayDirection.Down,
                    },
                ];
                return;
            }
        }

        switch (this.selectionPositions[0].direction) {
            case PlayDirection.Down: {
                this.selectionPositions[0].coord = revert
                    ? this.selectionPositions[0].coord - factor * TOTAL_COLUMNS
                    : this.selectionPositions[0].coord + factor * TOTAL_COLUMNS;
                return;
            }
            case PlayDirection.Right: {
                this.selectionPositions[0].coord = revert ? this.selectionPositions[0].coord - factor : this.selectionPositions[0].coord + factor;
                return;
            }
            default: {
                return;
            }
        }
    }

    private isValidPlacing(coord: number): boolean {
        let validity = false;
        this.selectionPositions.forEach((selection: SelectionPosition) => {
            if (selection.coord === coord) {
                validity = true;
            }
        });

        return validity;
    }

    private computeDirection(playedCoord: number): void {
        this.selectionPositions.forEach((selection: SelectionPosition) => {
            if (playedCoord === selection.coord) {
                this.selectionPositions[0].direction = selection.direction;
            }
        });

        this.selectionPositions[0].coord = playedCoord;
        this.selectionPositions.pop();
        this.selectionPositions.pop();
        this.selectionPositions.pop();
    }
}
