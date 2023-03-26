import { GameVisibility } from '../models/game-visibility';
import { IUser } from './user';
import { GameMode } from '../models/game-mode';

export interface GameCreationQuery {
    user: IUser;
    dictionary: string;
    timer: number;
    mode: GameMode;
    visibility: GameVisibility;
    password?: string;
    botDifficulty?: string;
}
