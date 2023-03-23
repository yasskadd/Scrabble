import { GameVisibility } from '../models/game-visibility';
import { GameRoomState } from '../models/game-room-state';
import { GameMode } from '../models/game-mode';
import { RoomPlayer } from './room-player';

export interface GameRoom {
    id: string;
    players: RoomPlayer[];
    socketIds: string[];
    dictionary: string;
    timer: number;
    mode: GameMode;
    state: GameRoomState;
    visibility: GameVisibility;
    password: string;
    // TODO : Add ChatRoom interface
    // chatRoom: ChatRoom;
}
