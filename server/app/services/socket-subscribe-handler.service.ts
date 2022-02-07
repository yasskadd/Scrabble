import { Service } from 'typedi';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { GameSessions } from './game-sessions.service';

@Service()
export class SocketSubscribeHandler {
    constructor(private chatBoxHandlerService: ChatboxHandlerService, private gameSessions: GameSessions) {}

    initSocketsEvents() {
        this.gameSessions.initSocketEvents();
        this.chatBoxHandlerService.initSocketsEvents();
        // Ajouter le reste des services qui utilisent des sockets ici!
    }
}
