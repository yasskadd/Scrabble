export interface GameRoom {
    id: string;
    isAvailable: boolean;
    users: string[];
    socketID: string[];
    dictionary: string;
    timer: number;
    mode: string;
}
