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
import { SocketEvents } from '@common/constants/socket-events';
import { Coordinate } from '@common/interfaces/coordinate';
import { Letter } from '@common/interfaces/letter';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { ClientSocketService } from './communication/client-socket.service';
import { GameClientService } from './game-client.service';
import { GridService } from './grid.service';
import { first } from 'rxjs/operators';

// const ASCII_ALPHABET_START = 96;

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

    constructor(
        private clientSocketService: ClientSocketService,
        private gridService: GridService,
        private gameClientService: GameClientService, // private chatboxService: ChatboxHandlerService,
    ) {
        this.boardTiles = [];

        this.setPropreties();
        this.gameClientService.gameboardUpdated.pipe(first()).subscribe((gameBoard: string[]) => {
            this.resetView();
            this.updateGameBoard(gameBoard);
        });
        this.gameClientService.gameboardUpdated.subscribe((gameBoard: string[]) => {
            this.updateGameBoard(gameBoard);
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
            this.origin = tile.coord;
        }

        if (this.placingMode !== PlacingState.Drag || this.hasPlacingEnded || !this.gameClientService.currentlyPlaying()) {
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
        if (this.placingMode !== PlacingState.Keyboard || this.hasPlacingEnded || !this.gameClientService.currentlyPlaying()) {
            return;
        }

        const indexOfLetter: number = this.findLetterFromRack(this.normalizeLetter(keyPressed));
        if (indexOfLetter === constants.INVALID_INDEX) {
            return;
        }

        const placedLetter: Letter = this.gameClientService.getLocalPlayer().rack[indexOfLetter];
        if (placedLetter?.value === '*') {
            placedLetter.value = keyPressed.toUpperCase() as AlphabetLetter;
        }

        this.placeLetter(placedLetter, this.boardTiles[this.selectionPositions[0].coord]);
    }

    // TODO
    submitPlacement() {
        if (this.noLettersPlaced()) return;

        // const verticalPlacement = String.fromCharCode(this.selectionPositions[0].coord + ASCII_ALPHABET_START);
        // const lettersToSubmit = this.placedLetters.map((letter) => letter.letter.value).join('');

        const letters: string[] = [];
        this.placedLetters.forEach((tile: BoardTileInfo) => {
            letters.push(tile.letter.value);
        });
        this.clientSocketService.send(SocketEvents.PlaceWordCommand, {
            firstCoordinate: this.computeCoordinatesFromCoord(),
            isHorizontal: this.selectionPositions[0].direction === PlayDirection.Right,
            letters,
        } as PlaceWordCommandInfo);

        console.log(this.selectionPositions[0].direction === PlayDirection.Right);

        // this.chatboxService.submitMessage(
        //     `!placer ${verticalPlacement}${this.selectionPositions[0].coord}${this.selectionPositions[0].direction} ${lettersToSubmit}`,
        // );
    }

    undoPlacement() {
        if (this.placingMode === PlacingState.Drag) {
            return;
        }
        if (this.noLettersPlaced()) return;

        // this.resetGameBoardView();
        const removedBoardTile = this.placedLetters[this.placedLetters.length - 1];
        this.gameClientService.getLocalPlayer().rack.push(removedBoardTile.letter);

        this.resetTile(removedBoardTile.coord);
        this.resetSelectionPositions(removedBoardTile);
    }

    undoEverything() {
        this.placedLetters.forEach((letter) => {
            this.gameClientService.getLocalPlayer().rack.push(letter.letter);
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
        if (this.placedLetters.length === 0) return true;
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
        if (this.isPositionOutOfBound()) {
            return;
        }

        const playedTile: BoardTileInfo = {
            type: boardTile.type,
            state: BoardTileState.Pending,
            letter,
            coord: boardTile.coord,
        };
        this.boardTiles[boardTile.coord] = playedTile;

        this.gameClientService.getLocalPlayer().rack.splice(
            this.gameClientService.getLocalPlayer().rack.findIndex((letterElement: Letter) => {
                return letterElement.value === letter.value;
            }),
            1,
        );
        this.placedLetters.push(playedTile);

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
        this.gridService.drawGrid(this.gameClientService.gameboard.gameboardTiles);
    }

    noLettersPlaced() {
        return this.placedLetters.length === 0;
    }

    handleTileClick(tile: BoardTileInfo) {
        if (this.placedLetters.length !== 0) return;

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
        return this.gameClientService.getLocalPlayer().rack.findIndex((letter) => letter.value === letterTreated.toUpperCase());
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
            if (this.isTileOutOfBoard(selection.coord) || (this.isTileOutOfRow(selection.coord) && selection.direction === PlayDirection.Right)) {
                outOfBound = true;
            }
        });

        return outOfBound;
    }

    // private getArrayIndex(coordinate: Coordinate): number {
    //     const DISPLACEMENT = 1;
    //     return coordinate.x - DISPLACEMENT + (coordinate.y - DISPLACEMENT) * constants.TOTAL_TILES_IN_ROW;
    // }

    private computeNewPosition(playedCoord: number, revert: boolean) {
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

        const factor = 1;
        switch (this.selectionPositions[0].direction) {
            case PlayDirection.Down: {
                if (this.isTileOutOfBoard(this.selectionPositions[0].coord + factor)) return;

                this.selectionPositions[0].coord = revert
                    ? this.selectionPositions[0].coord - factor * TOTAL_COLUMNS
                    : this.selectionPositions[0].coord + factor * TOTAL_COLUMNS;
                return;
            }
            case PlayDirection.Right: {
                if (this.isTileOutOfRow(this.selectionPositions[0].coord + factor)) return;

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

        if (this.placingMode === PlacingState.Drag && this.placedLetters.length === 0) {
            return true;
        }

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
    }

    private isTileOutOfRow(coord: number): boolean {
        return Math.floor(coord / TOTAL_COLUMNS) !== Math.floor((coord - 1) / TOTAL_COLUMNS);
    }

    private isTileOutOfBoard(coord: number): boolean {
        return coord > TOTAL_ROWS * TOTAL_COLUMNS - 1 || coord < 0;
    }

    private computeCoordinatesFromCoord(): Coordinate {
        const coord: Coordinate = {
            x: (this.origin % TOTAL_COLUMNS) + 1,
            y: Math.floor(this.origin / TOTAL_ROWS) + 1,
        };

        console.log(coord);
        return coord;
    }

    private updateGameBoard(gameBoard: string[]) {
        console.log(gameBoard);
        gameBoard.forEach((tile: string, coord) => {
            this.boardTiles[coord].letter.value = tile.toUpperCase() as AlphabetLetter;
            this.boardTiles[coord].state = BoardTileState.Confirmed;
        });
    }
}
