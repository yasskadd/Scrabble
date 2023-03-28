import * as constants from '@common/constants/bots-names';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';
import { BotNameSwitcher } from '@common/interfaces/bot-name-switcher';
import { VirtualPlayerDifficulty } from '@common/models/virtual-player-difficulty';
import { GameDifficulty } from '@common/models/game-difficulty';
import { Bot } from '@common/interfaces/bot';

@Service()
export class VirtualPlayersStorageService {
    constructor(private database: DatabaseService) {}

    async getExpertBot(): Promise<Document[]> {
        await this.populateDb();

        return await this.database.virtualNames.fetchDocuments({ difficulty: VirtualPlayerDifficulty.Expert });
    }

    async getBeginnerBot(): Promise<Document[]> {
        await this.populateDb();

        return await this.database.virtualNames.fetchDocuments({ difficulty: VirtualPlayerDifficulty.Beginner });
    }

    async getBotName(quantity: number, difficulty: GameDifficulty): Promise<string[]> {
        const names: string[] = [];
        let bots: Bot[] = [];

        // TODO : Add names for relative difficulty bots
        // TODO : Change GameDifficulty for VirtualPlayerDifficulty
        if (difficulty === GameDifficulty.Easy) {
            bots = (await this.database.virtualNames.fetchDocuments({ difficulty: VirtualPlayerDifficulty.Beginner })) as Bot[];
        } else if (difficulty === GameDifficulty.Hard) {
            bots = (await this.database.virtualNames.fetchDocuments({ difficulty: VirtualPlayerDifficulty.Expert })) as Bot[];
        }

        bots.forEach((bot: Bot) => {
            names.push(bot.username);
        });

        return names;
    }

    async replaceBotName(botNameSwitcher: BotNameSwitcher) {
        await this.populateDb();
        this.database.virtualNames
            .replaceDocument(
                { username: botNameSwitcher.currentName },
                {
                    username: botNameSwitcher.newName,
                    difficulty: botNameSwitcher.difficulty,
                },
            )
            .then();
    }

    async addBot(bot: Document) {
        if (await this.botIsInDb(bot.username)) {
            return;
        }

        await this.database.virtualNames.addDocument(bot);
    }

    async resetBot() {
        await this.database.virtualNames.resetCollection();
        await this.populateDb();
    }

    async removeBot(bot: Document) {
        if (!(await this.botIsInDb(bot.username))) return;
        await this.database.virtualNames.removeDocument(bot);
    }

    async botIsInDb(username: string): Promise<boolean> {
        // Reason : no other way to go around this test
        // eslint-disable-next-line object-shorthand
        const document = await this.database.virtualNames.fetchDocuments({ username: username }, { projection: { username: 1 } });
        return document.length ? true : false;
    }

    private async populateDb() {
        const currentBot = await this.database.virtualNames.fetchDocuments({});
        if (currentBot.length !== 0) return;
        for (let i = 0; i < constants.BOT_BEGINNER_NAME_LIST.length; i++) {
            await this.database.virtualNames.addDocument({
                username: constants.BOT_BEGINNER_NAME_LIST[i],
                difficulty: VirtualPlayerDifficulty.Beginner,
            });
            await this.database.virtualNames.addDocument({
                username: constants.BOT_EXPERT_NAME_LIST[i],
                difficulty: VirtualPlayerDifficulty.Expert,
            });
        }
    }
}
