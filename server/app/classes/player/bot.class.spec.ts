/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { BotInformation } from '@app/interfaces/bot-information';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { expect } from 'chai';
import { ReplaySubject } from 'rxjs';
import * as Sinon from 'sinon';
import { Bot } from './bot.class';

describe('Bot Tests', () => {
    let bot: Bot;
    let gameStub: Sinon.SinonStubbedInstance<Game> & Game;
    let botInfo: BotInformation;
    let stubMathRandom: Sinon.SinonStub<[], number>;
    let wordSolverStub: Sinon.SinonStubbedInstance<WordSolver>;
    let dictionaryValidation: Sinon.SinonStubbedInstance<DictionaryValidation> & DictionaryValidation;

    beforeEach(() => {
        stubMathRandom = Sinon.stub(Math, 'random');
        gameStub = Sinon.createStubInstance(Game) as Sinon.SinonStubbedInstance<Game> & Game;
        gameStub.turn = { countdown: new ReplaySubject(), endTurn: new ReplaySubject() } as Turn;
        wordSolverStub = Sinon.createStubInstance(WordSolver);
        dictionaryValidation = Sinon.createStubInstance(DictionaryValidation) as Sinon.SinonStubbedInstance<DictionaryValidation> &
            DictionaryValidation;
        botInfo = {
            timer: 60,
            roomId: 'testRoom',
            dictionaryValidation: dictionaryValidation as Sinon.SinonStubbedInstance<DictionaryValidation> & DictionaryValidation,
        };
        bot = new Bot(true, 'robot', botInfo);
        bot['wordSolver'] = wordSolverStub as never;
        bot.setGame(gameStub);
    });

    afterEach(() => {
        Sinon.restore();
    });

    context('setGame() tests', () => {
        beforeEach(() => {
            const turn = new Turn(60);
            gameStub.turn = turn;
        });
        it('setGame() should set game attribute to the game passed as a parameter', () => {
            expect(bot.game).to.not.equal(undefined);
            expect(bot.game).to.eql(gameStub);
        });

        it('setGame() should call playTurn() if it is the bot turn', () => {
            gameStub.turn.activePlayer = bot.name;
            const stubChooseMove = Sinon.stub(bot, 'playTurn');
            bot.setGame(gameStub);
            expect(stubChooseMove.calledOnce).to.equal(true);
        });
    });

    context('start() tests with timer of 60 seconds', () => {
        let mockSkip: Sinon.SinonMock;
        beforeEach(() => {
            bot.setGame(gameStub);
            mockSkip = Sinon.mock(bot);
        });

        afterEach(() => {
            Sinon.restore();
            bot['game'].turn.countdown.unsubscribe();
            bot['game'].turn.endTurn.unsubscribe();
            mockSkip.restore();
        });

        it('should call skipTurn() if 20 seconds have passed in the timer and it is the bot turn', () => {
            mockSkip.expects('skipTurn').exactly(1);
            bot['game'].turn.activePlayer = bot.name;
            bot.start();
            bot.game.turn.countdown.next(40);
            mockSkip.verify();
        });

        it('should not call skipTurn() time passed is not 20 seconds', () => {
            mockSkip.expects('skipTurn').never();
            bot['playedTurned'] = false;
            bot.start();
            gameStub.turn.countdown.next(50);
            mockSkip.verify();
        });

        it('should not call skipTurn() if it is not the bot turn', () => {
            mockSkip.expects('skipTurn').never();
            bot.start();
            gameStub.turn.countdown.next(40);
            gameStub.turn.activePlayer = 'notBotName';
            mockSkip.verify();
        });

        it('should reset countUp attribute and call playTurn() if it is bot turn', () => {
            mockSkip.expects('playTurn').exactly(1);
            bot['countUp'] = 2;
            bot.start();
            bot.game.turn.endTurn.next(bot.name);
            mockSkip.verify();
            expect(bot['countUp']).to.equal(0);
        });

        it('should not call playTurn() if it is not botTurn', () => {
            mockSkip.expects('playTurn').never();
            bot.start();
            bot.game.turn.endTurn.next('notBotName');
            mockSkip.verify();
        });
    });

    context('skipTurn() tests', () => {
        let mockSocketManager: Sinon.SinonMock;
        beforeEach(() => {
            mockSocketManager = Sinon.mock(bot['socketManager']);
            bot.game = gameStub;
        });

        afterEach(() => {
            mockSocketManager.restore();
        });

        it('should not call game.skip() if game is undefined', () => {
            const expectation = mockSocketManager.expects('emitRoom').never();
            bot.game = undefined as never;
            bot.skipTurn();
            expectation.verify();
            expect(gameStub.skip.called).to.equal(false);
        });

        it('should call game.skip() with correct name as an argument if game is not undefined', () => {
            const expectation = mockSocketManager.expects('emitRoom').exactly(1).withArgs(bot['botInfo'].roomId);
            bot.skipTurn();
            expectation.verify();
            expect(gameStub.skip.calledOnce).to.equal(true);
        });
    });

    context('play tests', () => {
        let mockGame: Sinon.SinonMock;
        let mockSocketManager: Sinon.SinonMock;
        beforeEach(() => {
            Sinon.restore();
            mockGame = Sinon.mock(bot['game']);
            mockSocketManager = Sinon.mock(bot['socketManager']);
            bot.game.letterReserve = new LetterReserve();
        });

        afterEach(() => {
            mockGame.restore();
            mockSocketManager.restore();
        });

        it('should call skipTurn() if commandInfo is undefined', () => {
            mockGame.expects('skip').exactly(1).calledWithExactly(bot.name);
            mockSocketManager.expects('emitRoom').exactly(1).calledWithExactly(bot.roomId, SocketEvents.GameMessage, '!passer');
            const commandInfoStub = undefined as never;
            const spySkipTurn = Sinon.spy(bot, 'skipTurn');
            bot['play'](commandInfoStub);
            mockGame.verify();
            mockSocketManager.verify();
            expect(spySkipTurn.calledOnce).to.be.equal(true);
        });

        it('should call emitPlaceCommand() if commandInfo is not undefined and playedTurn is set to false', () => {
            const commandInfoStub: CommandInfo = {
                firstCoordinate: { x: 1, y: 1 } as Coordinate,
                isHorizontal: true,
                letters: ['t', 'e', 's', 't'],
            };
            bot['playedTurned'] = false;
            mockGame.expects('play').exactly(1).withExactArgs(bot, commandInfoStub);
            mockSocketManager.expects('emitRoom').exactly(2);
            const spyEmitCommand = Sinon.spy(bot, 'emitPlaceCommand' as keyof Bot);
            bot['play'](commandInfoStub);
            mockGame.verify();
            mockSocketManager.verify();
            expect(spyEmitCommand.calledOnceWithExactly(commandInfoStub)).to.be.equal(true);
        });
    });

    context('emitPlacementCommand() tests and placement is horizontal', () => {
        it('should emitRoom() with correct arguments', () => {
            bot.game.letterReserve = new LetterReserve();
            const commandInfoStub: CommandInfo = {
                firstCoordinate: { x: 1, y: 1 } as Coordinate,
                isHorizontal: true,
                letters: ['t', 'e', 's', 't'],
            };
            const expectedCommand = '!placer a1h test';
            const mockSocketManager = Sinon.mock(bot['socketManager']);
            const expectation = mockSocketManager
                .expects('emitRoom')
                .exactly(1)
                .withArgs(bot['botInfo'].roomId, SocketEvents.GameMessage, expectedCommand);
            mockSocketManager
                .expects('emitRoom')
                .exactly(1)
                .withArgs(bot.room, SocketEvents.LetterReserveUpdated, bot['game'].letterReserve.lettersReserve);
            bot['emitPlaceCommand'](commandInfoStub);
            expectation.verify();
            mockSocketManager.restore();
        });

        it('should emitRoom() with correct arguments and placement is vertical', () => {
            bot.game.letterReserve = new LetterReserve();
            const commandInfoStub: CommandInfo = {
                firstCoordinate: { x: 1, y: 1 } as Coordinate,
                isHorizontal: false,
                letters: ['t', 'e', 's', 't'],
            };
            const expectedCommand = '!placer a1v test';
            const mockSocketManager = Sinon.mock(bot['socketManager']);
            const expectation = mockSocketManager
                .expects('emitRoom')
                .exactly(1)
                .withArgs(bot['botInfo'].roomId, SocketEvents.GameMessage, expectedCommand);
            mockSocketManager
                .expects('emitRoom')
                .exactly(1)
                .withArgs(bot.room, SocketEvents.LetterReserveUpdated, bot['game'].letterReserve.lettersReserve);
            bot['emitPlaceCommand'](commandInfoStub);
            expectation.verify();
            mockSocketManager.restore();
        });
    });

    it('processWordSolver() should call setGameboard() and commandInfoScore()', () => {
        bot.setGame(gameStub);
        bot['processWordSolver']();
        expect(wordSolverStub.commandInfoScore.calledOnce && wordSolverStub.setGameboard.calledOnce).to.equal(true);
    });

    it('getRandomNumber() should return correct number depending on the max number passed as a parameter', () => {
        const MAX_NUMBER = 10;
        const MATH_RANDOM_RETURN = 0.5;
        const EXPECTED_RESULT = 6;
        stubMathRandom.returns(MATH_RANDOM_RETURN);
        expect(bot['getRandomNumber'](MAX_NUMBER)).to.equal(EXPECTED_RESULT);
    });

    it('playTurn() tests', () => {
        bot.playTurn();
    });
});
