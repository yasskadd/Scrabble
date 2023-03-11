import { Component } from '@angular/core';
import { BoardTileInfo } from '@app/interfaces/board-tile-info';
import { BOARD_TILES } from '@app/constants/board-tiles';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.scss'],
})
export class GameBoardComponent {
    protected boardTiles: BoardTileInfo[];

    constructor() {
        this.boardTiles = [];
        BOARD_TILES.forEach((type: BoardTileType) => {
            this.boardTiles.push({ type, state: BoardTileState.Empty, letter: '' });
        });
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
}
