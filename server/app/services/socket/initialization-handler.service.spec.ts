import { WaitingRoomService } from '@app/services/client-utilities/waiting-room.service';
import { GamesActionsService } from '@app/services/games-management/games-actions.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { assert } from 'console';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { InitializationHandler } from './initialization-handler.service';

describe('Socket subscribe handler tests', () => {
    let gameSessionsHandlerService: SinonStubbedInstance<WaitingRoomService>;
    let socketSubscribeHandler: InitializationHandler;
    let gamesActionsService: SinonStubbedInstance<GamesActionsService>;
    let gamesStateService: SinonStubbedInstance<GamesStateService>;

    beforeEach(async () => {
        gameSessionsHandlerService = createStubInstance(WaitingRoomService);
        gameSessionsHandlerService.initSocketEvents.resolves();
        gamesActionsService = createStubInstance(GamesActionsService);
        gamesActionsService.initSocketsEvents.resolves();
        gamesStateService = createStubInstance(GamesStateService);
        gamesStateService.initSocketsEvents.resolves();
        socketSubscribeHandler = new InitializationHandler(
            gameSessionsHandlerService as unknown as WaitingRoomService,
            gamesActionsService as unknown as GamesActionsService,
            gamesStateService as unknown as GamesStateService,
        );
    });

    it('initSocketsEvents() should subscribe the rest of the services that uses sockets', () => {
        socketSubscribeHandler.initSocketsEvents();
        assert(gameSessionsHandlerService.initSocketEvents.calledOnce);
        assert(gamesActionsService.initSocketsEvents.calledOnce);
    });
});
