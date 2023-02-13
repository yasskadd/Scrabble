/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { BotInformation } from '@app/interfaces/bot-information';
import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { Letter } from '@common/interfaces/letter';
import { expect } from 'chai';
import { ReplaySubject } from 'rxjs';
import * as Sinon from 'sinon';
import { BeginnerBot } from './beginner-bot.class';

describe('BotBeginner', () => {
    let botBeginner: BeginnerBot;
    let gameStub: Sinon.SinonStubbedInstance<Game> & Game;
    let botInfo: BotInformation;
    let wordSolverStub: Sinon.SinonStubbedInstance<WordSolver> & WordSolver;
    let dictionaryValidation: Sinon.SinonStubbedInstance<DictionaryValidation> & DictionaryValidation;

    beforeEach(() => {
        gameStub = Sinon.createStubInstance(Game) as Sinon.SinonStubbedInstance<Game> & Game;
        gameStub.turn = { countdown: new ReplaySubject(), endTurn: new ReplaySubject() } as Turn;
        wordSolverStub = Sinon.createStubInstance(WordSolver) as Sinon.SinonStubbedInstance<WordSolver> & WordSolver;
        dictionaryValidation = Sinon.createStubInstance(DictionaryValidation) as Sinon.SinonStubbedInstance<DictionaryValidation> &
            DictionaryValidation;
        botInfo = {
            timer: 60,
            roomId: 'testRoom',
            dictionaryValidation: dictionaryValidation as Sinon.SinonStubbedInstance<DictionaryValidation> & DictionaryValidation,
        };
        botBeginner = new BeginnerBot(true, 'robot', botInfo);
        botBeginner['wordSolver'] = wordSolverStub;
        botBeginner.setGame(gameStub);
    });

    context('inRange() tests', () => {
        let START: number;
        let END: number;
        const END_VALUE = 5;
        const VALUE_NOT_IN_RANGE = 10;
        beforeEach(() => {
            START = 0;
            END = END_VALUE;
        });

        it('should return true if the number passed as a parameter is in range', () => {
            expect(botBeginner['inRange'](1, START, END)).to.equal(true);
        });

        it('should return true if number passed as a parameter is equal to START', () => {
            expect(botBeginner['inRange'](START, START, END)).to.equal(true);
        });

        it('should return true if number passed as a parameter is equal to END', () => {
            expect(botBeginner['inRange'](END_VALUE, START, END)).to.equal(true);
        });

        it('should return false if number passed as a parameter is not in range', () => {
            expect(botBeginner['inRange'](VALUE_NOT_IN_RANGE, START, END)).to.equal(false);
        });

        it('should return false if number passed as a parameter is not in range and is negative', () => {
            gameStub.turn.countdown.next(3);
            expect(botBeginner['inRange'](-VALUE_NOT_IN_RANGE, START, END)).to.equal(false);
        });
    });

    context('playTurn() tests', () => {
        let mockBot: Sinon.SinonMock;
        let stubGetRandom: Sinon.SinonStub<unknown[], unknown>;
        let clock: Sinon.SinonFakeTimers;
        beforeEach(() => {
            stubGetRandom = Sinon.stub(botBeginner, 'getRandomNumber' as never);
            mockBot = Sinon.mock(botBeginner);
            clock = Sinon.useFakeTimers();
        });

        afterEach(() => {
            mockBot.restore();
            clock.restore();
        });

        it('should call skipTurn() if random number is equal to 1', () => {
            mockBot.expects('skipTurn').exactly(1);
            stubGetRandom.returns(1);
            botBeginner.playTurn();
            clock.tick(3500);
            mockBot.verify();
        });

        it('should not call skipTurn() and placeLetters() if random number is not equal to 1', () => {
            mockBot.expects('skipTurn').never();
            mockBot.expects('placeLetters').never();
            mockBot.expects('exchangeLetters').exactly(1);
            stubGetRandom.returns(2);
            botBeginner.playTurn();
            clock.tick(3500);
            mockBot.verify();
        });

        it('should call exchangeLetter() if random number is equal to 2', () => {
            mockBot.expects('exchangeLetters').exactly(1);
            stubGetRandom.returns(2);
            botBeginner.playTurn();
            clock.tick(3500);
            mockBot.verify();
        });

        it('should not call exchangeLetters() and placeLetters() if random number is equal to 1', () => {
            mockBot.expects('exchangeLetters').never();
            mockBot.expects('placeLetters').never();
            mockBot.expects('skipTurn').exactly(1);
            stubGetRandom.returns(1);
            botBeginner.playTurn();
            clock.tick(3500);
            mockBot.verify();
        });

        it('should call placeLetters() if random number is between 3 and 10', () => {
            mockBot.expects('placeLetters').exactly(1);
            stubGetRandom.returns(3);
            botBeginner.playTurn();
            mockBot.verify();
        });
    });

    context('exchangeLetters() tests', () => {
        let stubGetRandom: Sinon.SinonStub<unknown[], unknown>;
        let mockSocketManager: Sinon.SinonMock;
        let stubTotalQuantity: Sinon.SinonStub<[], number>;
        beforeEach(() => {
            stubGetRandom = Sinon.stub(botBeginner, 'getRandomNumber' as keyof BeginnerBot);
            botBeginner.rack = [{ value: 'a' } as Letter, { value: 'b' } as Letter, { value: 'c' } as Letter];
            mockSocketManager = Sinon.mock(botBeginner['socketManager']);
            botBeginner.setGame(gameStub);
            botBeginner['game'].letterReserve = new LetterReserve();
            stubTotalQuantity = Sinon.stub(botBeginner['game'].letterReserve, 'totalQuantity').returns(20);
        });

        afterEach(() => {
            mockSocketManager.restore();
            Sinon.restore();
        });

        it('should call game.exchange() with correct letters to exchange and this parameter', () => {
            botBeginner['playedTurned'] = false;
            const expectation = mockSocketManager.expects('emitRoom').exactly(1);
            stubGetRandom.onFirstCall().returns(2);
            stubGetRandom.returns(1);
            const expectedRack: string[] = ['a', 'b'];
            botBeginner.exchangeLetters();
            expectation.verify();
            expect(gameStub.exchange.calledOnceWithExactly(expectedRack, botBeginner)).to.equal(true);
        });

        it('should not call game.exchange() if this.game is undefined', () => {
            botBeginner.game = undefined as never;
            botBeginner.exchangeLetters();
            expect(gameStub.exchange.called).to.be.equal(false);
        });

        it('should not call game.exchange() if playedTurn is set to true', () => {
            botBeginner['playedTurned'] = true;
            botBeginner.exchangeLetters();
            expect(gameStub.exchange.called).to.be.equal(false);
        });

        it('should not call game.exchange() if there is less than 7 letters in letterReserve and should skipTurn() after 20 seconds', () => {
            const mockSkipTurn = Sinon.mock(botBeginner).expects('skipTurn').exactly(1);
            const clock = Sinon.useFakeTimers();
            botBeginner['playedTurned'] = false;
            stubTotalQuantity.returns(5);
            botBeginner.game.turn.activePlayer = botBeginner.name;
            botBeginner.start();
            botBeginner.exchangeLetters();
            botBeginner.game.turn.countdown.next(40);
            clock.restore();
            mockSkipTurn.verify();
            botBeginner.game.turn.countdown.unsubscribe();
            expect(gameStub.exchange.called).to.be.equal(false);
        });
    });

    context('addCommandInfoToList() tests', () => {
        let commandInfoMapStub: Map<CommandInfo, number>;
        beforeEach(() => {
            commandInfoMapStub = new Map();
        });

        it('should add commandInfo to list with random number being 3 and commandInfo score in range from 1 to 6', () => {
            const RANDOM_NUMBER = 3;
            commandInfoMapStub.set({} as CommandInfo, 1);
            commandInfoMapStub.set({} as CommandInfo, 3);
            commandInfoMapStub.set({} as CommandInfo, 6);
            commandInfoMapStub.set({} as CommandInfo, 8);
            expect(botBeginner['addCommandInfoToList'](commandInfoMapStub, RANDOM_NUMBER).length).to.equal(3);
        });

        it('should add commandInfo to list with random number being 6 and commandInfo score in range from 7 to 12', () => {
            const RANDOM_NUMBER = 6;
            commandInfoMapStub.set({} as CommandInfo, 1);
            commandInfoMapStub.set({} as CommandInfo, 3);
            commandInfoMapStub.set({} as CommandInfo, 7);
            commandInfoMapStub.set({} as CommandInfo, 12);
            expect(botBeginner['addCommandInfoToList'](commandInfoMapStub, RANDOM_NUMBER).length).to.equal(2);
        });

        it('should add commandInfo to list with random number being 8 and commandInfo score in range from 13 to 18', () => {
            const RANDOM_NUMBER = 8;
            commandInfoMapStub.set({} as CommandInfo, 1);
            commandInfoMapStub.set({} as CommandInfo, 3);
            commandInfoMapStub.set({} as CommandInfo, 7);
            commandInfoMapStub.set({} as CommandInfo, 15);
            expect(botBeginner['addCommandInfoToList'](commandInfoMapStub, RANDOM_NUMBER).length).to.equal(1);
        });
    });

    context('placeLetters() tests', () => {
        let stubCommandInfoToList: Sinon.SinonStub<unknown[], unknown>;
        let mockWordSolver: Sinon.SinonMock;
        let mockBot: Sinon.SinonMock;
        let clock: Sinon.SinonFakeTimers;
        let commandInfoStub: CommandInfo;
        before(() => {
            commandInfoStub = {
                firstCoordinate: { x: 1, y: 1 } as Coordinate,
                isHorizontal: true,
                letters: ['t', 'e', 's', 't'],
            };
        });

        beforeEach(() => {
            Sinon.restore();
            stubCommandInfoToList = Sinon.stub(botBeginner, 'addCommandInfoToList' as keyof BeginnerBot);
            mockWordSolver = Sinon.mock(wordSolverStub);
            mockBot = Sinon.mock(botBeginner);
            clock = Sinon.useFakeTimers();
        });

        afterEach(() => {
            mockWordSolver.restore();
            mockBot.restore();
            clock.restore();
        });

        it('should call skipTurn() after 3 seconds if commandInfoList is empty', () => {
            mockWordSolver.expects('findAllOptions').exactly(1);
            mockWordSolver.expects('commandInfoScore').exactly(1);
            mockBot.expects('skipTurn').exactly(1);
            stubCommandInfoToList.returns([]);
            botBeginner['placeLetters']();
            clock.tick(3500);
            mockBot.verify();
            mockWordSolver.verify();
        });

        it('should call play() if countUp is between 3 and 20 seconds', () => {
            mockBot.expects('play').exactly(1).withExactArgs(commandInfoStub);
            mockWordSolver.expects('findAllOptions').exactly(1);
            mockWordSolver.expects('commandInfoScore').exactly(1);
            stubCommandInfoToList.returns([commandInfoStub]);
            botBeginner['countUp'] = 5;
            botBeginner['placeLetters']();
            mockBot.verify();
            mockWordSolver.verify();
        });

        it('should call play() after a delay if countUp is less than 3 seconds', () => {
            mockBot.expects('play').exactly(1).withExactArgs(commandInfoStub);
            mockWordSolver.expects('findAllOptions').exactly(1);
            mockWordSolver.expects('commandInfoScore').exactly(1);
            stubCommandInfoToList.returns([commandInfoStub]);
            botBeginner['countUp'] = 1;
            botBeginner['placeLetters']();
            clock.tick(3500);
            mockWordSolver.verify();
            mockBot.verify();
        });

        it('should not call play() if countUp is greater than 20 seconds', () => {
            mockBot.expects('play').never();
            mockWordSolver.expects('findAllOptions').exactly(1);
            mockWordSolver.expects('commandInfoScore').exactly(1);
            stubCommandInfoToList.returns([commandInfoStub]);
            botBeginner['countUp'] = 25;
            botBeginner['placeLetters']();
            clock.tick(3500);
            mockWordSolver.verify();
            mockBot.verify();
        });
    });
});
