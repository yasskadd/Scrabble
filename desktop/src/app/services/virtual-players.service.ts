import { Injectable } from '@angular/core';
import { Bot } from '@common/interfaces/bot';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { BotNameSwitcher } from '@common/interfaces/bot-name-switcher';
import { VirtualPlayerDifficulty } from '@common/models/virtual-player-difficulty';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class VirtualPlayersService {
    beginnerBotNames: Bot[];
    expertBotNames: Bot[];

    constructor(private readonly httpHandler: HttpHandlerService) {}

    addBotName(newName: string, difficulty: VirtualPlayerDifficulty): void {
        this.httpHandler
            .addBot({
                username: newName,
                difficulty,
            })
            .then(() => this.updateBotNames());
    }

    deleteBotName(toRemove: string, difficulty: VirtualPlayerDifficulty) {
        this.httpHandler.deleteBot({ username: toRemove, difficulty }).then(() => this.updateBotNames());
    }

    resetBotNames() {
        this.httpHandler.resetBot().then(() => this.updateBotNames());
    }

    replaceBotName(nameBotToReplace: BotNameSwitcher) {
        this.httpHandler.replaceBot(nameBotToReplace).then(() => this.updateBotNames());
    }

    updateBotNames(): Subject<void> {
        const subject: Subject<void> = new Subject<void>();
        this.httpHandler.getBeginnerBots().then((beginnerBot) => {
            this.beginnerBotNames = beginnerBot;
            subject.next();
        });
        this.httpHandler.getExpertBots().then((expertBot) => {
            this.expertBotNames = expertBot;
            subject.next();
        });

        return subject;
    }
}
