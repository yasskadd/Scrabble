import { IUser } from './user';

export interface GameScrabbleInformation {
    players: IUser[];
    roomId: string;
    timer: number;
    socketId: string[];
    mode: string;
    botDifficulty?: string;
    dictionary: string;
}
