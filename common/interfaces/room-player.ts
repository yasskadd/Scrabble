import { IUser } from './user';
import { PlayerType } from '../models/player-type';

export interface RoomPlayer {
    user: IUser;
    socketId: string;
    roomId: string;
    type?: PlayerType;
    isCreator?: boolean;
}
