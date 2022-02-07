import { SocketEvents } from '@common/socket-events';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { GameSessions } from './game-sessions.service';
import { SocketManager } from './socket-manager.service';

type MessageParameters = { roomId: string; message: string };
@Service()
export class ChatboxHandlerService {
    constructor(public socketManager: SocketManager, private gameSession: GameSessions) {}

    initSocketsEvents() {
        this.socketManager.on(SocketEvents.SendMessage, this.sendMessage);

        this.socketManager.on(SocketEvents.Disconnect, (socket) => {
            const roomId = this.gameSession.getRoomId(socket.id);
            if (roomId != null) {
                socket.broadcast.to(roomId).emit('user disconnect');
                this.gameSession.removeRoom(roomId);
            }
            this.gameSession.removeUserFromActiveUsers(socket.id);
        });

        // this.socketManager.on(SocketEvents.Disconnect, this.disconnectEvent);

        // this.socketManager.on(SocketEvents.GameCommand, (socket, command: string) => {
        //     console.log(command);
        // });
        // Exemple de .io
        // this.socketManager.io('roomMessage', (io, socket, message) => {
        //     socket.emit('test');
        //     io.to('room').emit('test', message); // io est la meme chose que .sio du coté socketManager
        // });
    }

    // private disconnectEvent(socket: Socket) {
    //     const roomId = this.gameSession.getRoomId(socket.id);
    //     if (roomId != null) {
    //         socket.broadcast.to(roomId).emit('user disconnect');
    //         this.gameSession.removeRoom(roomId);
    //     }
    //     this.gameSession.removeUserFromActiveUsers(socket.id);
    // }
    private sendMessage(socket: Socket, messageInfo: MessageParameters) {
        socket.broadcast.to(messageInfo.roomId).emit('gameMessage', `${messageInfo.message}`);
    }
}
