/* eslint-disable dot-notation*/
import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { DatabaseCollection } from './database-collection.class';

describe('Database Service', () => {
    let databaseCollection: DatabaseCollection;
    let mongod: MongoMemoryServer;

    beforeEach(async () => {
        mongod = await MongoMemoryServer.create();
        mongod.start();
        databaseCollection = new DatabaseCollection('Scrabble');
        DatabaseCollection['dbName'] = mongod.instanceInfo?.dbName as string;
        DatabaseCollection['dbUrl'] = mongod.getUri();
    });

    afterEach(async () => {
        await mongod.stop();
    });

    it('the first connect() should connect to the server', async () => {
        await databaseCollection['connect']();
        expect(databaseCollection['isConnected']).to.be.equal(true);
    });

    it("connect() shouldn't change isConnected in case of no connection to the server", async () => {
        DatabaseCollection['dbName'] = '';
        DatabaseCollection['dbUrl'] = '';
        await databaseCollection['connect']();
        expect(databaseCollection['isConnected']).to.be.equal(false);
    });

    it('addDocument() should add a document to the collection', async () => {
        await databaseCollection['addDocument']({ tests: 'I hate tests', helloWorld: 'WorldHello' });

        const documentCount = await databaseCollection['collection'].countDocuments({});

        expect(documentCount).to.be.equal(1);
    });

    it('removeDocument() should remove a document from the collection', async () => {
        await databaseCollection['connect']();
        await databaseCollection['collection'].insertOne({ tests: 'I hate tests', helloWorld: 'WorldHello' });

        const documentCount = await databaseCollection['collection'].countDocuments({});

        await databaseCollection['removeDocument']({ tests: 'I hate tests' });

        const currentCount = await databaseCollection['collection'].countDocuments({});

        expect(currentCount).to.be.equal(documentCount - 1);
    });

    it('resetresetCollection() should remove all documents from the collection', async () => {
        await databaseCollection['connect']();
        await databaseCollection['collection'].insertOne({ tests: 'I hate tests', helloWorld: 'WorldHello' });

        await databaseCollection['collection'].insertOne({ tests: 'I hate 2 tests' });

        const documentCount = await databaseCollection['collection'].countDocuments({});

        expect(documentCount).to.be.equal(2);
        await databaseCollection['resetCollection']();
        const currentCount = await databaseCollection['collection'].countDocuments({});

        expect(currentCount).to.be.equal(0);
    });

    it('fetchDocuments() should return all documents with the correct parameters', async () => {
        const TEST_DOCUMENT = { tests: 'I hate tests', helloWorld: 'WorldHello' };
        await databaseCollection['connect']();
        await databaseCollection['collection'].insertOne(TEST_DOCUMENT);
        await databaseCollection['collection'].insertOne({ tests: 'I hate 2 tests' });

        const currentDocuments = await databaseCollection['fetchDocuments']({ tests: 'I hate tests' }, { projection: { tests: 1, _id: 0 } });

        expect(currentDocuments).to.be.deep.equal([{ tests: 'I hate tests' }]);
    });

    it('replaceDocument() should replace the correct document in the database', async () => {
        const TEST_DOCUMENT = { tests: 'I hate tests', helloWorld: 'WorldHello' };
        await databaseCollection['connect']();
        await databaseCollection['collection'].insertOne({ tests: 'I hate tests' });

        await databaseCollection['replaceDocument']({ tests: 'I hate tests' }, TEST_DOCUMENT);
        const currentDocuments = await databaseCollection['collection'].find({}, { projection: { _id: 0 } }).toArray();
        expect(currentDocuments).to.be.deep.equal([TEST_DOCUMENT]);
    });
});
