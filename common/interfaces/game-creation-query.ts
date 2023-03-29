import { GameVisibility } from '../models/game-visibility';
import { IUser } from './user';
import { GameMode } from '../models/game-mode';
import { GameDifficulty } from '../models/game-difficulty';

export interface GameCreationQuery {
    user: IUser;
    dictionary: string;
    timer: number;
    mode: GameMode;
    visibility: GameVisibility;
    botDifficulty: GameDifficulty;
    password: string;
}
