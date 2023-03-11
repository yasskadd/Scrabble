import { Component } from '@angular/core';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';
import { LetterPlacementService } from '@app/services/letter-placement.service';

@Component({
    selector: 'app-game-board',
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.scss'],
})
export class GameBoardComponent {
    protected boardTileStates: typeof BoardTileState = BoardTileState;

    constructor(protected letterPlacementService: LetterPlacementService) {}

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
}
