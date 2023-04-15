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
import { first } from 'rxjs/operators';
import { DragInfos } from '@common/interfaces/drag-infos';
import { window as tauriWindow } from '@tauri-apps/api';
import { SimpleLetterInfos } from '@common/interfaces/simple-letter-infos';
import { GameConfigurationService } from '@services/game-configuration.service';
import { SnackBarService } from '@services/snack-bar.service';
import { DialogBoxLetterSelectorComponent } from '@app/components/dialog-box-letter-selector/dialog-box-letter-selector.component';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

// const ASCII_ALPHABET_START = 96;

@Injectable({
    providedIn: 'root',
})
export class LetterPlacementService {
    liveBoard: BoardTileInfo[];
    confirmedBoard: BoardTileInfo[];
    defaultBoard: BoardTileInfo[];
    currentSelection: Letter;
    selectionPositions: SelectionPosition[];
    origin: number;
    dragLetter: DragInfos;
    clueWords: PlaceWordCommandInfo[];
    placedLetters: BoardTileInfo[];

    private placingMode: PlacingState;
    private hasPlacingEnded: boolean;

    constructor(
        private clientSocketService: ClientSocketService,
        private gameConfigurationService: GameConfigurationService,
        private gameClientService: GameClientService, // private chatboxService: ChatboxHandlerService,
        private snackBarService: SnackBarService,
        private matDialog: MatDialog,
    ) {
        this.liveBoard = [];
        this.defaultBoard = [];
        this.confirmedBoard = [];
        this.clueWords = [];

        this.hasPlacingEnded = false;

        this.initSelection();
        this.resetBoardState();
        this.gameClientService.gameboardUpdated.pipe(first()).subscribe((gameBoard: string[]) => {
            this.resetBoardState();
            this.updateGameBoard(gameBoard);
        });
        this.gameClientService.gameboardUpdated.subscribe((gameBoard: string[]) => {
            this.updateGameBoard(gameBoard);
        });
        this.gameClientService.nextTurnSubject.subscribe(() => {
            this.placedLetters = [];
            this.selectionPositions = [];
        });
        this.gameClientService.quitGameSubject.subscribe(() => {
            this.resetBoardState();
        });
        this.subscribeDrag();
        this.subscribeClue();
        this.initTiles();
    }

    initSelection(): void {
        this.currentSelection = {
            value: AlphabetLetter.None,
            quantity: undefined,
            points: undefined,
        };
    }

    async scaleCoord(window: number[], coord: number[]): Promise<number[]> {
        const windowSize = await tauriWindow.appWindow.innerSize();
        const windowScale = await tauriWindow.appWindow.scaleFactor();
        const size = [windowSize.width, windowSize.height];

        coord[0] *= size[0] / window[0];
        coord[1] *= size[1] / window[1];

        coord[0] = Math.max(0, Math.min(coord[0], size[0]));
        coord[1] = Math.max(0, Math.min(coord[1], size[1]));
        coord[0] -= 18 * windowScale;
        coord[1] -= 18 * windowScale;

        return coord;
    }

    initLiveTile(coord: number): void {
        this.liveBoard[coord] = JSON.parse(JSON.stringify(this.defaultBoard[coord]));
        this.confirmedBoard[coord] = JSON.parse(JSON.stringify(this.defaultBoard[coord]));
    }

