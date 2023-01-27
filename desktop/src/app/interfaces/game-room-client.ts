export interface GameRoomClient {
    id: string;
    users: string[];
    dictionary: string;
    timer: number;
    mode: string;
}
