import * as io from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export type SocketType = io.Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, unknown>;
export type CallbackSignature = (socket: SocketType, ...args: unknown[]) => void;
export type OnSioCallbackSignature = (sio: io.Server, socket: SocketType, ...args: unknown[]) => void;
