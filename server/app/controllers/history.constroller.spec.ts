import { Application } from '@app/app';
import { HistoryStorageService } from '@app/services/database/history-storage.service';
import { expect } from 'chai';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('HistoryController', () => {
    const GAMES_HISTORY = [
        {
            firstPlayerName: 'Vincent',
            secondPlayerName: 'Maidenless',
            mode: 'classique',
            firstPlayerScore: 20,
            secondPlayerScore: 0,
            abandoned: true,
            beginningTime: '41st millenium',
            endTime: 'To infinite and beyond',
            length: 'Too big',
        },
        {
            firstPlayerName: 'No code no life',
            secondPlayerName: 'Your neighbor Totoro',
            mode: 'LOG2990',
            firstPlayerScore: 0,
            secondPlayerScore: 0,
            abandoned: false,
            beginningTime: 'Shinji in the robot',
            endTime: 'The end of evangelion',
            length: 'Too small',
        },
    ];

    let historyStorage: SinonStubbedInstance<HistoryStorageService>;
    let expressApp: Express.Application;

    beforeEach(async () => {
        historyStorage = createStubInstance(HistoryStorageService);
        historyStorage.getHistory.resolves(GAMES_HISTORY);
        historyStorage.clearHistory.resolves();
        const app = Container.get(Application);
        // Reason : testing private attribute
        // eslint-disable-next-line dot-notation
        Object.defineProperty(app['historyController'], 'historyStorage', { value: historyStorage });
        expressApp = app.app;
    });

    it('should return array of the History for the games', async () => {
        return supertest(expressApp)
            .get('/history')
            .then((response) => {
                expect(response.body).to.deep.equal(GAMES_HISTORY);
            });
    });

    it('should return that the History has been deleted', async () => {
        const NO_CONTENT_CODE = 204;
        return supertest(expressApp)
            .delete('/history')
            .then((response) => {
                expect(response.statusCode).to.deep.equal(NO_CONTENT_CODE);
            });
    });
});
