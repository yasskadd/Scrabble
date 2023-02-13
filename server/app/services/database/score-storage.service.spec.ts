/* eslint-disable dot-notation*/
import { DatabaseCollection } from '@app/classes/database-collection.class';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { DatabaseService } from './database.service';
import { ScoreStorageService } from './score-storage.service';

type CollectionStub = Sinon.SinonStubbedInstance<DatabaseCollection>;

const TOP_SCORES = [
    {
        score: 0,
    },
    {
        score: -5,
    },
    {
        score: 3,
    },
    {
        score: 600,
    },
    {
        score: 500000000,
    },
];

const TOP_SCORES_CLASSIC = [
    {
        username: 'Paul',
        type: 'classique',
        score: 0,
        position: 1,
    },
    {
        username: 'MARC',
        type: 'classique',
        score: 20,
        position: 2,
    },
    {
        username: 'Luc',
        type: 'classique',
        score: 30,
        position: 3,
    },
    {
        username: 'Jean',
        type: 'classique',
        score: 600,
        position: 4,
    },
    {
        username: 'Jules',
        type: 'classique',
        score: 500000000,
        position: 5,
    },
];
describe('scoreStorage Service', () => {
    let databaseServiceStub: Sinon.SinonStubbedInstance<DatabaseService>;
    let scoreStorageService: ScoreStorageService;

    beforeEach(async () => {
        databaseServiceStub = Sinon.createStubInstance(DatabaseService);
        databaseServiceStub.scores = Sinon.createStubInstance(DatabaseCollection) as never;

        scoreStorageService = new ScoreStorageService(databaseServiceStub as unknown as DatabaseService);
    });
    afterEach(async () => {
        Sinon.reset();
    });

    it('getLOG2990TopScores() should return the LOG2990 top scores from the database', async () => {
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES);
        const scoresLOG2990 = await scoreStorageService.getLOG2990TopScores();
        expect(scoresLOG2990).to.be.deep.equal(TOP_SCORES);
    });

    it('getClassicTopScores() should return the classic top scores from the database', async () => {
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES);
        const scoresClassic = await scoreStorageService.getClassicTopScores();
        expect(scoresClassic).to.be.deep.equal(TOP_SCORES);
    });

    it('getTopScoresPosition() should return the position of the score', () => {
        const TEST_SCORE = 100;
        const EXPECTED_POSTITION = 3;
        const scoresClassic = scoreStorageService['getTopScoresPosition'](TOP_SCORES, TEST_SCORE);
        expect(scoresClassic).to.be.deep.equal(EXPECTED_POSTITION);
    });

    it('isNameAlreadyThere() should return true if the position in the ranking already has the name of the player', () => {
        const PLAYER_NAME = 'Paul';
        const playerNameAlready = scoreStorageService['isNameAlreadyThere'](TOP_SCORES_CLASSIC[0].username, PLAYER_NAME);
        expect(playerNameAlready).to.be.deep.equal(true);
    });

    it('isNameAlreadyThere() should return false if the position in the ranking does not already has the name of the player', () => {
        const PLAYER_NAME = 'Paul';
        const playerNameAlready = scoreStorageService['isNameAlreadyThere'](TOP_SCORES_CLASSIC[1].username, PLAYER_NAME);
        expect(playerNameAlready).to.be.deep.equal(false);
    });

    it("populateDb() should populate the database if it's not populated", async () => {
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves([]);
        (databaseServiceStub.scores as unknown as CollectionStub).addDocument.resolves();
        await scoreStorageService['populateDb']();
        for (let i = 1; i < ScoreStorageService['lastElement']; i++) {
            expect(
                (databaseServiceStub.scores as unknown as CollectionStub).addDocument.withArgs({
                    username: 'Tarnished',
                    type: 'classique',
                    score: 0,
                    position: i,
                }).callCount,
            ).to.be.equal(1);
            expect(
                (databaseServiceStub.scores as unknown as CollectionStub).addDocument.withArgs({
                    username: 'EldenLord',
                    type: 'LOG2990',
                    score: 0,
                    position: i,
                }).callCount,
            ).to.be.equal(1);
        }
    });

    it("populateDb() shouldn't populate the database if it's already populated", async () => {
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves([{}, {}]);
        (databaseServiceStub.scores as unknown as CollectionStub).addDocument.resolves();
        await scoreStorageService['populateDb']();
        expect((databaseServiceStub.scores as unknown as CollectionStub).addDocument.called).to.be.equal(false);
    });

    it('addTopScores() should call addNewScore when there is a new highScore register ', async () => {
        const addNewScoreStub = Sinon.stub(scoreStorageService, 'addNewScore' as never);
        const POSITION = 3;
        const scoreInfo = {
            username: 'Arararagi',
            type: 'classique',
            score: 50,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addTopScores'](scoreInfo);
        expect(addNewScoreStub.called).to.equal(true);
    });

    it("addNewScore() should replace a top score with the score info if it's legible ", async () => {
        const POSITION = 3;
        const scoreInfo = {
            username: 'Arararagi',
            type: 'classique',
            score: 50,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addNewScore'](TOP_SCORES_CLASSIC, POSITION, scoreInfo);

        expect(
            (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.withArgs(
                { position: POSITION, type: scoreInfo.type },
                { ...scoreInfo, position: POSITION },
            ).callCount,
        ).to.be.equal(1);
    });

    it('addPlayerToSameScore() should add the name of the player if he has the same score of someone else ', async () => {
        const POSITION = 3;
        const scoreInfo = {
            username: 'Paul',
            type: 'classique',
            score: 30,
        };
        const infoPlayer = {
            type: 'classique',
            score: 30,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addPlayerToSameScore'](scoreInfo, POSITION, TOP_SCORES_CLASSIC[2]);
        expect(
            (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.withArgs(
                { position: POSITION, type: scoreInfo.type },
                { ...infoPlayer, username: TOP_SCORES_CLASSIC[2].username + ' - ' + scoreInfo.username, position: POSITION },
            ).callCount,
        ).to.be.equal(1);
    });
    it('addTopScores() should call addPlayerToSameScore when high score is register and someone already has this score ', async () => {
        const addPlayerToSameScoreStub = Sinon.stub(scoreStorageService, 'addPlayerToSameScore' as never);
        const POSITION = 3;
        const scoreInfo = {
            username: 'Vincent',
            type: 'classique',
            score: 30,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addTopScores'](scoreInfo);
        expect(addPlayerToSameScoreStub.called).to.equal(true);
    });

    it('resetHighScores() should call populateDb ', async () => {
        const populateDbStub = Sinon.stub(scoreStorageService, 'populateDb' as never);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        await scoreStorageService['resetHighScores']();
        expect(populateDbStub.called).to.equal(true);
    });

    it('resetHighScores() should call resetCollection() in database ', async () => {
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        await scoreStorageService['resetHighScores']();
        expect((databaseServiceStub.scores as unknown as CollectionStub).resetCollection.called).to.equal(true);
    });

    it('addTopScores() should not add the name of the player if he did already in the leaderboard at this position ', async () => {
        const addPlayerToSameScoreStub = Sinon.stub(scoreStorageService, 'addPlayerToSameScore' as never);
        const POSITION = 3;
        const scoreInfo = {
            username: 'Luc',
            type: 'classique',
            score: 30,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES_CLASSIC);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addTopScores'](scoreInfo);
        expect(addPlayerToSameScoreStub.called).to.not.equal(true);
    });

    it("addTopScores() shouldn't replace a top score with the score info if it's illegible ", async () => {
        const addPlayerToSameScoreStub = Sinon.stub(scoreStorageService, 'addPlayerToSameScore' as never);
        const addNewScoreStub = Sinon.stub(scoreStorageService, 'addNewScore' as never);
        const POSITION = 6;
        const scoreInfo = {
            username: 'HelloWorld',
            type: 'LOG2990',
            score: 300,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addTopScores'](scoreInfo);
        expect(addPlayerToSameScoreStub.called).to.not.equal(true);
        expect(addNewScoreStub.called).to.not.equal(true);
    });

    it("addTopScores() shouldn't replace a top score with the position is undefined ", async () => {
        const addPlayerToSameScoreStub = Sinon.stub(scoreStorageService, 'addPlayerToSameScore' as never);
        const addNewScoreStub = Sinon.stub(scoreStorageService, 'addNewScore' as never);
        const POSITION = undefined;
        const scoreInfo = {
            username: 'HelloWorld',
            type: 'LOG2990',
            score: 300,
        };
        Sinon.stub(scoreStorageService, 'populateDb' as never);
        const topScoresPositionStub = Sinon.stub(scoreStorageService, 'getTopScoresPosition' as never);
        topScoresPositionStub.returns(POSITION);
        (databaseServiceStub.scores as unknown as CollectionStub).fetchDocuments.resolves(TOP_SCORES);
        (databaseServiceStub.scores as unknown as CollectionStub).replaceDocument.resolves();
        await scoreStorageService['addTopScores'](scoreInfo);
        expect(addPlayerToSameScoreStub.called).to.not.equal(true);
        expect(addNewScoreStub.called).to.not.equal(true);
    });
});
