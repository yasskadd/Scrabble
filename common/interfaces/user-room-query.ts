import { IUser } from './user';

export interface UserRoomQuery {
    roomId: string;
    user: IUser;
    password?: string;
}
