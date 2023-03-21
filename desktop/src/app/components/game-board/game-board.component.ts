import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { BoardTileInfo } from '@app/interfaces/board-tile-info';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';
import { PlayDirection } from '@app/models/play-direction';
import { LetterPlacementService } from '@app/services/letter-placement.service';
import { Letter } from '@common/interfaces/letter';
import { AlphabetLetter } from '@common/models/alphabet-letter';

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.scss'],
})
export class GameBoardComponent {
    protected boardTileStates: typeof BoardTileState = BoardTileState;
    protected playDirection: typeof PlayDirection = PlayDirection;

    constructor(protected letterPlacementService: LetterPlacementService) {}

    handleCenterClick(tile: BoardTileInfo): void {
        this.letterPlacementService.rotateDirection(tile);
    }

    protected drop(event: CdkDragDrop<Letter[]>, tile: BoardTileInfo): void {
        if (event.previousContainer.id === 'player-rack') {
            this.letterPlacementService.handleDragPlacement(event.previousIndex, event.previousContainer.data[event.previousIndex], tile);
        }

        this.letterPlacementService.currentSelection = undefined;
    }

    protected entered(event: MouseEvent, tile: BoardTileInfo) {
        if (this.letterPlacementService.boardTiles[tile.coord].state === BoardTileState.Empty) {
            this.letterPlacementService.boardTiles[tile.coord] = {
                type: BoardTileType.Empty,
                state: BoardTileState.Temp,
                letter: this.letterPlacementService.currentSelection,
                coord: tile.coord,
            };
        }
    }

    protected exited(event: MouseEvent, tile: BoardTileInfo) {
        if (this.letterPlacementService.boardTiles[tile.coord].state === BoardTileState.Temp) {
            this.letterPlacementService.resetTile(tile.coord);
        }
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
}
