import * as http from 'http';
import * as io from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Service } from 'typedi';

type SocketType = io.Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, unknown>;
type CallbackSignature = (socket: SocketType, ...args: unknown[]) => void;
type OnSioCallbackSignature = (sio: io.Server, socket: SocketType, ...args: unknown[]) => void;

@Service()
export class SocketManager {
    private onEvents: Map<string, CallbackSignature[]>;
    private onAndSioEvents: Map<string, OnSioCallbackSignature[]>;
    private sio: io.Server;
    constructor() {
        this.onEvents = new Map<string, CallbackSignature[]>();
        this.onAndSioEvents = new Map<string, OnSioCallbackSignature[]>();
    }

    init(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    on(event: string, callback: CallbackSignature) {
        if (!this.onEvents.has(event)) {
            this.onEvents.set(event, []);
        }
        const onElement = this.onEvents.get(event);
        if (onElement !== undefined) {
            onElement.push(callback);
        }
    }
    io(event: string, callback: OnSioCallbackSignature) {
        if (!this.onAndSioEvents.has(event)) {
            this.onAndSioEvents.set(event, []);
        }
        const onElement = this.onAndSioEvents.get(event);
        if (onElement !== undefined) {
            onElement.push(callback);
        }
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            // console.log(`Connexion par l'utilisateur avec id : ${socket.id}`);
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
        });
    }
}
