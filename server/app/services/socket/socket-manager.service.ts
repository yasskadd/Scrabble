import { SECRET_KEY } from '@app/../very-secret-file';
import { AccountStorageService } from '@app/services/database/account-storage.service';
import { CallbackSignature, OnSioCallbackSignature } from '@app/types/sockets';
import { SocketEvents } from '@common/constants/socket-events';
import { HistoryActions } from '@common/models/history-actions';
import * as cookie from 'cookie';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import * as io from 'socket.io';
import { Service } from 'typedi';

@Service()
export class SocketManager {
    server: io.Server;

    private socketIdMap: Map<io.Socket, string>;
    private onEvents: Map<string, CallbackSignature[]>;
    private onAndSioEvents: Map<string, OnSioCallbackSignature[]>;
    private onConnectEvents: CallbackSignature[];
    private onDisconnectEvents: CallbackSignature[];

    constructor(private accountStorageService: AccountStorageService) {
        this.onEvents = new Map<string, CallbackSignature[]>();
        this.onAndSioEvents = new Map<string, OnSioCallbackSignature[]>();
        this.socketIdMap = new Map<io.Socket, string>();
        this.onConnectEvents = [];
        this.onDisconnectEvents = [];
    }

    init(server: http.Server) {
        this.server = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    on(event: string, callback: CallbackSignature) {
        if (!this.onEvents.has(event)) {
            this.onEvents.set(event, []);
        }
        const onElement = this.onEvents.get(event) as CallbackSignature[];
        onElement.push(callback);
    }

    onConnect(callback: CallbackSignature) {
        this.onConnectEvents.push(callback);
    }

    onDisconnect(callback: CallbackSignature) {
        this.onDisconnectEvents.push(callback);
    }

    io(event: string, callback: OnSioCallbackSignature) {
        if (!this.onAndSioEvents.has(event)) {
            this.onAndSioEvents.set(event, []);
        }
        const onElement = this.onAndSioEvents.get(event) as OnSioCallbackSignature[];
        onElement.push(callback);
    }

    getSocketFromId(socketId: string): io.Socket | undefined {
        for (const [socket] of this.socketIdMap) {
            if (socket.id === socketId) {
                return socket;
            }
        }

        return undefined;
    }

    getUserIdFromSocket(socket: io.Socket): string | undefined {
        return this.socketIdMap.get(socket);
    }

    deleteRoom(room: string) {
        this.server.sockets.in(room).socketsLeave(room);
    }

    emitRoom(room: string, event: string, ...args: unknown[]) {
        this.server.to(room).emit(event, ...args);
    }

    modifyUsername(oldUsername: string, newUsername: string): void {
        this.socketIdMap.forEach((value: string, key: io.Socket) => {
            if (value === oldUsername) {
                this.socketIdMap.set(key, newUsername);
                return;
            }
        });
    }

    handleSockets(): void {
        this.server.on('connection', (socket) => {
            if (!socket.handshake.headers.cookie) {
                socket.disconnect();
                // eslint-disable-next-line no-console
                console.log('Connection failed of client with id = ' + socket.id + ' from : ' + socket.handshake.headers.host);
                return;
            }

            const cookies = socket.handshake.headers.cookie;
            // Verify jwt token
            const token = cookie.parse(cookies).session_token;
            let isTokenValid = false;
            let userID = '';
            jwt.verify(token, SECRET_KEY, (err: jwt.VerifyErrors, decoded: any) => {
                if (err) isTokenValid = false;
                else {
                    isTokenValid = true;
                    // eslint-disable-next-line no-underscore-dangle
                    userID = decoded.userID;
                }
            });

            if (!isTokenValid || this.socketIdMap.has(socket)) {
                socket.disconnect();
                return;
            }

            let keepConnecting = true;
            this.socketIdMap.forEach((value: string) => {
                if (value === userID) {
                    keepConnecting = false;
                }
            });
            if (!keepConnecting) {
                socket.emit(SocketEvents.UserAlreadyConnected);
                return;
            }

            this.socketIdMap.set(socket, userID);

            for (const callback of this.onConnectEvents) {
                callback(socket);
            }

            this.accountStorageService.addUserEventHistory(userID, HistoryActions.Connection, new Date());

            // eslint-disable-next-line no-console
            console.log('Connection of client with socketid = ' + socket.id + ' from user = ' + userID);
            socket.emit(SocketEvents.SuccessfulConnection);

            for (const [event, callbacks] of this.onEvents.entries()) {
                for (const callback of callbacks) {
                    socket.on(event, (...args: unknown[]) => callback(socket, ...args));
                }
            }

            for (const [event, callbacks] of this.onAndSioEvents.entries()) {
                for (const callback of callbacks) {
                    socket.on(event, (...args: unknown[]) => callback(this.server, socket, ...args));
                }
            }

            socket.on('disconnect', () => {
                for (const callback of this.onDisconnectEvents) {
                    callback(socket);
                }

                if (this.socketIdMap.has(socket)) {
                    this.accountStorageService.addUserEventHistory(this.socketIdMap.get(socket) as string, HistoryActions.Logout, new Date());
                    this.socketIdMap.delete(socket);
                }

                // eslint-disable-next-line no-console
                console.log('Disconnection of client with id = ' + socket.id + ' from : ' + socket.handshake.headers.origin);
                // eslint-disable-next-line no-console
                console.log(this.socketIdMap.values());
            });
        });
    }
}
