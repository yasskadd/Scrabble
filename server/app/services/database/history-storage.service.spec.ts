/* eslint-disable dot-notation */
import { DatabaseCollection } from '@app/classes/database-collection.class';
import { Game } from '@app/classes/game.class';
import { Player } from '@app/classes/player/player.class';
import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { expect } from 'chai';
import { Subject } from 'rxjs';
import * as Sinon from 'sinon';
import { DatabaseService } from './database.service';
import { HistoryStorageService } from './history-storage.service';

type CollectionStub = Sinon.SinonStubbedInstance<DatabaseCollection>;

const GAME_INFO = {
    firstPlayerName: 'Vincent',
    secondPlayerName: 'Maidenless',
    mode: 'classique',
    firstPlayerScore: 20,
    secondPlayerScore: 0,
    abandoned: true,
    beginningTime: new Date('January 0, 2000 03:25:00'),
    endTime: new Date('January 1, 2000 03:25:00'),
    duration: 'Too big',
};

const GAMES_HISTORY = [
    {
        firstPlayerName: 'Subaru',
        secondPlayerName: 'Mitsubishi',
        mode: 'LOG2990',
        firstPlayerScore: 0,
        secondPlayerScore: 0,
        abandoned: true,
        beginningTime: 'Shinji get in the robot',
        endTime: 'End of evengelion',
        duration: 'Tuturu',
    },
    GAME_INFO,
];

describe('historyStorage Service', () => {
    let databaseServiceStub: Sinon.SinonStubbedInstance<DatabaseService>;
    let gamesStateStub: Sinon.SinonStubbedInstance<GamesStateService>;
    let gamesHandlerStub: Sinon.SinonStubbedInstance<GamesHandler>;

    let gameEndedSubjectStub: Subject<string>;

    let historyStorageService: HistoryStorageService;

    beforeEach(async () => {
        databaseServiceStub = Sinon.createStubInstance(DatabaseService);
        gamesStateStub = Sinon.createStubInstance(GamesStateService);
        gamesHandlerStub = Sinon.createStubInstance(GamesHandler);

        gameEndedSubjectStub = new Subject();
        gamesStateStub.gameEnded = gameEndedSubjectStub;
        databaseServiceStub.histories = Sinon.createStubInstance(DatabaseCollection) as never;

        historyStorageService = new HistoryStorageService(databaseServiceStub as never, gamesStateStub as never, gamesHandlerStub as never);
    });
    afterEach(async () => {
        Sinon.reset();
    });

    it('getHistory() should return the games history from the database', async () => {
        (databaseServiceStub.histories as unknown as CollectionStub).fetchDocuments.resolves(GAMES_HISTORY);
        const history = await historyStorageService.getHistory();
        expect(history).to.be.deep.equal(GAMES_HISTORY);
    });

    it('clearHistory() should clear the games history from the database', async () => {
        await historyStorageService.clearHistory();
        expect((databaseServiceStub.histories as unknown as CollectionStub).resetCollection.called).to.equal(true);
    });

    it("addToHistory() should add a game's info to the database history", async () => {
        await historyStorageService['addToHistory'](GAME_INFO);
        expect((databaseServiceStub.histories as unknown as CollectionStub).addDocument.calledOnceWith(GAME_INFO)).to.equal(true);
    });

    it("computeDuration() should compute and format two date's duration", async () => {
        const DATE1 = new Date('December 17, 1984 03:25:00');
        const DATE2 = new Date('December 17, 1984 03:30:00');

        const DATE3 = new Date('April 19, 2022 00:00:00');
        const DATE4 = new Date('April 19, 2022 23:55:10');

        const duration1 = await historyStorageService['computeDuration'](DATE1, DATE2);
        expect(duration1).to.equal('05:00');
        const duration2 = await historyStorageService['computeDuration'](DATE3, DATE4);
        expect(duration2).to.equal('1435:10');
    });

    it("formatGameInfo() should format all the game's info with only the room ID", async () => {
        gamesHandlerStub.gamePlayers = new Map();
        const ROOM = '0';
        const game = Sinon.createStubInstance(Game);
        const DATE1 = new Date('January 1, 2044 00:00:00');
        const DATE2 = new Date('January 1, 2044 00:00:01');

        game.isGameAbandoned = false;
        game.beginningTime = DATE1;
        game.gameMode = 'SNK';
        const firstPlayer = Sinon.createStubInstance(Player);
        const secondPlayer = Sinon.createStubInstance(Player);

        firstPlayer.name = 'Eren';
        firstPlayer.score = 1000;
        firstPlayer.game = game as never;

        secondPlayer.name = 'Armin';
        secondPlayer.score = 100;
        secondPlayer.game = game as never;

        const players = [firstPlayer, secondPlayer] as Player[];

        const EXPECTED_VALUE = {
            firstPlayerName: 'Eren',
            secondPlayerName: 'Armin',
            mode: 'SNK',
            firstPlayerScore: 1000,
            secondPlayerScore: 100,
            abandoned: false,
            beginningTime: DATE1,
            endTime: DATE2,
            duration: 'infinite',
        };
        gamesHandlerStub.gamePlayers.set(ROOM, players);

        const computeDurationStub = Sinon.stub(historyStorageService, 'computeDuration' as never);
        computeDurationStub.returns('infinite');

        const clock = Sinon.useFakeTimers(DATE2);

        const gameInfo = historyStorageService['formatGameInfo'](ROOM);
        expect(gameInfo).to.deep.equal(EXPECTED_VALUE);

        expect(historyStorageService['formatGameInfo']('WRONG_ROOM')).to.deep.equal({});

        clock.restore();
    });

    it("when a game ends, it's info should be added to the database", async () => {
        Sinon.stub(historyStorageService, 'formatGameInfo' as never).returns(GAME_INFO);
        gameEndedSubjectStub.next('ROOM');
        expect((databaseServiceStub.histories as unknown as CollectionStub).addDocument.calledOnceWith(GAME_INFO)).to.equal(true);
    });
});
