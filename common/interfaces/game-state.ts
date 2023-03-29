import { PlayerInformation } from './player-information';
import { IUser } from './user';

export interface GameInfo {
    gameboard: string[];
    players: PlayerInformation[];
    activePlayer?: IUser;
}
