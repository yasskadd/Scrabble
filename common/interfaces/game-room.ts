import { IUser } from './user';
import { GameVisibility } from '../models/game-visibility';
import { GameRoomState } from '../models/game-room-state';
import { GameMode } from '../models/game-mode';

export interface GameRoom {
    id: string;
    users: IUser[];
    socketId: string[];
    dictionary: string;
    timer: number;
    mode: GameMode;
    state: GameRoomState;
    visibility: GameVisibility;
    password: string;
    // TODO : Add ChatRoom interface
    // chatRoom: ChatRoom;
}
