/* eslint-disable dot-notation*/
import { expect } from 'chai';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import * as sinon from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Container } from 'typedi';
import { SocketManager } from './socket-manager.service';

type SocketType = ServerSocket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, unknown>;
type CallbackSignature = (socket: SocketType, ...args: unknown[]) => void;
type OnSioCallbackSignature = (sio: ioServer, socket: SocketType, ...args: unknown[]) => void;

const TEST_ROOM = 'EldenRingHype';
const TEST_MESSAGE = 'RipNoTime';
const EVENT = 'eventTest';
describe('SocketManager service tests', () => {
    let service: SocketManager;
    let httpServer: Server;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: ioServer;

    let joinCallbackOn: CallbackSignature;
    let emitMessageCallbackOn: CallbackSignature;
    let joinCallbackSio: OnSioCallbackSignature;
    let emitMessageCallbackSio: OnSioCallbackSignature;
    let changeBooleanCallbackOn: CallbackSignature;
    let changeBooleanCallbackSio: OnSioCallbackSignature;
    let testBoolean1: boolean;
    let testBoolean2: boolean;

    beforeEach((done) => {
        joinCallbackOn = (socket) => socket.join(TEST_ROOM);
        emitMessageCallbackOn = (socket) => socket.emit(TEST_MESSAGE);
        joinCallbackSio = (o, socket) => {
            socket.join(TEST_ROOM);
            o.to(TEST_ROOM).emit(TEST_MESSAGE);
        };
        emitMessageCallbackSio = (o, socket) => {
            socket.emit(TEST_ROOM);
            o.to(TEST_ROOM).emit(TEST_MESSAGE);
        };
        service = Container.get(SocketManager);
        httpServer = createServer();
        service.init(httpServer);
        sio = service['sio'];
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            clientSocket = Client(`http://localhost:${port}`);
            sio.on('connection', (socket) => {
                serverSocket = socket;
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        sio.close();
        clientSocket.close();
        sinon.restore();
    });

    it('on() should create a callback array if empty and add a callback in the array in onEvents', () => {
        service.on('event', joinCallbackOn);

        const callBackEventArray = service['onEvents'].get('event');
        expect(callBackEventArray).to.not.equal(undefined);
        expect(callBackEventArray?.pop()).to.equal(joinCallbackOn);
    });

    it('on() should add a callback in the array if the event array exists in onEvents', () => {
        service.on('event', joinCallbackOn);
        service.on('event', emitMessageCallbackOn);

        const callBackEventArray = service['onEvents'].get('event');
        expect(callBackEventArray?.pop()).to.be.equal(emitMessageCallbackOn);
        expect(callBackEventArray?.pop()).to.be.equal(joinCallbackOn);
    });

    it('io() should create a callback array if empty and add a callback in the array in onAndSioEvents', () => {
        service.io('event', joinCallbackSio);

        const callBackEventArray = service['onAndSioEvents'].get('event');
        expect(callBackEventArray).to.not.equal(undefined);
        expect(callBackEventArray?.pop()).to.equal(joinCallbackSio);
    });

    it('io() should add a callback in the array if the event array exists in onAndSioEvents', () => {
        service.io('event', joinCallbackSio);
        service.io('event', emitMessageCallbackSio);

        const callBackEventArray = service['onAndSioEvents'].get('event');
        expect(callBackEventArray?.pop()).to.be.equal(emitMessageCallbackSio);
        expect(callBackEventArray?.pop()).to.be.equal(joinCallbackSio);
    });
    it('handleSockets() should subscribe all the events to the sockets', (done) => {
        testBoolean1 = false;
        testBoolean2 = false;

        clientSocket = Client(`http://localhost:${port}`);
        // Reason : it is used in our tests
        // eslint-disable-next-line no-unused-vars
        changeBooleanCallbackOn = (_) => {
            testBoolean1 = true;
            expect(testBoolean1).to.be.equal(true);
        };

        // Reason : it is used in our tests
        // eslint-disable-next-line no-unused-vars
        changeBooleanCallbackSio = (i, _) => {
            testBoolean2 = true;
            expect(testBoolean2).to.be.equal(true);
            done();
        };
        service.handleSockets();
        const addr = httpServer.address() as AddressInfo;
        port = addr.port;

        service.io(EVENT, changeBooleanCallbackSio);

        service.on(EVENT, changeBooleanCallbackOn);

        clientSocket.emit(EVENT);
    });

    it('emitRoom() should send information to the room', (done) => {
        const ROOM = '0';
        const EVENT_TEST = 'TEST';
        const INFORMATION = 'NO TIME';

        serverSocket.join(ROOM);
        clientSocket.on(EVENT_TEST, (information) => {
            expect(information).to.be.equal(INFORMATION);
            clientSocket.close();
            done();
        });
        service['emitRoom'](ROOM, EVENT_TEST, INFORMATION);
    });
});
