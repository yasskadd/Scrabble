import { IUser } from './user';

export interface ViewUpdateInfo {
    gameboard: string[];
    activePlayer: IUser | undefined;
}
