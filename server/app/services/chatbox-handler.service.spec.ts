import { SocketEvents } from '@common/socket-events';
import { expect } from 'chai';
import { createServer, Server as HttpServer } from 'http';
// import { AddressInfo } from 'net';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
// import { Server, Socket } from 'socket.io';
// import { io as Client } from 'socket.io-client';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { GameSessions } from './game-sessions.service';
import { SocketManager } from './socket-manager.service';

describe('Chatbox handler service tests', () => {
    let socketManagerStub: SinonStubbedInstance<SocketManager>;
    let chatboxHandlerService: ChatboxHandlerService;
    let gameSessionsHandlerService: SinonStubbedInstance<GameSessions>;
    let httpServer: HttpServer;
    // let io: Server;
    // let clientSocket: Socket;
    // let serverSocket: Socket;
    // let port: number;

    beforeEach(() => {
        socketManagerStub = createStubInstance(SocketManager);
        socketManagerStub.on.resolves();
        chatboxHandlerService = new ChatboxHandlerService(
            socketManagerStub as unknown as SocketManager,
            gameSessionsHandlerService as unknown as GameSessions,
        );

        httpServer = createServer();
        httpServer.listen();
        // port = (httpServer.address() as AddressInfo).port;
        // clientSocket = Client(`http://localhost:${port}`);
        // io.on('connection', (socket) => {
        //     serverSocket = socket;
        // });
        // clientSocket.on('connect', done);
        // io.on('connection', (socket) => {
        //     serverSocket = socket;
        // });
    });

    it('initSocketsEvents() should call the subscribe from the socket Manager', () => {
        chatboxHandlerService.initSocketsEvents();
        // Reason : checking if private method has been called
        // eslint-disable-next-line dot-notation
        expect(socketManagerStub.on.calledOnceWithExactly(SocketEvents.SendMessage, chatboxHandlerService['sendMessage']));
        // Reason : checking if private method has been called
        // eslint-disable-next-line dot-notation
        expect(socketManagerStub.on.calledOnceWithExactly(SocketEvents.Disconnect, chatboxHandlerService['disconnectEvent']));
    });

    // it('sendMessage() should send a message to the socket with the socket.id', () => {
    //     const TEST_MESSAGE = '4AM here -_-';
    //     // Reason : checking if private method has been called
    //     // eslint-disable-next-line dot-notation
    //     const socket = chatboxHandlerService.sendMessage(clientSocket,TEST_MESSAGE);
    // });
});
