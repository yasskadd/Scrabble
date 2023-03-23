import { IUser } from './user';
import { PlayerType } from '../models/player-type';

export interface RoomPlayer {
    user: IUser;
    roomId: string;
    type?: PlayerType;
    isCreator?: boolean;
}
