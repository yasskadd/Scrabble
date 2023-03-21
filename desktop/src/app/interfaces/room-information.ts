import { IUser } from '@common/interfaces/user';

export interface RoomInformation {
    players: IUser[];
    roomId: string;
    isCreator: boolean;
    statusGame: string;
    mode: string;
    timer: number;
    botDifficulty?: string;
    dictionary: string;
}
