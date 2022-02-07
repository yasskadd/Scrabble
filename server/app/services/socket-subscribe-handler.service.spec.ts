import { assert } from 'console';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { GameSessions } from './game-sessions.service';
import { SocketSubscribeHandler } from './socket-subscribe-handler.service';

describe('Socket subscribe handler tests', () => {
    let chatboxHandlerService: SinonStubbedInstance<ChatboxHandlerService>;
    let gameSessionsHandlerService: SinonStubbedInstance<GameSessions>;
    let socketSubscribeHandler: SocketSubscribeHandler;

    beforeEach(async () => {
        chatboxHandlerService = createStubInstance(ChatboxHandlerService);
        chatboxHandlerService.initSocketsEvents.resolves();
        gameSessionsHandlerService = createStubInstance(GameSessions);
        gameSessionsHandlerService.initSocketEvents.resolves();
        socketSubscribeHandler = new SocketSubscribeHandler(
            chatboxHandlerService as unknown as ChatboxHandlerService,
            gameSessionsHandlerService as unknown as GameSessions,
        );
    });

    it('initSocketsEvents() should subscribe the rest of the services that uses sockets', () => {
        socketSubscribeHandler.initSocketsEvents();
        assert(chatboxHandlerService.initSocketsEvents.calledOnce);
        assert(gameSessionsHandlerService.initSocketEvents.calledOnce);
    });
});
