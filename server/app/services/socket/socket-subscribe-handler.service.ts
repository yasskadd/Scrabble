import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { ChatboxHandlerService } from '@app/services/client-utilities/chatbox-handler.service';
import { GameSessions } from '@app/services/client-utilities/game-sessions.service';
import { HomeChatBoxHandlerService } from '@app/services/client-utilities/home-chatbox-handler.service';
import { GamesActionsService } from '@app/services/games-management/games-actions.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { Service } from 'typedi';

@Service()
export class SocketSubscribeHandler {
    constructor(
        private chatBoxHandlerService: ChatboxHandlerService,
        private homeChatBoxHandler: HomeChatBoxHandlerService,
        private gameSessions: GameSessions,
        private gameActions: GamesActionsService,
        private gamesState: GamesStateService,
        private authentication: AuthenticationService,
    ) {}

    initSocketsEvents() {
        this.gameSessions.initSocketEvents();
        this.chatBoxHandlerService.initSocketsEvents();
        this.homeChatBoxHandler.initSocketEvents();
        this.gameActions.initSocketsEvents();
        this.gamesState.initSocketsEvents();
        this.authentication.initSocketsEvents();
    }
}
