import { RoomPlayer } from '@common/interfaces/room-player';
import { GameRoomState } from '@common/models/game-room-state';

export interface RoomInformation {
    players: RoomPlayer[];
    roomId: string;
    statusGame: GameRoomState;
    mode: string;
    timer: number;
    botDifficulty?: string;
    dictionary: string;
}
