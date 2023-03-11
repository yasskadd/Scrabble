import { BoardTileType, BoardTileState } from '@app/models/board-tile';

export interface BoardTileInfo {
	type: BoardTileType;
	state: BoardTileState;
	letter: string;
}
