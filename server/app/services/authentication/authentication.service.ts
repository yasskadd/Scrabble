import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Socket } from 'socket.io';
import { Service } from 'typedi';

const NOT_IN_ARRAY = -1;

@Service()
export class AuthenticationService {
    users: string[];
    constructor(private socketManager: SocketManager) {
        this.users = [];
    }
    initSocketsEvents(): void {
        this.socketManager.on(SocketEvents.SignIn, (socket, userName: string) => {
            this.signIn(socket, userName);
        });

        this.socketManager.on(SocketEvents.SignOut, (socket, userName: string) => {
            this.signOut(socket, userName);
        });
    }

    private signIn(socket: Socket, userName: string) {
        if (this.users.includes(userName)) {
            socket.emit(SocketEvents.SignIn, '');
            return;
        }
        this.users.push(userName);
        socket.emit(SocketEvents.SignIn, 'Connected');
    }

    private signOut(socket: Socket, userName: string) {
        const index = this.users.indexOf(userName, 0);
        if (index > NOT_IN_ARRAY) {
            this.users.splice(index, 1);
            socket.emit(SocketEvents.SignOut, 'Disconnected');
        }
    }
}
