import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { ChatHandlerService } from '@app/services/client-utilities/chat-handler.service';
import { WaitingRoomService } from '@app/services/client-utilities/waiting-room.service';
import { GamesActionsService } from '@app/services/games-management/games-actions.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { Service } from 'typedi';

@Service()
export class InitializationHandler {
    constructor(
        private homeChatBoxHandler: ChatHandlerService,
        private gameSessions: WaitingRoomService,
        private gameActions: GamesActionsService,
        private gamesState: GamesStateService,
        private authentication: AuthenticationService,
    ) {}

    initSocketsEvents() {
        this.gameSessions.initSocketEvents();
        this.homeChatBoxHandler.initSocketEvents();
        this.gameActions.initSocketsEvents();
        this.gamesState.initSocketsEvents();
        this.authentication.initSocketsEvents();
    }

    async loadConfig() {
        await this.homeChatBoxHandler.initConfig();
    }
}
