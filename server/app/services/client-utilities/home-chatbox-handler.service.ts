/* eslint-disable no-console */
import { GameRoom } from '@app/interfaces/game-room';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import * as uuid from 'uuid';

type MessageParameters = { username: string; message: string };
type HomeRoom = Pick<GameRoom, 'id' | 'socketID' | 'isAvailable'> & { userSet: Set<string> };
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
            if (!this.homeRoom.userSet.has(message.username)) return; // Maybe not the best way to verify
            console.log(`Message sent from ${message.username} : ${message.message}`);
            this.messageList.push(message);
            console.log(socket.rooms);
            console.log(this.homeRoom.id);
            this.broadCastMessage(socket, message);
        });
    }

    private initGameRoom() {
        const roomID = uuid.v4();
        this.homeRoom = {
            id: roomID,
            userSet: new Set<string>() as Set<string>,
            socketID: [],
            isAvailable: true,
        } as HomeRoom;
    }

    private joinHomeRoom(sio: Server, socket: Socket, username: string) {
        if (this.homeRoom.isAvailable && !this.homeRoom.userSet.has(username)) {
            this.homeRoom.userSet.add(username);
            this.homeRoom.socketID.push(socket.id);
            socket.join(this.homeRoom.id);
            this.userJoinedRoom(sio, username, this.homeRoom.id);
            if (this.homeRoom.userSet.size === ROOM_LIMIT) this.homeRoom.isAvailable = false;
            console.log(`${username} joined the room: ${this.homeRoom.id}`);
            console.log(`There is ${this.homeRoom.userSet.size} / 4 users connected`);
            console.log('Here are the connected users:');
            console.log(this.homeRoom.userSet);
            return;
        }
        // Implement sockets to give feedback of full room to client
        this.notifyClientFullRoom(socket);
    }

    // Method to notify clients that someone joined the room
    private userJoinedRoom(sio: Server, username: string, roomID: string) {
        sio.sockets.to(roomID).emit(SocketEvents.JoinedHomeRoom, username);
    }

    private notifyClientFullRoom(socket: Socket) {
        console.log('Room is FULL');
        socket.emit(SocketEvents.RoomIsFull);
    }

    private broadCastMessage(socket: Socket, message: MessageParameters) {
        socket.broadcast.to(this.homeRoom.id).emit(SocketEvents.BroadCastMessageHome, message.username);
    }
}
