import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Socket } from 'socket.io';
import { Service } from 'typedi';

type MessageParameters = { roomId: string; message: string };
@Service()
export class ChatboxHandlerService {
    constructor(public socketManager: SocketManager) {}

    initSocketsEvents() {
        this.socketManager.on(SocketEvents.SendMessage, (socket, messageInfo: MessageParameters) => {
            this.sendMessage(socket, messageInfo);
        });
    }

    private sendMessage(socket: Socket, messageInfo: MessageParameters) {
        socket.broadcast.to(messageInfo.roomId).emit('gameMessage', `${messageInfo.message}`);
    }
}
