import { IUser } from './user';
import { PlayerType } from '../models/player-type';

export interface RoomPlayer {
    player: IUser;
    roomId: string;
    type?: PlayerType;
    isCreator?: boolean;
}
