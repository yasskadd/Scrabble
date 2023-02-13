import { ChatboxHandlerService } from '@app/services/client-utilities/chatbox-handler.service';
import { GameSessions } from '@app/services/client-utilities/game-sessions.service';
import { GamesActionsService } from '@app/services/games-management/games-actions.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { assert } from 'console';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { SocketSubscribeHandler } from './socket-subscribe-handler.service';

describe('Socket subscribe handler tests', () => {
    let chatboxHandlerService: SinonStubbedInstance<ChatboxHandlerService>;
    let gameSessionsHandlerService: SinonStubbedInstance<GameSessions>;
    let socketSubscribeHandler: SocketSubscribeHandler;
    let gamesActionsService: SinonStubbedInstance<GamesActionsService>;
    let gamesStateService: SinonStubbedInstance<GamesStateService>;

    beforeEach(async () => {
        chatboxHandlerService = createStubInstance(ChatboxHandlerService);
        chatboxHandlerService.initSocketsEvents.resolves();
        gameSessionsHandlerService = createStubInstance(GameSessions);
        gameSessionsHandlerService.initSocketEvents.resolves();
        gamesActionsService = createStubInstance(GamesActionsService);
        gamesActionsService.initSocketsEvents.resolves();
        gamesStateService = createStubInstance(GamesStateService);
        gamesStateService.initSocketsEvents.resolves();
        socketSubscribeHandler = new SocketSubscribeHandler(
            chatboxHandlerService as unknown as ChatboxHandlerService,
            gameSessionsHandlerService as unknown as GameSessions,
            gamesActionsService as unknown as GamesActionsService,
            gamesStateService as unknown as GamesStateService,
        );
    });

    it('initSocketsEvents() should subscribe the rest of the services that uses sockets', () => {
        socketSubscribeHandler.initSocketsEvents();
        assert(chatboxHandlerService.initSocketsEvents.calledOnce);
        assert(gameSessionsHandlerService.initSocketEvents.calledOnce);
        assert(gamesActionsService.initSocketsEvents.calledOnce);
    });
});
