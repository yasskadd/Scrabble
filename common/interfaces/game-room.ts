import { GameVisibility } from '../models/game-visibility';
import { GameRoomState } from '../models/game-room-state';
import { GameMode } from '../models/game-mode';
import { RoomPlayer } from './room-player';
import { GameDifficulty } from '../models/game-difficulty';

export interface GameRoom {
    id: string;
    players: RoomPlayer[];
    dictionary: string;
    timer: number;
    mode: GameMode;
    state: GameRoomState;
    visibility: GameVisibility;
    password: string;
    difficulty: GameDifficulty;
    // TODO : Add ChatRoom interface
    // chatRoom: ChatRoom;
}
