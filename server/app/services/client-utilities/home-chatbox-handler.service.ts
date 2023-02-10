import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';
import { ChatboxMessage } from '@common/interfaces/chatbox-message';

type HomeRoom = Pick<GameRoom, 'id' | 'isAvailable'> & { userMap: Map<string, string>; usernameSet: Set<string> };
const ROOM_LIMIT = 3;

@Service()
export class HomeChatBoxHandlerService {
    private homeRoom: HomeRoom;
    private messageList: ChatboxMessage[];

    constructor(public socketManager: SocketManager) {
        this.messageList = [];
        this.initGameRoom();
    }

    initSocketEvents(): void {
        this.socketManager.io(SocketEvents.JoinHomeRoom, (sio: Server, socket: Socket, username: string) => {
            this.joinHomeRoom(sio, socket, username);
        });
        this.socketManager.on(SocketEvents.SendMessageHome, (socket, message: ChatboxMessage) => {
            if (!this.userMap.has(socket.id)) return; // Maybe not the best way to verify
            this.messageList.push(message);
            this.broadCastMessage(socket, message);
        });
        this.socketManager.io(SocketEvents.UserLeftRoom, (sio: Server, socket: Socket) => {
            this.leaveRoom(sio, socket);
        });
        this.socketManager.io(SocketEvents.Disconnect, (sio: Server, socket: Socket) => {
            this.leaveRoom(sio, socket);
        });
    }

    private initGameRoom(): void {
        const roomID = uuid.v4();
        this.homeRoom = {
            id: roomID,
            userMap: new Map<string, string>(),
            isAvailable: true,
            usernameSet: new Set(),
        } as HomeRoom;
    }

    private joinHomeRoom(sio: Server, socket: Socket, username: string): void {
        if (this.userMap.has(socket.id)) return; // Because already connected
        if (this.usernameSet.has(username)) {
            this.notifyInvalidUsername(socket, username);
            return;
        }
        if (!this.homeRoom.isAvailable) {
            this.notifyClientFullRoom(socket);
            return;
        }
        this.userMap.set(socket.id, username);
        this.usernameSet.add(username);
        socket.join(this.homeRoom.id);
        this.notifyUserJoinedRoom(sio, username, this.homeRoom.id);
        this.setIsAvailable();
    }

    private setIsAvailable(): void {
        this.homeRoom.isAvailable = this.userMap.size < ROOM_LIMIT;
    }

    // Notify sender
    private notifyInvalidUsername(socket: Socket, username: string): void {
        socket.emit(SocketEvents.UsernameTaken, username);
    }

    private notifyClientFullRoom(socket: Socket): void {
        socket.emit(SocketEvents.RoomIsFull);
    }

    // Notify everyone except sender
    private broadCastMessage(socket: Socket, message: ChatboxMessage) {
        // TODO: Send message with username (need to decide which format)
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.SendHomeMessage, message);
    }

    private leaveRoom(sio: Server, socket: Socket): void {
        const username: string = this.userMap.get(socket.id) as string;
        this.userMap.delete(socket.id);
        this.usernameSet.delete(username);
        this.setIsAvailable();
        this.notifyUserQuittedRoom(sio, username, this.homeRoom.id);
        // socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.UserLeftHomeRoom, username);
        socket.leave(this.homeRoom.id);
    }

    // Notify everyone
    private notifyUserJoinedRoom(sio: Server, username: string, roomID: string): void {
        sio.sockets.to(roomID).emit(SocketEvents.UserJoinedRoom, username);
    }

    private notifyUserQuittedRoom(sio: Server, username: string, roomID: string): void {
        sio.sockets.to(roomID).emit(SocketEvents.UserLeftHomeRoom, username);
    }

    // Getters and setters
    get userMap(): Map<string, string> {
        return this.homeRoom.userMap;
    }

    get usernameSet(): Set<string> {
        return this.homeRoom.usernameSet;
    }
}
