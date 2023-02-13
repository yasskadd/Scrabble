import { Application } from '@app/app';
import { Dictionary } from '@app/interfaces/dictionary';
import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

const HTTP_STATUS_CREATED = StatusCodes.CREATED;
const HTTP_STATUS_NO_CONTENT = StatusCodes.NO_CONTENT;
const HTTP_STATUS_FOUND = StatusCodes.OK;

const DICTIONARIES = [
    { title: 'Premier dicitonnaire', description: 'Un dictionnaire', words: ['string'] },
    { title: 'Deuxieme dicitonnaire', description: 'Un dictionnaire', words: ['string'] },
    { title: 'Troisieme dicitonnaire', description: 'Un dictionnaire', words: ['string'] },
];

const DICTIONARIES_INFO = [
    { title: 'Premier dicitonnaire', description: 'Un dictionnaire' },
    { title: 'Deuxieme dicitonnaire', description: 'Un dictionnaire' },
    { title: 'Troisieme dicitonnaire', description: 'Un dictionnaire' },
];

const DICTIONARY: Dictionary = {
    title: 'BigTests',
    description: 'Big things',
    words: [],
};

describe('DictionaryController', () => {
    let gamesHandler: SinonStubbedInstance<GamesHandler>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        gamesHandler = createStubInstance(GamesHandler);
        const app = Container.get(Application);
        // Reason : testing private attribute
        // eslint-disable-next-line dot-notation
        Object.defineProperty(app['dictionaryController'], 'gamesHandler', { value: gamesHandler });
        expressApp = app.app;
    });

    it('should return 200 status is dictionary is in the database', async () => {
        gamesHandler.dictionaryIsInDb.resolves({} as unknown as void);
        return supertest(expressApp)
            .get('/dictionary/dictionaryisindb/dictionary')
            .then((response) => {
                expect(response.status).to.equal(HTTP_STATUS_FOUND);
            });
    });

    it('should return 204 status is dictionary is in the database', async () => {
        gamesHandler.dictionaryIsInDb.throws();
        return supertest(expressApp)
            .get('/dictionary/dictionaryisindb/title')
            .then((response) => {
                expect(response.status).to.equal(HTTP_STATUS_NO_CONTENT);
            });
    });

    it('should return array with title and description only of the dictionaries', async () => {
        gamesHandler.getDictionaries.resolves(DICTIONARIES);
        return supertest(expressApp)
            .get('/dictionary/info')
            .then((response) => {
                expect(response.body).to.deep.equal(DICTIONARIES_INFO);
            });
    });

    it('should return status 201 on dictionary post', async () => {
        return supertest(expressApp)
            .post('/dictionary')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_CREATED);
            });
    });

    it('should return full dictionary on dictionary get', async () => {
        gamesHandler.getDictionary.resolves(DICTIONARY);
        return supertest(expressApp)
            .get('/dictionary/all/BigThings')
            .then((response) => {
                expect(response.body).to.deep.equal(DICTIONARY);
            });
    });

    it('should return status 204 when reseting all dictionaries', async () => {
        return supertest(expressApp)
            .delete('/dictionary')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_NO_CONTENT);
            });
    });

    it('should return status 204 when deleting a dictionary', async () => {
        return supertest(expressApp)
            .patch('/dictionary')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_NO_CONTENT);
            });
    });

    it('should return status 201 when we replace the information of a dictionary', async () => {
        return supertest(expressApp)
            .put('/dictionary')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_CREATED);
            });
    });
});
