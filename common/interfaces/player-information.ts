import { Letter } from './letter';
import { LetterTile } from '../classes/letter-tile.class';
import { RoomPlayer } from './room-player';

export interface PlayerInformation {
    player: RoomPlayer;
    score: number;
    rack: Letter[];
    gameboard: LetterTile[];
}
