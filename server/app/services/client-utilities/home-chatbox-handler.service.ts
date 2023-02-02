import { GameRoom } from "@app/interfaces/game-room";
import * as uuid from 'uuid';
import { SocketManager } from "../socket/socket-manager.service";


type HomeRoom = Pick<GameRoom, 'id' | 'users' | 'socketID' | 'isAvailable'>;
export class HomeChatBoxHandler {
    private homeRoom:
    private messageList:

    constructor(public socketManager: SocketManager) {

    }

    private initSocketEvents()

    private initGameRoom() {
        const roomID = uuid.v4();
    }

    private joinHomeRoom()
}