    handleDragPlacement(index: number, letter: Letter, tile: BoardTileInfo): void {
        if (this.placedLetters.length === 0) {
            this.placingMode = PlacingState.Drag;
            this.origin = tile.coord;
        }

        if (this.placingMode !== PlacingState.Drag || this.hasPlacingEnded || !this.gameClientService.currentlyPlaying()) {
            if (this.hasPlacingEnded) {
                // TODO : Language
                this.snackBarService.openError('Cannot place letter here');
            }
            if (!this.gameClientService.currentlyPlaying()) {
                // TODO : Language
                this.snackBarService.openError('Please wait for you turn');
            }
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

        const placedLetter: Letter = this.gameClientService.getLocalPlayer()?.rack[indexOfLetter];

        this.placeLetter(placedLetter, this.liveBoard[this.selectionPositions[0].coord]);
    }

    submitPlacement() {
        if (this.noLettersPlaced()) return;

        const letters: string[] = [];
        this.placedLetters.forEach((tile: BoardTileInfo) => {
            letters.push(tile.letter.value);
        });
        this.clientSocketService.send(SocketEvents.PlaceWordCommand, {
            firstCoordinate: this.computeCoordinatesFromCoord(),
            isHorizontal: this.selectionPositions[0].direction === PlayDirection.Right,
            letters,
        } as PlaceWordCommandInfo);
    }

    undoPlacement() {
        if (this.placingMode === PlacingState.Drag) {
            return;
        }
        if (this.noLettersPlaced()) return;

        // this.resetGameBoardView();
        const removedBoardTile = this.placedLetters[this.placedLetters.length - 1];
        this.gameClientService.getLocalPlayer().rack.push(removedBoardTile.letter);

        this.clientSocketService.send(SocketEvents.LetterPlaced, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClientService.getLocalPlayer()?.player.socketId,
            coord: -removedBoardTile.coord,
            letter: removedBoardTile.letter.value.toString(),
        });

        this.initLiveTile(removedBoardTile.coord);
        this.resetSelectionPositions(removedBoardTile);
    }

    undoEverything() {
        this.placedLetters.forEach((tile) => {
            const removedBoardTile = JSON.parse(JSON.stringify(tile));
            this.gameClientService.getLocalPlayer()?.rack.push(removedBoardTile.letter);
            this.clientSocketService.send(SocketEvents.LetterPlaced, {
                roomId: this.gameConfigurationService.localGameRoom.id,
                socketId: this.gameClientService.getLocalPlayer()?.player.socketId,
                coord: -removedBoardTile.coord,
                letter: removedBoardTile.letter.value.toString(),
            });
            this.initLiveTile(removedBoardTile.coord);
        });

        this.placedLetters = [];
        this.selectionPositions = [];
        // this.hasPlacingEnded = this.isPositionOutOfBound();
        this.currentSelection = undefined;
    }

    resetSelectionPositions(removedBoardTile: BoardTileInfo): void {
        const tileIndex = this.placedLetters.findIndex((t: BoardTileInfo) => t === removedBoardTile);
        this.placedLetters.splice(tileIndex, 1);
        // this.placedLetters.pop();
        this.computeNewPosition(removedBoardTile.coord, true);
        // this.hasPlacingEnded = this.isPositionOutOfBound();
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
        // if (this.isPositionOutOfBound()) {
        // if (this.hasPlacingEnded) {
        //     // TODO : Language
        //     this.snackBarService.openError('Cannot place letter outside the board');
        // }
        // return;
        // }

        if (letter.value === AlphabetLetter.Any) {
            this.openLetterSelector().subscribe((l: AlphabetLetter) => {
                if (l === AlphabetLetter.None) return;
                letter.value = l;
                this.commitLetter(letter, boardTile, true, false);
            });

            return;
        }

        this.commitLetter(letter, boardTile, false, false);
    }

    commitLetter(letter: Letter, boardTile: BoardTileInfo, isStar: boolean, forced: boolean): void {
        console.log(letter);
        console.log(boardTile);
        const playedTile: BoardTileInfo = {
            type: boardTile.type,
            state: BoardTileState.Pending,
            letter: {
                value: isStar ? letter.value.toLowerCase() : letter.value.toUpperCase(),
                points: letter.points,
                quantity: letter.quantity,
            },
            coord: boardTile.coord,
        };
        this.liveBoard[boardTile.coord] = playedTile;
        this.confirmedBoard[boardTile.coord] = playedTile;
        this.placedLetters.push(playedTile);

        if (isStar) {
            letter.value = AlphabetLetter.Any;
        }

        this.clientSocketService.send(SocketEvents.LetterPlaced, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClientService.getLocalPlayer()?.player.socketId,
            coord: boardTile.coord,
            letter: letter.value.toString(),
        });

        this.gameClientService.getLocalPlayer()?.rack.splice(
            this.gameClientService.getLocalPlayer()?.rack.findIndex((letterElement: Letter) => {
                return letterElement.value === letter.value;
            }),
            1,
        );

        if (this.placedLetters.length === 2 && this.placingMode === PlacingState.Drag && !forced) {
            this.computeDirection(playedTile.coord);
        }

