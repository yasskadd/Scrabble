import { BoardTileState, BoardTileType } from '@app/models/board-tile';
import { Letter } from '@common/interfaces/letter';

export interface BoardTileInfo {
    type: BoardTileType;
    state: BoardTileState;
    letter: Letter;
    coord: number;
}
