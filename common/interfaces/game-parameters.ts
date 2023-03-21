import { GameVisibility } from '../models/game-visibility';
import { IUser } from './user';

export interface GameParameters {
    user: IUser;
    dictionary: string;
    timer: number;
    mode: string;
    isMultiplayer: boolean;
    visibility: GameVisibility;
    password?: string;
    opponents?: IUser[];
    botDifficulty?: string;
}
