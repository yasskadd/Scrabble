import { AlphabetLetter } from '@app/models/alphabet-letter';
import { BoardTileState, BoardTileType } from '@app/models/board-tile';

export interface BoardTileInfo {
    content: AlphabetLetter;
    type: BoardTileType;
    state: BoardTileState;
    letter: string;
}
