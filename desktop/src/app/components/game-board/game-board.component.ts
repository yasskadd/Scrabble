import { CdkDragDrop, CdkDragMove } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { CENTER_TILE } from '@app/constants/board-view';
import { BoardTileInfo } from '@app/interfaces/board-tile-info';
import { SelectionPosition } from '@app/interfaces/selection-position';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';
import { PlayDirection } from '@app/models/play-direction';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
import { GameConfigurationService } from '@app/services/game-configuration.service';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Letter } from '@common/interfaces/letter';
import { AlphabetLetter } from '@common/models/alphabet-letter';
import { GameClientService } from '@services/game-client.service';
import { TauriStateService } from '@services/tauri-state.service';
import { window as tauriWindow } from '@tauri-apps/api';
import { TauriEvent } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/window';

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.scss'],
})
export class GameBoardComponent {
    protected boardTileStates: typeof BoardTileState = BoardTileState;
    protected playDirection: typeof PlayDirection = PlayDirection;

    constructor(
        protected letterPlacementService: LetterPlacementService,
        protected clientSocketService: ClientSocketService,
        private gameConfigurationService: GameConfigurationService,
        private gameClientService: GameClientService,
        private tauriStateService: TauriStateService,
    ) {
        if (this.tauriStateService.useTauri) {
            const appWindow = WebviewWindow.getByLabel('main');
            appWindow
                .listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
                    alert('Cannot close while in game');
                })
                .then();
        }
    }

    protected drop(event: CdkDragDrop<Letter[]>, tile: BoardTileInfo): void {
        if (event.previousContainer.id === 'player-rack') {
            this.letterPlacementService.handleDragPlacement(event.previousIndex, event.previousContainer.data[event.previousIndex], tile);
        }

        this.letterPlacementService.initSelection();
    }

    protected entered(event: MouseEvent, tile: BoardTileInfo) {
        const liveTile = this.letterPlacementService.liveBoard[tile.coord];
        if (
            (liveTile.state === BoardTileState.Empty || liveTile.state === BoardTileState.Temp) &&
            !this.letterPlacementService.selectionPositions.find((sp: SelectionPosition) => sp.coord === tile.coord)
        ) {
            this.letterPlacementService.liveBoard[tile.coord] = {
                type: BoardTileType.Empty,
                state: BoardTileState.Temp,
                letter: this.letterPlacementService.currentSelection
                    ? { value: '', quantity: undefined, points: undefined }
                    : this.letterPlacementService.currentSelection,
                coord: tile.coord,
            };
        }
    }

    protected exited() {
        this.letterPlacementService.liveBoard = JSON.parse(JSON.stringify(this.letterPlacementService.confirmedBoard));
    }

    protected async startedDragging(tile: BoardTileInfo): Promise<void> {
        if (!this.gameClientService.currentlyPlaying()) return;
        this.clientSocketService.send(SocketEvents.LetterTaken, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClientService.getLocalPlayer()?.player.socketId,
            coord: tile.coord,
            letter: tile.letter.value.toString(),
        });
    }

    protected stoppedDragging(tile: BoardTileInfo): void {
        this.clientSocketService.send(SocketEvents.LetterPlaced, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClientService.getLocalPlayer()?.player.socketId,
            coord: tile.coord,
            letter: tile.letter.value.toString(),
        });
    }

    protected async dragging(event: CdkDragMove, tile: BoardTileInfo): Promise<void> {
        if (!this.gameClientService.currentlyPlaying()) return;

        const windowSize = await tauriWindow.appWindow.innerSize();
        this.clientSocketService.send(SocketEvents.SendDrag, {
            roomId: this.gameConfigurationService.localGameRoom.id,
            socketId: this.gameClientService.getLocalPlayer()?.player.socketId,
            letter: tile.letter.value.toString(),
            coord: [(event.event as MouseEvent).clientX, (event.event as MouseEvent).clientY],
            window: [windowSize.width, windowSize.height],
        });
    }

    protected identify(index: number, item: { coord: number }): number {
        return item.coord;
    }

    protected getTileText(tileType: BoardTileType): string {
        switch (tileType) {
            // TODO : Language
            case BoardTileType.Center: {
                return '';
            }
            case BoardTileType.DoubleLetter: {
                return 'DOUBLE LETTRE';
            }
            case BoardTileType.DoubleWord: {
                return 'DOUBLE WORD';
            }
            case BoardTileType.TripleLetter: {
                return 'TRIPLE LETTER';
            }
            case BoardTileType.TripleWord: {
                return 'TRIPLE WORD';
            }
            default: {
                return '';
            }
        }
    }

    protected getBackgroundColor(tileType: BoardTileType): any {
        switch (tileType) {
            // TODO : Language
            case BoardTileType.Center: {
                return '#FFEA4F';
            }
            case BoardTileType.DoubleLetter: {
                return '#B9E0FC';
            }
            case BoardTileType.DoubleWord: {
                return '#F49999';
            }
            case BoardTileType.TripleLetter: {
                return '#37A6FA';
            }
            case BoardTileType.TripleWord: {
                return '#D1292A';
            }
            default: {
                return '#BDABA5';
            }
        }
    }

    protected tileEmpty(tile: BoardTileInfo): boolean {
        return tile.letter?.value === AlphabetLetter.None;
    }

    protected showCenterTile(tile: BoardTileInfo): boolean {
        let show = true;

        this.letterPlacementService.selectionPositions.forEach((selectedTile: SelectionPosition) => {
            if (selectedTile.coord === tile.coord) {
                show = false;
            }
        });

        return tile.coord === CENTER_TILE && tile.state === BoardTileState.Empty && show;
    }

    protected isTempTile(state: BoardTileState) {
        return state === BoardTileState.Temp;
    }

    protected isConfirmedTile(state: BoardTileState) {
        return state === BoardTileState.Confirmed;
    }

    protected isPendingTile(state: BoardTileState) {
        return state === BoardTileState.Pending;
    }

    protected isEmptyTile(state: BoardTileState) {
        return state === BoardTileState.Empty;
    }
}
