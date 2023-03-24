import { IUser } from '@common/interfaces/user';

export interface GameRoomClient {
    id: string;
    users: IUser[];
    dictionary: string;
    timer: number;
    mode: string;
}
