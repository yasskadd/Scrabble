import { IUser } from '@common/interfaces/user';
import { GameVisibility } from '@common/models/game-visibility';

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
