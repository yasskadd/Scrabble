import { GameRoom } from "@app/interfaces/game-room";
import { Service } from 'typedi';
import * as uuid from 'uuid';
import { SocketManager } from "../socket/socket-manager.service";

type MessageParameters = { roomId: string, message: string }
type HomeRoom = Pick<GameRoom, 'id' | 'users' | 'socketID' | 'isAvailable'>;

@Service()
export class HomeChatBoxHandler {
    private homeRoom: HomeRoom;
    private messageMap = new Map<string, MessageParameters>()
    constructor(public socketManager: SocketManager) {}

    private initSocketEvents()

    private initGameRoom() {
        const roomID = uuid.v4();
        this.homeRoom = {
            id: roomID,
            users: [],
            socketID: [],
            isAvailable: true,
        } as HomeRoom
    }

    private joinHomeRoom()
}