import { Application } from '@app/app';
import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

const HTTP_STATUS_CREATED = StatusCodes.CREATED;
const HTTP_STATUS_NO_CONTENT = StatusCodes.NO_CONTENT;
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

describe('VirtualPlayersController', () => {
    let virtualPlayerStorage: SinonStubbedInstance<VirtualPlayersStorageService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        virtualPlayerStorage = createStubInstance(VirtualPlayersStorageService);
        virtualPlayerStorage.getBeginnerBot.resolves(BOT_BEGINNER_LIST);
        virtualPlayerStorage.getExpertBot.resolves(BOT_EXPERT_LIST);
        const app = Container.get(Application);
        // Reason : testing private attribute
        // eslint-disable-next-line dot-notation
        Object.defineProperty(app['virtualPlayerController'], 'virtualPlayerStorage', { value: virtualPlayerStorage });
        expressApp = app.app;
    });

    it('should return array of the beginner bot', async () => {
        return supertest(expressApp)
            .get('/virtualPlayer/beginner')
            .then((response) => {
                expect(response.body).to.deep.equal(BOT_BEGINNER_LIST);
            });
    });

    it('should return array of the expert bot', async () => {
        return supertest(expressApp)
            .get('/virtualPlayer/expert')
            .then((response) => {
                expect(response.body).to.deep.equal(BOT_EXPERT_LIST);
            });
    });

    it('should return status 201 on virtualPlayer upload', async () => {
        return supertest(expressApp)
            .post('/virtualPlayer')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_CREATED);
            });
    });

    it('should return status 201 on virtualPlayer replace', async () => {
        return supertest(expressApp)
            .put('/virtualPlayer')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_CREATED);
            });
    });

    it('should return status 204 on virtualPlayer remove', async () => {
        return supertest(expressApp)
            .patch('/virtualPlayer/remove')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_NO_CONTENT);
            });
    });

    it('should return status 204 on virtualPlayer reset', async () => {
        return supertest(expressApp)
            .delete('/virtualPlayer/reset')
            .then((response) => {
                expect(response.status).to.deep.equal(HTTP_STATUS_NO_CONTENT);
            });
    });
});
