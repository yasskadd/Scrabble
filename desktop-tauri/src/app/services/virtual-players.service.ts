import { Injectable } from '@angular/core';
import { Bot } from '@app/interfaces/bot';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';

type BotNameInfo = { currentName: string; newName: string; difficulty: string };

export enum VirtualPlayer {
    Beginner = 'beginner',
    Expert = 'expert',
}

@Injectable({
    providedIn: 'root',
})
export class VirtualPlayersService {
    beginnerBotNames: Bot[];
    expertBotNames: Bot[];
    botType: VirtualPlayer;
    constructor(private readonly httpHandler: HttpHandlerService) {}

    addBotName(newName: string, type: VirtualPlayer) {
        this.httpHandler
            .addBot({ username: newName, difficulty: type === VirtualPlayer.Beginner ? 'debutant' : 'Expert' })
            .toPromise()
            .then(async () => this.getBotNames());
    }

    deleteBotName(toRemove: string, difficulty: string) {
        this.httpHandler
            .deleteBot({ username: toRemove, difficulty })
            .toPromise()
            .then(async () => this.getBotNames());
    }

    resetBotNames() {
        this.httpHandler
            .resetBot()
            .toPromise()
            .then(async () => this.getBotNames());
    }

    replaceBotName(nameBotToReplace: BotNameInfo) {
        this.httpHandler
            .replaceBot(nameBotToReplace)
            .toPromise()
            .then(async () => this.getBotNames());
    }

    async getBotNames() {
        this.httpHandler.getBeginnerBots().subscribe((beginnerBot) => {
            this.beginnerBotNames = beginnerBot;
        });
        this.httpHandler.getExpertBots().subscribe((expertBot) => {
            this.expertBotNames = expertBot;
        });
        return this.httpHandler.getBeginnerBots().toPromise();
    }
}
