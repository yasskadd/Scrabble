import { IUser } from './user';

export interface JoinGameRoomParameters {
    roomId: string;
    player: IUser;
    password?: string;
}
