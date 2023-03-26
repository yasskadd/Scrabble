import { IUser } from './user';
import { GameVisibility } from '../models/game-visibility';

export interface GameRoom {
    id: string;
    isAvailable: boolean;
    users: IUser[];
    socketID: string[];
    dictionary: string;
    timer: number;
    mode: string;
    visibility: GameVisibility;
    password: string;
}
