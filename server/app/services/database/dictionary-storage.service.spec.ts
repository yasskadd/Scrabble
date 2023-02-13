import { expect } from 'chai';
import * as fs from 'fs';
import * as Sinon from 'sinon';
import { DictionaryStorageService } from './dictionary-storage.service';

describe('dictionaryStorage Service', () => {
    let dictionaryStorageService: DictionaryStorageService;

    beforeEach(async () => {
        dictionaryStorageService = new DictionaryStorageService();
    });
    afterEach(async () => {
        Sinon.reset();
    });

    it('dictionaryIsInDb() should call access from fs.promises', async () => {
        const accessStub = Sinon.stub(fs.promises, 'access');
        await dictionaryStorageService.dictionaryIsInDb('dictionary');
        expect(accessStub.called).to.equal(true);
    });

    it('addDictionary() should call writeFile from fs.promises', async () => {
        const writeFileStub = Sinon.stub(fs.promises, 'writeFile');
        await dictionaryStorageService.addDictionary('dictionary1', 'data');
        expect(writeFileStub.called).to.equal(true);
    });

    it('deletedDictionary() should call unlink from fs.promises', async () => {
        const unlinkStub = Sinon.stub(fs.promises, 'unlink');
        await dictionaryStorageService.deletedDictionary('dictionary1');
        expect(unlinkStub.called).to.equal(true);
    });

    it('getDictionary() should call readFile from fs.promises', async () => {
        const readFileStub = Sinon.stub(fs.promises, 'readFile');
        await dictionaryStorageService.getDictionary('dictionary');
        expect(readFileStub.called).to.equal(true);
    });

    it('getDictionariesFileName() should call readdir from fs.promises and should return all .json files', async () => {
        const readdirStub = Sinon.stub(fs.promises, 'readdir');
        readdirStub.resolves(['MisterWorldWide.json', 'booji.json', 'Gugu'] as never);
        readdirStub.returns(['MisterWorldWide.json', 'booji.json', 'Gugu'] as never);
        const result = await dictionaryStorageService.getDictionariesFileName();
        expect(result).to.deep.equal(['MisterWorldWide.json', 'booji.json']);
        expect(readdirStub.called).to.equal(true);
    });

    it('updateDictionary() should call getDictionary', async () => {
        const getDictionaryStub = Sinon.stub(dictionaryStorageService, 'getDictionary');
        const dictionary = { title: 'dictionary', description: 'description', words: ['string'] };
        const dictionaryBuffer = Buffer.from(JSON.stringify(dictionary));
        getDictionaryStub.resolves(dictionaryBuffer);
        await dictionaryStorageService.updateDictionary({
            title: 'dictionary',
            newTitle: 'dictionaryModified',
            newDescription: 'description',
        });
        expect(getDictionaryStub.called).to.equal(true);
    });

    it('updateDictionary() should call addDictionary', async () => {
        const getDictionaryStub = Sinon.stub(dictionaryStorageService, 'getDictionary');
        const addDictionaryStub = Sinon.stub(dictionaryStorageService, 'addDictionary');
        const dictionary = { title: 'dictionary', description: 'description', words: ['string'] };
        const dictionaryBuffer = Buffer.from(JSON.stringify(dictionary));
        getDictionaryStub.resolves(dictionaryBuffer);
        await dictionaryStorageService.updateDictionary({
            title: 'dictionary',
            newTitle: 'dictionaryModified',
            newDescription: 'description',
        });
        expect(addDictionaryStub.called).to.equal(true);
    });

    it('updateDictionary() should call deletedDictionary', async () => {
        const getDictionaryStub = Sinon.stub(dictionaryStorageService, 'getDictionary');
        const dictionary = { title: 'dictionary', description: 'description', words: ['string'] };
        const dictionaryBuffer = Buffer.from(JSON.stringify(dictionary));
        const deletedDictionaryStub = Sinon.stub(dictionaryStorageService, 'deletedDictionary');
        getDictionaryStub.resolves(dictionaryBuffer);
        await dictionaryStorageService.updateDictionary({
            title: 'dictionary',
            newTitle: 'dictionaryModified',
            newDescription: 'description',
        });
        expect(deletedDictionaryStub.called).to.equal(true);
    });
});
