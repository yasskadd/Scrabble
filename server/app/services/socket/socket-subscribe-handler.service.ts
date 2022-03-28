import { ChatboxHandlerService } from '@app/services/client-utilities/chatbox-handler.service';
import { GameSessions } from '@app/services/client-utilities/game-sessions.service';
import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { GamesState } from '@app/services/games-management/games-state.service';
import { Service } from 'typedi';

@Service()
export class SocketSubscribeHandler {
    constructor(
        private chatBoxHandlerService: ChatboxHandlerService,
        private gameSessions: GameSessions,
        private gameHandler: GamesHandler,
        private gamesState: GamesState,
    ) {}

    initSocketsEvents() {
        this.gameSessions.initSocketEvents();
        this.chatBoxHandlerService.initSocketsEvents();
        this.gameHandler.initSocketsEvents();
        this.gamesState.initSocketsEvents();
    }
}
