import { SECRET_KEY } from '@app/../very-secret-file';
import * as cookie from 'cookie';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { CallbackSignature, OnSioCallbackSignature } from '@app/types/sockets';

@Service()
export class SocketManager {
    private socketUsernameMap: Map<io.Socket, string>;
    private onEvents: Map<string, CallbackSignature[]>;
    private onAndSioEvents: Map<string, OnSioCallbackSignature[]>;
    private sio: io.Server;

    constructor() {
        this.onEvents = new Map<string, CallbackSignature[]>();
        this.onAndSioEvents = new Map<string, OnSioCallbackSignature[]>();
        this.socketUsernameMap = new Map<io.Socket, string>();
    }

    init(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    on(event: string, callback: CallbackSignature) {
        if (!this.onEvents.has(event)) {
            this.onEvents.set(event, []);
        }
        const onElement = this.onEvents.get(event) as CallbackSignature[];
        onElement.push(callback);
    }

    io(event: string, callback: OnSioCallbackSignature) {
        if (!this.onAndSioEvents.has(event)) {
            this.onAndSioEvents.set(event, []);
        }
        const onElement = this.onAndSioEvents.get(event) as OnSioCallbackSignature[];
        onElement.push(callback);
    }

    getSocketFromId(socketId: string): io.Socket | undefined {
        for (const [socket] of this.socketUsernameMap) {
            if (socket.id === socketId) {
                return socket;
            }
        }

        return undefined;
    }

    emitRoom(room: string, event: string, ...args: unknown[]) {
        this.sio.to(room).emit(event, ...args);
    }

    modifyUsername(oldUsername: string, newUsername: string): void {
        this.socketUsernameMap.forEach((value: string, key: io.Socket) => {
            if (value === oldUsername) {
                this.socketUsernameMap.set(key, newUsername);
                return;
            }
        });
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            if (socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie;
                // Verify jwt token
                const token = cookie.parse(cookies).session_token;
                let isTokenValid = false;
                let username = '';
                jwt.verify(token, SECRET_KEY, (err: jwt.VerifyErrors, decoded: any) => {
                    if (err) isTokenValid = false;
                    else {
                        isTokenValid = true;
                        username = decoded.name;
                    }
                });

                if (!isTokenValid || this.socketUsernameMap.has(socket)) {
                    socket.disconnect();
                    return;
                }

                this.socketUsernameMap.set(socket, username);

                // eslint-disable-next-line no-console
                console.log('Connection of authenticated client with id = ' + socket.id + ' from : ' + socket.handshake.headers.host);
            } else {
                socket.disconnect();
                // eslint-disable-next-line no-console
                console.log('Connection failed of client with id = ' + socket.id + ' from : ' + socket.handshake.headers.host);
                return;
            }
            for (const [event, callbacks] of this.onEvents.entries()) {
                for (const callback of callbacks) {
                    socket.on(event, (...args: unknown[]) => callback(socket, ...args));
                }
            }

            for (const [event, callbacks] of this.onAndSioEvents.entries()) {
                for (const callback of callbacks) {
                    socket.on(event, (...args: unknown[]) => callback(this.sio, socket, ...args));
                }
            }
            socket.on('disconnect', () => {
                if (this.socketUsernameMap.has(socket)) {
                    this.socketUsernameMap.delete(socket);
                }

                // eslint-disable-next-line no-console
                console.log('Disconnection of client with id = ' + socket.id + ' from : ' + socket.handshake.headers.origin);
            });
        });
    }
}
