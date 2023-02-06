import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

type MessageParameters = { username: string; type: string; message: string; timeStamp: Date };
type HomeRoom = Pick<GameRoom, 'id' | 'isAvailable'> & { userMap: Map<string, string> };
const ROOM_LIMIT = 4;

@Service()
export class HomeChatBoxHandlerService {
    private homeRoom: HomeRoom;
    private messageList: MessageParameters[] = [];
    constructor(public socketManager: SocketManager) {
        this.initGameRoom();
    }

    initSocketEvents(): void {
        this.socketManager.io(SocketEvents.JoinHomeRoom, (sio: Server, socket: Socket, username: string) => {
            this.joinHomeRoom(sio, socket, username);
        });
        this.socketManager.on(SocketEvents.SendHomeMessage, (socket, message: MessageParameters) => {
            if (!this.homeRoom.userMap.has(socket.id)) return; // Maybe not the best way to verify
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

    private initGameRoom(): void {
        const roomID = uuid.v4();
        this.homeRoom = {
            id: roomID,
            userMap: new Map<string, string>(),
            isAvailable: true,
        } as HomeRoom;
    }

    private joinHomeRoom(sio: Server, socket: Socket, username: string): void {
        if (this.userMap.has(socket.id)) {
            this.notifyInvalidUsername(socket, username);
            return;
        }
        if (!this.homeRoom.isAvailable) {
            this.notifyClientFullRoom(socket);
            return;
        }
        this.userMap.set(socket.id, username);
        socket.join(this.homeRoom.id);
        this.notifyUserJoinedRoom(sio, username, this.homeRoom.id);
        this.setIsAvailable();
    }

    private setIsAvailable(): void {
        this.homeRoom.isAvailable = this.homeRoom.userMap.size < ROOM_LIMIT;
    }

    // Notify sender
    private notifyInvalidUsername(socket: Socket, username: string): void {
        socket.emit(SocketEvents.usernameTaken, username);
    }

    private notifyClientFullRoom(socket: Socket): void {
        socket.emit(SocketEvents.RoomIsFull);
    }

    // Notify everyone except sender
    private broadCastMessage(socket: Socket, message: MessageParameters): void {
        // TODO: Send message with username (need to decide which format)
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.BroadCastMessageHome, this.homeRoom.userMap.get(socket.id));
    }

    private leaveRoom(socket: Socket): void {
        const username = this.userMap.get(socket.id);
        socket.leave(this.homeRoom.id);
        this.userMap.delete(socket.id);
        this.setIsAvailable();
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.userLeftHomeRoom, username);
    }

    // Notify everyone
    private notifyUserJoinedRoom(sio: Server, username: string, roomID: string): void {
        sio.sockets.to(roomID).emit(SocketEvents.JoinedHomeRoom, username);
    }

    // Getters and setters
    get userMap(): Map<string, string> {
        return this.homeRoom.userMap;
    }
}
