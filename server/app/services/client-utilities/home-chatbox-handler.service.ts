import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

// type MessageParameters = { roomId: string; message: string };
type HomeRoom = Pick<GameRoom, 'id' | 'users' | 'socketID' | 'isAvailable'>;
const ROOM_LIMIT = 4;

@Service()
export class HomeChatBoxHandlerService {
    private homeRoom: HomeRoom;
    // private messageList = [];
    constructor(public socketManager: SocketManager) {
        this.initGameRoom();
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.JoinHomeRoom, (sio: Server, socket: Socket, username: string) => {
            this.joinHomeRoom(sio, socket, username);
        });
    }

    private initGameRoom() {
        const roomID = uuid.v4();
        this.homeRoom = {
            id: roomID,
            users: [],
            socketID: [],
            isAvailable: true,
        } as HomeRoom;
    }

    private joinHomeRoom(sio: Server, socket: Socket, username: string) {
        if (this.homeRoom.isAvailable) {
            this.homeRoom.users.push(username);
            this.homeRoom.socketID.push(socket.id);
            socket.join(this.homeRoom.id);
            this.userJoinedRoom(sio, username, this.homeRoom.id);
            if (this.homeRoom.users.length === ROOM_LIMIT) this.homeRoom.isAvailable = false;
            console.log(`${username} joined the room: ${this.homeRoom.id}`);
        }
        // Implement sockets to give feedback of full room to client
    }

    // Method to notify clients that someone joined the room
    private userJoinedRoom(sio: Server, username: string, roomID: string) {
        sio.sockets.to(roomID).emit(SocketEvents.JoinedHomeRoom, username);
    }
}