        if (!forced) this.computeNewPosition(playedTile.coord, false);
    }

    resetView() {
        this.resetBoardState();
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

    computeNewPosition(playedCoord: number, revert: boolean) {
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
                this.selectionPositions = [this.computeNextRightPosition(playedCoord, revert), this.computeNextDownPosition(playedCoord, revert)];
                return;
            }
        }

        switch (this.selectionPositions[0].direction) {
            case PlayDirection.Down: {
                this.selectionPositions = [this.computeNextDownPosition(playedCoord, revert)];
                return;
            }
            case PlayDirection.Right: {
                this.selectionPositions = [this.computeNextRightPosition(playedCoord, revert)];
                return;
            }
            default: {
                return;
            }
        }
    }

    getWordCoords(word: PlaceWordCommandInfo): number[] {
        let nextCoord = this.computeCoordFromCoordinate(word.firstCoordinate);
        const coords: number[] = [];

        word.letters.forEach(() => {
            coords.push(nextCoord);
            if (!word.isHorizontal) {
                nextCoord += TOTAL_COLUMNS;
                while (this.confirmedBoard[nextCoord].state === BoardTileState.Confirmed) {
                    nextCoord += TOTAL_COLUMNS;
                }
            } else {
                nextCoord++;
                while (this.confirmedBoard[nextCoord].state === BoardTileState.Confirmed) {
                    nextCoord++;
                }
            }
        });

        return coords;
    }

    removeClue(index: number): void {
        this.getWordCoords(this.clueWords[index]).forEach((coord: number) => {
            this.initLiveTile(coord);
        });
    }

    showClueWord(index: number): void {
        this.getWordCoords(this.clueWords[index]).forEach((coord: number, coordIndex: number) => {
            if (this.confirmedBoard[coord].state === BoardTileState.Confirmed) return;
            this.liveBoard[coord].state = BoardTileState.Temp;
            this.liveBoard[coord].letter.value = this.clueWords[index].letters[coordIndex];
            this.confirmedBoard[coord].state = BoardTileState.Temp;
            this.confirmedBoard[coord].letter.value = this.clueWords[index].letters[coordIndex];
        });
    }

    submitClue(index: number): void {
        const coord = this.clueWords[index].firstCoordinate.x - 1 + (this.clueWords[index].firstCoordinate.y - 1) * TOTAL_COLUMNS;
        this.selectionPositions = [{ coord, direction: this.clueWords[index].isHorizontal ? PlayDirection.Right : PlayDirection.Down }];
        const letterCoords = this.getWordCoords(this.clueWords[index]);

        this.placedLetters = [];
        this.clueWords[index].letters.forEach((letter: string, letterIndex: number) => {
            let rackIndex = this.gameClientService.getLocalPlayer()?.rack.findIndex((l) => l.value.toUpperCase() === letter.toUpperCase());
            if (rackIndex === -1) {
                rackIndex = this.gameClientService.getLocalPlayer().rack.findIndex((l: Letter) => {
                    l.value === AlphabetLetter.Any;
                });
            }
            if (rackIndex === -1) {
                return;
            }
            if (
                this.confirmedBoard[
                    this.computeCoordFromCoordinate(this.clueWords[index].firstCoordinate) +
                        (this.clueWords[index].isHorizontal ? letterIndex : letterIndex * TOTAL_ROWS)
                ].state !== BoardTileState.Confirmed
            ) {
                this.confirmedBoard[
                    this.computeCoordFromCoordinate(this.clueWords[index].firstCoordinate) +
                        (this.clueWords[index].isHorizontal ? letterIndex : letterIndex * TOTAL_ROWS)
                ].letter = this.gameClientService.getLocalPlayer()?.rack[rackIndex];
            }
        });

        this.clueWords[index].letters = this.clueWords[index].letters.filter((letter: string, letterIndex: number) => {
            return this.confirmedBoard[letterCoords[letterIndex]].state !== BoardTileState.Confirmed;
        });

        this.clueWords[index].letters = this.clueWords[index].letters.map((letter: string) => {
            if (/^[A-Z]*$/.test(letter)) {
                return letter.toLowerCase();
            }
            return letter.toUpperCase();
        });

        this.clientSocketService.send(SocketEvents.PlaceWordCommand, this.clueWords[index]);

        this.clueWords = [];
        this.refreshView();
    }

    private subscribeClue(): void {
        this.clientSocketService.on(SocketEvents.ClueCommand, (words: PlaceWordCommandInfo[]) => {
            this.clueWords = words;
            this.showClueWord(0);
        });
    }

    private subscribeDrag(): void {
        this.clientSocketService.on(SocketEvents.DragEvent, async (event: DragInfos) => {
            if (event.socketId === this.gameClientService.getLocalPlayer()?.player.socketId) return;

            this.dragLetter = {
                roomId: event.roomId,
                socketId: event.socketId,
                letter: event.letter,
                coord: await this.scaleCoord(event.window, event.coord),
                window: [],
            };
        });

        this.clientSocketService.on(SocketEvents.LetterTaken, (event: SimpleLetterInfos) => {
            if (event.socketId === this.gameClientService.getLocalPlayer()?.player.socketId) return;
            if (event.coord === -1) return;
            this.initLiveTile(event.coord);
        });

        this.clientSocketService.on(SocketEvents.LetterPlaced, async (event: SimpleLetterInfos) => {
            if (event.socketId === this.gameClientService.getLocalPlayer()?.player.socketId) return;
            this.dragLetter = undefined;

            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (event.coord >= 0) {
                this.liveBoard[event.coord].state = BoardTileState.Pending;
                this.liveBoard[event.coord].letter.value = event.letter as AlphabetLetter;
            } else {
                this.liveBoard[-event.coord].state = BoardTileState.Empty;
                this.liveBoard[-event.coord].letter.value = AlphabetLetter.None;
            }
        });
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
        return this.gameClientService.getLocalPlayer()?.rack.findIndex((letter) => letter.value === letterTreated.toUpperCase());
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

    private resetBoardState() {
        console.log('resetting board');
        this.origin = undefined;
        this.selectionPositions = [];
        this.placedLetters = [];
        this.clueWords = [];
        this.hasPlacingEnded = false;
        // this.initTiles();
        this.refreshView();
    }

    private refreshView() {
        this.liveBoard = JSON.parse(JSON.stringify(this.confirmedBoard));
    }

    private initTiles(): void {
        this.liveBoard = [];
        this.defaultBoard = [];
        this.confirmedBoard = [];

        let coord = 0;
        BOARD_TILES.forEach((type: BoardTileType) => {
            this.liveBoard.push({
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
        this.defaultBoard = JSON.parse(JSON.stringify(this.liveBoard));
        this.confirmedBoard = JSON.parse(JSON.stringify(this.liveBoard));
    }

    // private isPositionOutOfBound(): boolean {
    //     let outOfBound = false;
    //
    //     this.selectionPositions.forEach((selection: SelectionPosition) => {
    //         if (
    //             this.isTileOutOfBoard(selection.coord) ||
    //             (!this.isTileOnSameRow(selection.coord - 1, selection.coord) && selection.direction === PlayDirection.Right)
    //         ) {
    //             outOfBound = true;
    //         }
    //     });
    //
    //     return outOfBound;
    // }

    // private getArrayIndex(coordinate: Coordinate): number {
    //     const DISPLACEMENT = 1;
    //     return coordinate.x - DISPLACEMENT + (coordinate.y - DISPLACEMENT) * constants.TOTAL_TILES_IN_ROW;
    // }

    private isValidPlacing(coord: number): boolean {
        let validity = false;

        if (this.liveBoard[coord].state === BoardTileState.Confirmed) {
            // TODO : Language
            this.snackBarService.openError('Cannot place over a tile');
            return false;
        }

        if (this.placingMode === PlacingState.Drag && this.placedLetters.length === 0) {
            return true;
        }

        this.selectionPositions.forEach((selection: SelectionPosition) => {
            if (selection.coord === coord) {
                validity = true;
            }
        });

        if (!validity) {
            // TODO : Language
            this.snackBarService.openError('You cannot place a tile here');
        }

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

    private isTileOutOfBoard(coord: number): boolean {
        let invalid = false;
        if (coord > TOTAL_ROWS * TOTAL_COLUMNS - 1) invalid = true;
        if (coord < 0) invalid = true;
        return invalid;
    }

    private isTileOnSameRow(prevCoord: number, coord: number): boolean {
        return Math.floor(prevCoord / TOTAL_COLUMNS) === Math.floor(coord / TOTAL_COLUMNS);
    }

    private isTileOnSameColumn(prevCoord: number, coord: number): boolean {
        return prevCoord % TOTAL_ROWS === coord % TOTAL_ROWS;
    }

    private computeCoordinatesFromCoord(): Coordinate {
        return {
            x: (this.origin % TOTAL_COLUMNS) + 1,
            y: Math.floor(this.origin / TOTAL_ROWS) + 1,
        };
    }

    private computeCoordFromCoordinate(coordinates: Coordinate): number {
        return coordinates.x - 1 + (coordinates.y - 1) * TOTAL_COLUMNS;
    }

    private updateGameBoard(gameBoard: string[]) {
        this.dragLetter = undefined;
        gameBoard.forEach((tile: string, coord: number) => {
            if (!tile) {
                this.liveBoard[coord].letter = {
                    value: AlphabetLetter.None,
                    quantity: undefined,
                    points: undefined,
                };
                this.liveBoard[coord].state = BoardTileState.Empty;
                this.confirmedBoard[coord].letter = {
                    value: AlphabetLetter.None,
                    quantity: undefined,
                    points: undefined,
                };
                this.confirmedBoard[coord].state = BoardTileState.Empty;
                return;
            }

            this.liveBoard[coord].letter.value = tile.toUpperCase() as AlphabetLetter;
            this.liveBoard[coord].state = BoardTileState.Confirmed;
            this.confirmedBoard[coord].letter.value = tile.toUpperCase() as AlphabetLetter;
            this.confirmedBoard[coord].state = BoardTileState.Confirmed;
        });
    }

    private computeNextRightPosition(coord: number, revert: boolean): SelectionPosition {
        if (revert) {
            if (this.placedLetters.length === 1) {
                return this.computeNextRightPosition(this.placedLetters[0].coord, false);
            }

            return { coord, direction: PlayDirection.Right };
        }

        if (this.liveBoard[coord + 1].state === BoardTileState.Confirmed) {
            if (!this.isTileOnSameRow(coord + 1, coord + 2)) {
                return { coord: -1, direction: PlayDirection.Right };
            }
            if (this.isTileOutOfBoard(coord + 2)) {
                return { coord: -1, direction: PlayDirection.Right };
            } else {
                return this.computeNextRightPosition(coord + 1, revert);
            }
        }

        if (!this.isTileOnSameRow(coord, coord + 1)) {
            console.log('On same row');
            return { coord: -1, direction: PlayDirection.Right };
        }
        if (this.isTileOutOfBoard(coord + 1)) {
            return { coord: -1, direction: PlayDirection.Right };
        }

        return { coord: coord + 1, direction: PlayDirection.Right };
    }

    private computeNextDownPosition(coord: number, revert: boolean): SelectionPosition {
        if (revert) {
            if (this.placedLetters.length === 1) {
                return this.computeNextDownPosition(this.placedLetters[0].coord, false);
            }

            return { coord, direction: PlayDirection.Down };
        }

        if (this.liveBoard[coord + TOTAL_COLUMNS].state === BoardTileState.Confirmed) {
            if (!this.isTileOnSameColumn(coord + TOTAL_COLUMNS, coord + TOTAL_COLUMNS * 2)) {
                return { coord: -1, direction: PlayDirection.Down };
            }
            if (this.isTileOutOfBoard(coord + TOTAL_COLUMNS * 2)) {
                return { coord: -1, direction: PlayDirection.Down };
            } else {
                return this.computeNextDownPosition(coord + TOTAL_COLUMNS, revert);
            }
        }

        if (!this.isTileOnSameColumn(coord + TOTAL_COLUMNS, coord + TOTAL_COLUMNS)) {
            return { coord: -1, direction: PlayDirection.Down };
        }
        if (this.isTileOutOfBoard(coord + TOTAL_COLUMNS)) {
            return { coord: -1, direction: PlayDirection.Down };
        }

        return { coord: coord + TOTAL_COLUMNS, direction: PlayDirection.Down };
    }

    private openLetterSelector(): Observable<AlphabetLetter> {
        return this.matDialog
            .open(DialogBoxLetterSelectorComponent, {
                width: 'auto',
                disableClose: true,
            })
            .afterClosed();
    }
}
