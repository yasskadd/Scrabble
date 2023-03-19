import { IUser } from '@common/interfaces/user';

export interface GameRoom {
    id: string;
    isAvailable: boolean;
    users: IUser[];
    socketID: string[];
    dictionary: string;
    timer: number;
    mode: string;
}
