import * as constants from '@common/constants/bots';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

type BotNameInfo = { currentName: string; newName: string; difficulty: string };

@Service()
export class VirtualPlayersStorageService {
    constructor(private database: DatabaseService) {}

    async getExpertBot(): Promise<Document[]> {
        await this.populateDb();

        const currentExpertBot = await this.database.virtualNames.fetchDocuments({ difficulty: 'Expert' });
        return currentExpertBot;
    }

    async getBeginnerBot(): Promise<Document[]> {
        await this.populateDb();
        const currentBeginnerBot = await this.database.virtualNames.fetchDocuments({ difficulty: 'debutant' });

        return currentBeginnerBot;
    }

    async replaceBotName(botNameInfo: BotNameInfo) {
        await this.populateDb();
        this.database.virtualNames.replaceDocument(
            { username: botNameInfo.currentName },
            { username: botNameInfo.newName, difficulty: botNameInfo.difficulty },
        );
    }

    async addBot(bot: Document) {
        if (await this.botIsInDb(bot.username)) return;
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
            await this.database.virtualNames.addDocument({ username: constants.BOT_BEGINNER_NAME_LIST[i], difficulty: 'debutant' });
            await this.database.virtualNames.addDocument({ username: constants.BOT_EXPERT_NAME_LIST[i], difficulty: 'Expert' });
        }
    }
}
