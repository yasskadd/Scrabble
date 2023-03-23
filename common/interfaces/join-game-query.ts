import { IUser } from './user';

export interface JoinGameQuery {
    roomId: string;
    user: IUser;
    password?: string;
}
