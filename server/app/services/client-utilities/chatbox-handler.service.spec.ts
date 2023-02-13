import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { expect } from 'chai';
import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import * as sinon from 'sinon';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { ChatboxHandlerService } from './chatbox-handler.service';

type SioSignature = SocketManager['sio'];
describe('Chatbox handler service tests', () => {
    let socketManagerStub: SinonStubbedInstance<SocketManager>;
    let chatboxHandlerService: ChatboxHandlerService;
    let httpServer: HttpServer;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: SioSignature;
    let secondSocket: Socket;
    const roomId = '1';

    beforeEach((done) => {
        socketManagerStub = createStubInstance(SocketManager);
        chatboxHandlerService = new ChatboxHandlerService(socketManagerStub as unknown as SocketManager);

        httpServer = createServer();
        sio = new ioServer(httpServer);
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            clientSocket = Client(`http://localhost:${port}`);
            sio.on('connection', (socket) => {
                serverSocket = socket;
            });
            clientSocket.on('connect', done);
        });
    });

    it('initSocketsEvents() should call the subscribe from the socket Manager', () => {
        const sendMessageSpy = sinon.stub(chatboxHandlerService, 'sendMessage' as never);
        chatboxHandlerService.initSocketsEvents();
        socketManagerStub.on.getCall(0).args[1](serverSocket);
        expect(sendMessageSpy.called).to.be.eql(true);
    });

    it('sendMessage() should send a message to the socket with the socket.id', (done) => {
        const TEST_MESSAGE = { roomId: '1', message: '4AM here -_-' };
        serverSocket.join(roomId);
        secondSocket = Client(`http://localhost:${port}`);
        secondSocket.on('connect', done);
        clientSocket.on(SocketEvents.SendMessage, (information) => {
            expect(information).to.be.eql(TEST_MESSAGE);
            done();
        });
        // Reason : testing private method
        // eslint-disable-next-line dot-notation
        chatboxHandlerService['sendMessage'](serverSocket, TEST_MESSAGE);
    });
});
