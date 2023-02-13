import { DatabaseCollection } from '@app/classes/database-collection.class';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { DatabaseService } from './database.service';

type CollectionStub = Sinon.SinonStubbedInstance<DatabaseCollection>;

describe('Database Service', () => {
    let databaseService: DatabaseService;

    beforeEach(async () => {
        databaseService = new DatabaseService();

        databaseService.dictionaries = Sinon.createStubInstance(DatabaseCollection) as never;
        databaseService.scores = Sinon.createStubInstance(DatabaseCollection) as never;
        databaseService.histories = Sinon.createStubInstance(DatabaseCollection) as never;
        databaseService.virtualNames = Sinon.createStubInstance(DatabaseCollection) as never;
    });
    afterEach(async () => {
        Sinon.reset();
    });

    it('connect() should connect to all the collections', async () => {
        await databaseService.connect();
        expect((databaseService.dictionaries as unknown as CollectionStub).connect.called).to.equal(true);
        expect((databaseService.scores as unknown as CollectionStub).connect.called).to.equal(true);
        expect((databaseService.histories as unknown as CollectionStub).connect.called).to.equal(true);
        expect((databaseService.virtualNames as unknown as CollectionStub).connect.called).to.equal(true);
    });
});
