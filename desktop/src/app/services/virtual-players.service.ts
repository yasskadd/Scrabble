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
            .subscribe(() => this.updateBotNames());
    }

    deleteBotName(toRemove: string, difficulty: VirtualPlayerDifficulty) {
        this.httpHandler.deleteBot({ username: toRemove, difficulty }).subscribe(() => this.updateBotNames());
    }

    resetBotNames() {
        this.httpHandler.resetBot().subscribe(() => this.updateBotNames());
    }

    replaceBotName(nameBotToReplace: BotNameSwitcher) {
        this.httpHandler.replaceBot(nameBotToReplace).subscribe(() => this.updateBotNames());
    }

    updateBotNames(): Subject<void> {
        const subject: Subject<void> = new Subject<void>();
        const beginnerSub = this.httpHandler.getBeginnerBots().subscribe((beginnerBot) => {
            this.beginnerBotNames = beginnerBot;
            subject.next();
            beginnerSub.unsubscribe();
        });
        const expertSub = this.httpHandler.getExpertBots().subscribe((expertBot) => {
            this.expertBotNames = expertBot;
            subject.next();
            expertSub.unsubscribe();
        });

        return subject;
    }
}
