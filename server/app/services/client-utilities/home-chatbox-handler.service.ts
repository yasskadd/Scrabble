import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

type MessageParameters = { username: string; type: string; message: string; timeStamp: Date };
type HomeRoom = Pick<GameRoom, 'id' | 'isAvailable'> & { userMap: Map<string, string>; usernameSet: Set<string> };

const ROOM_LIMIT = 1000;

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
        this.socketManager.on(SocketEvents.SendMessageHome, (socket, message: MessageParameters) => {
            if (!this.userMap.has(socket.id)) return; // Maybe not the best way to verify
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
	console.log(username + " has joined.");
        this.userMap.set(socket.id, username);
        this.usernameSet.add(username);
        socket.join(this.homeRoom.id);
        this.notifyUserConnected(socket, username);
        this.notifyUserJoinedRoom(sio, username, this.homeRoom.id);
        this.setIsAvailable();
    }

    private setIsAvailable(): void {
        this.homeRoom.isAvailable = this.userMap.size < ROOM_LIMIT;
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
	console.log("Message received : " + message.message);
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.BroadCastMessageHome, message);
    }

    private leaveRoom(socket: Socket): void {
        const username = this.userMap.get(socket.id);
	console.log(username + " left the room");
        socket.leave(this.homeRoom.id);
        this.userMap.delete(socket.id);
        this.usernameSet.delete(username as string);
        this.setIsAvailable();
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.userLeftHomeRoom, username);
    }

    // Notify user
    private notifyUserConnected(socket: Socket, username: string): void {
        socket.emit(SocketEvents.UserConnected, username);
    }

    // Notify everyone
    private notifyUserJoinedRoom(sio: Server, username: string, roomID: string): void {
        sio.sockets.to(roomID).emit(SocketEvents.UserJoinedRoom, username);
    }

    // Getters and setters
    get userMap(): Map<string, string> {
        return this.homeRoom.userMap;
    }

    get usernameSet(): Set<string> {
        return this.homeRoom.usernameSet;
    }
}
