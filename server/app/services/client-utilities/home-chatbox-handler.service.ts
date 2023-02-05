import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

type MessageParameters = { socketID: string; message: string };
type HomeRoom = Pick<GameRoom, 'id' | 'isAvailable'> & { userMap: Map<string, string> };
const ROOM_LIMIT = 4;

@Service()
export class HomeChatBoxHandlerService {
    private homeRoom: HomeRoom;
    private messageList: MessageParameters[] = [];
    constructor(public socketManager: SocketManager) {
        this.initGameRoom();
    }

    initSocketEvents() {
        this.socketManager.io(SocketEvents.JoinHomeRoom, (sio: Server, socket: Socket, username: string) => {
            this.joinHomeRoom(sio, socket, username);
        });

        this.socketManager.on(SocketEvents.SendHomeMessage, (socket, message: MessageParameters) => {
            if (!this.homeRoom.userMap.has(message.socketID)) return; // Maybe not the best way to verify
            this.messageList.push(message);
            this.broadCastMessage(socket, message);
        });

        this.socketManager.on(SocketEvents.LeaveHomeRoom, (socket: Socket) => {
            this.leaveRoom(socket);
        });

        this.socketManager.on(SocketEvents.Disconnect, (socket: Socket) => {
            this.leaveRoom(socket);
        });
    }

    private initGameRoom() {
        const roomID = uuid.v4();
        this.homeRoom = {
            id: roomID,
            userMap: new Map<string, string>(),
            isAvailable: true,
        } as HomeRoom;
    }

    private joinHomeRoom(sio: Server, socket: Socket, username: string) {
        // TODO: Solve problem where 2 users can have the same username
        if (this.homeRoom.isAvailable && !this.homeRoom.userMap.has(socket.id)) {
            this.homeRoom.userMap.set(socket.id, username);
            socket.join(this.homeRoom.id);
            this.userJoinedRoom(sio, username, this.homeRoom.id);
            this.setIsAvailable();
            return;
        }
        // Implement sockets to give feedback of full room to client
        this.notifyClientFullRoom(socket);
        // TODO: Notify client username is already taken if username is already connected in room
    }

    // Method to notify clients that someone joined the room
    private userJoinedRoom(sio: Server, username: string, roomID: string) {
        sio.sockets.to(roomID).emit(SocketEvents.JoinedHomeRoom, username);
    }

    private notifyClientFullRoom(socket: Socket) {
        socket.emit(SocketEvents.RoomIsFull);
    }

    private broadCastMessage(socket: Socket, message: MessageParameters) {
        // TODO: Send message with username (need to decide which format)
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.BroadCastMessageHome, this.homeRoom.userMap.get(message.socketID));
    }

    private leaveRoom(socket: Socket) {
        const username = this.homeRoom.userMap.get(socket.id);
        this.homeRoom.userMap.delete(socket.id);
        this.setIsAvailable();
        socket.leave(this.homeRoom.id);
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.userLeftHomeRoom, username);
    }

    private setIsAvailable() {
        this.homeRoom.isAvailable = this.homeRoom.userMap.size < ROOM_LIMIT;
    }
}
