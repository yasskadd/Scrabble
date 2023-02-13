/* eslint-disable dot-notation*/
import { DatabaseCollection } from '@app/classes/database-collection.class';
import * as constants from '@common/constants/bots';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { stub } from 'sinon';
import { DatabaseService } from './database.service';
import { VirtualPlayersStorageService } from './virtual-players-storage.service';

type BotNameInfo = { currentName: string; newName: string; difficulty: string };
type CollectionStub = Sinon.SinonStubbedInstance<DatabaseCollection>;

const BOT_EXPERT_LIST = [
    {
        username: 'Paul',
        difficulty: 'Expert',
    },
    {
        username: 'MARC',
        difficulty: 'Expert',
    },
    {
        username: 'Luc',
        difficulty: 'Expert',
    },
    {
        username: 'Jean',
        difficulty: 'Expert',
    },
    {
        username: 'Charles',
        difficulty: 'Expert',
    },
];

const BOT_BEGINNER_LIST = [
    {
        username: 'Paul',
        difficulty: 'debutant',
    },
    {
        username: 'MARC',
        difficulty: 'debutant',
    },
    {
        username: 'Luc',
        difficulty: 'debutant',
    },
    {
        username: 'Jean',
        difficulty: 'debutant',
    },
    {
        username: 'Jules',
        difficulty: 'debutant',
    },
];
describe('virtualPlayerStorage Service', () => {
    let databaseServiceStub: Sinon.SinonStubbedInstance<DatabaseService>;
    let virtualPlayersStorage: VirtualPlayersStorageService;

    beforeEach(async () => {
        databaseServiceStub = Sinon.createStubInstance(DatabaseService);
        databaseServiceStub.virtualNames = Sinon.createStubInstance(DatabaseCollection) as never;

        virtualPlayersStorage = new VirtualPlayersStorageService(databaseServiceStub as unknown as DatabaseService);
    });
    afterEach(async () => {
        Sinon.reset();
    });

    it('getBeginnerBot() should return the list of bot with beginner difficulty', async () => {
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves(BOT_BEGINNER_LIST);
        const beginnerBotList = await virtualPlayersStorage.getBeginnerBot();
        expect(beginnerBotList).to.be.deep.equal(BOT_BEGINNER_LIST);
    });

    it('getExpertBot() should return the list of bot with Expert difficulty', async () => {
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves(BOT_EXPERT_LIST);
        const expertBotList = await virtualPlayersStorage.getExpertBot();
        expect(expertBotList).to.be.deep.equal(BOT_EXPERT_LIST);
    });

    it('replaceBotName() should replace the player name with the new one that is send to the server ', async () => {
        const infoBot: BotNameInfo = { currentName: BOT_BEGINNER_LIST[1].username, newName: 'Pauline', difficulty: 'debutant' };

        Sinon.stub(virtualPlayersStorage, 'populateDb' as never);
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves(BOT_BEGINNER_LIST);
        (databaseServiceStub.virtualNames as unknown as CollectionStub).replaceDocument.resolves();
        await virtualPlayersStorage['replaceBotName'](infoBot);
        expect(
            (databaseServiceStub.virtualNames as unknown as CollectionStub).replaceDocument.withArgs(
                { username: infoBot.currentName },
                { username: infoBot.newName, difficulty: infoBot.difficulty },
            ).callCount,
        ).to.be.equal(1);
    });

    it("populateDb() should populate the database if it's not populated", async () => {
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves([]);
        (databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.resolves();
        await virtualPlayersStorage['populateDb']();
        for (let i = 1; i < virtualPlayersStorage['lastElement']; i++) {
            expect(
                (databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.withArgs({
                    username: constants.BOT_BEGINNER_NAME_LIST[i],
                    difficulty: 'debutant',
                }).callCount,
            ).to.be.equal(1);
            expect(
                (databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.withArgs({
                    username: constants.BOT_EXPERT_NAME_LIST[i],
                    difficulty: 'Expert',
                }).callCount,
            ).to.be.equal(1);
        }
    });

    it("populateDb() shouldn't populate the database if it's already populated", async () => {
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves([{}, {}]);
        (databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.resolves();
        await virtualPlayersStorage['populateDb']();
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.called).to.be.equal(false);
    });

    it('addBot() should call addDocument of DatabaseService if the bot to add is not in the database', async () => {
        const botIsInDbSpy = stub(virtualPlayersStorage, 'botIsInDb');
        botIsInDbSpy.resolves(false);
        await virtualPlayersStorage.addBot({});
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.called).to.equal(true);
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.calledWith({})).to.equal(true);
    });

    it('addBot() should not call addDocument of DatabaseService if the bot to add is already in the database', async () => {
        const botIsInDbSpy = stub(virtualPlayersStorage, 'botIsInDb');
        botIsInDbSpy.resolves(true);
        await virtualPlayersStorage.addBot({});
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).addDocument.called).to.equal(false);
    });

    it('botIsInDb() should return true if the bot username exist in the database', async () => {
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves([BOT_BEGINNER_LIST[0]]);
        const botIsInDb = await virtualPlayersStorage.botIsInDb(BOT_BEGINNER_LIST[0].username);
        expect(botIsInDb).to.equal(true);
    });

    it('botIsInDb() should return false if the bot username does not exist in the database', async () => {
        (databaseServiceStub.virtualNames as unknown as CollectionStub).fetchDocuments.resolves([]);
        const botIsInDb = await virtualPlayersStorage.botIsInDb('Luc');
        expect(botIsInDb).to.equal(false);
    });

    it('removeBot() should not call removeDocument of DatabaseService if the bot to remove is not in the database', async () => {
        const botIsInDbSpy = stub(virtualPlayersStorage, 'botIsInDb');
        botIsInDbSpy.resolves(false);
        await virtualPlayersStorage.removeBot({});
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).removeDocument.called).to.equal(false);
    });

    it('removeBot() should call removeDocument of DatabaseService if the bot to remove is in the database', async () => {
        const botIsInDbSpy = stub(virtualPlayersStorage, 'botIsInDb');
        botIsInDbSpy.resolves(true);
        await virtualPlayersStorage.removeBot({ username: 'Paul' });
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).removeDocument.called).to.equal(true);
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).removeDocument.calledWith({ username: 'Paul' })).to.equal(true);
    });

    it('resetBot() should call resetCollection of DatabaseService when we reset the list of bot', async () => {
        Sinon.stub(virtualPlayersStorage, 'populateDb' as never);
        await virtualPlayersStorage.resetBot();
        expect((databaseServiceStub.virtualNames as unknown as CollectionStub).resetCollection.called).to.equal(true);
    });
});
