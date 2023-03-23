import { RoomPlayer } from '@common/interfaces/room-player';

export interface RoomInformation {
    players: RoomPlayer[];
    roomId: string;
    isCreator: boolean;
    statusGame: string;
    mode: string;
    timer: number;
    botDifficulty?: string;
    dictionary: string;
}
