import { IUser } from '@common/interfaces/user';

export interface GameParameters {
    user: IUser;
    dictionary: string;
    timer: number;
    mode: string;
    isMultiplayer: boolean;
    opponents?: IUser[];
    botDifficulty?: string;
}
