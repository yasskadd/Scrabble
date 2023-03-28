import { Letter } from './letter';
import { RoomPlayer } from './room-player';

export interface PlayerInformation {
    player: RoomPlayer;
    score: number;
    rack: Letter[];
    gameboard: string[];
}
