/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable dot-notation */
import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { BotInformation } from '@app/interfaces/bot-information';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { Letter } from '@common/interfaces/letter';
import { expect } from 'chai';
import { ReplaySubject } from 'rxjs';
import * as Sinon from 'sinon';
import { ExpertBot } from './expert-bot.class';

describe('Expert Bot Tests', () => {
    let expertBot: ExpertBot;
    let gameStub: Sinon.SinonStubbedInstance<Game> & Game;
    let botInfo: BotInformation;
    let wordSolverStub: Sinon.SinonStubbedInstance<WordSolver>;
    let dictionaryValidation: Sinon.SinonStubbedInstance<DictionaryValidation> & DictionaryValidation;
    let mockEmitRoom: Sinon.SinonExpectation;
    let mockEmitPlaceCommand: Sinon.SinonExpectation;
    beforeEach(() => {
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
        expertBot = new ExpertBot(true, 'robot', botInfo);
        expertBot['wordSolver'] = wordSolverStub as never;
        expertBot.setGame(gameStub);
        expertBot['game'].letterReserve = new LetterReserve();
        mockEmitRoom = Sinon.mock(expertBot['socketManager']).expects('emitRoom');
        mockEmitPlaceCommand = Sinon.mock(expertBot).expects('emitPlaceCommand');
    });

    afterEach(() => {
        Sinon.restore();
    });

    context('play Tests', () => {
        let spyExchangeLetters: Sinon.SinonSpy;
        beforeEach(() => {
            spyExchangeLetters = Sinon.spy(expertBot, 'exchangeLetters');
        });

        it('should call exchangeLetters() and not EmitPlaceCommand() if there is no existing commandInfo', () => {
            const undefinedCommandInfo = undefined as never;
            expertBot.play(undefinedCommandInfo);
            mockEmitPlaceCommand.never().verify();
            mockEmitRoom.exactly(1).verify();
            expect(spyExchangeLetters.calledOnce).to.be.equal(true);
        });

        it('should call EmitPlaceCommand() and not exchangeLetters() if CommandInfo is not undefined', () => {
            const commandInfoStub = {} as CommandInfo;
            expertBot.play(commandInfoStub);
            mockEmitPlaceCommand.exactly(1).withExactArgs(commandInfoStub).verify();
            expect(spyExchangeLetters.called).to.be.equal(false);
        });
    });

    context('exchangeLetters() tests', () => {
        let mockSkipTurn: Sinon.SinonExpectation;
        let stubReserveQuantity: Sinon.SinonStub;
        let stubGetRandom: Sinon.SinonStub;
        let rackStub: Letter[];
        beforeEach(() => {
            mockSkipTurn = Sinon.mock(expertBot).expects('skipTurn');
            stubReserveQuantity = Sinon.stub(expertBot.game.letterReserve, 'totalQuantity');
            stubGetRandom = Sinon.stub(expertBot, 'getRandomNumber' as keyof ExpertBot);
            rackStub = [
                { value: 'a' } as Letter,
                { value: 'b' } as Letter,
                { value: 'c' } as Letter,
                { value: 'd' } as Letter,
                { value: 'e' } as Letter,
                { value: 'f' } as Letter,
                { value: 'g' } as Letter,
            ];
            expertBot.rack = rackStub;
        });

        it('should call skipTurn() if there is 0 letters left in the letter reserve', () => {
            stubReserveQuantity.returns(0);
            expertBot.exchangeLetters();
            mockSkipTurn.exactly(1).verify();
        });

        it('should call emitRoom and exchange Letters from rack if there is 7 or more letters in the reserve', () => {
            stubReserveQuantity.returns(7);
            expertBot.exchangeLetters();
            mockEmitRoom.exactly(1).withExactArgs(expertBot['botInfo'].roomId, SocketEvents.GameMessage, '!echanger 7 lettres').verify();
            expect(gameStub.exchange.calledOnceWithExactly(['a', 'b', 'c', 'd', 'e', 'f', 'g'], expertBot)).to.be.equal(true);
        });

        it('should call emitRoom and exchange all letters from rack if there is less than 7 letters in rack and more letters in reserve', () => {
            const expectedLettersToExchange = ['c', 'a', 'b'];
            expertBot.rack = rackStub.slice(0, 3);
            stubGetRandom.onFirstCall().returns(3).returns(1);
            stubReserveQuantity.returns(5);
            expertBot.exchangeLetters();
            mockEmitRoom.exactly(1).withExactArgs(expertBot['botInfo'].roomId, SocketEvents.GameMessage, '!echanger 3 lettres').verify();
            expect(gameStub.exchange.calledOnceWithExactly(expectedLettersToExchange, expertBot)).to.be.equal(true);
        });

        it('should call emitRoom and exchange random letters from rack if there is less than 7 letters in the reserve', () => {
            const expectedLettersToExchange = ['g', 'a', 'b'];
            stubGetRandom.onFirstCall().returns(7).returns(1);
            stubReserveQuantity.returns(3);
            expertBot.exchangeLetters();
            mockEmitRoom.exactly(1).withExactArgs(expertBot['botInfo'].roomId, SocketEvents.GameMessage, '!echanger 3 lettres').verify();
            expect(gameStub.exchange.calledOnceWithExactly(expectedLettersToExchange, expertBot)).to.be.equal(true);
        });

        it('should return at the beginning of method if game is undefined', () => {
            expertBot.game = undefined as never;
            expertBot.exchangeLetters();
            mockSkipTurn.never().verify();
            mockEmitRoom.never().verify();
            expect(gameStub.exchange.called).to.be.equal(false);
        });

        it('should return at the beginning of method if playedTurn is true', () => {
            expertBot['playedTurned'] = true;
            expertBot.exchangeLetters();
            mockSkipTurn.never().verify();
            mockEmitRoom.never().verify();
            expect(gameStub.exchange.called).to.be.equal(false);
        });
    });

    context('playTurn() Tests', () => {
        let spyPlay: Sinon.SinonSpy;
        let stubProcessWordSolver: Sinon.SinonStub;
        let stubMapCommandInfo: Map<CommandInfo, number>;
        let stubCommandInfo1: CommandInfo;
        let stubCommandInfo2: CommandInfo;
        let stubCommandInfo3: CommandInfo;
        beforeEach(() => {
            spyPlay = Sinon.spy(expertBot, 'play');
            stubProcessWordSolver = Sinon.stub(expertBot, 'processWordSolver' as keyof ExpertBot);
            stubCommandInfo1 = { firstCoordinate: { x: 1, y: 1 } as Coordinate } as CommandInfo;
            stubCommandInfo2 = { firstCoordinate: { x: 5, y: 5 } as Coordinate } as CommandInfo;
            stubCommandInfo3 = { firstCoordinate: { x: 8, y: 8 } as Coordinate } as CommandInfo;
            stubMapCommandInfo = new Map([
                [stubCommandInfo1, 20],
                [stubCommandInfo2, 50],
                [stubCommandInfo3, 30],
            ]);
        });

        afterEach(() => {
            expertBot['game'].turn.countdown.unsubscribe();
            expertBot['game'].turn.endTurn.unsubscribe();
        });

        it('should call play() with best CommandInfo if timer is between 3 and 20 seconds', () => {
            stubProcessWordSolver.returns(stubMapCommandInfo);
            expertBot.game.turn.countdown.next(45);
            expertBot.start();
            expertBot.playTurn();
            expect(spyPlay.calledOnceWithExactly(stubCommandInfo2)).to.be.equal(true);
        });

        it('should call play() with undefined commandInfo if there is no existing commandInfo if timer is between 3 and 20 seconds', () => {
            stubProcessWordSolver.returns(new Map());
            expertBot.game.turn.countdown.next(45);
            expertBot.start();
            expertBot.playTurn();
            expect(spyPlay.calledOnceWithExactly(undefined)).to.be.equal(true);
        });

        it('should wait 3 seconds to call play() with best CommandInfo if timer is less than 3 seconds', () => {
            const clock = Sinon.useFakeTimers();
            stubProcessWordSolver.returns(stubMapCommandInfo);
            expertBot.start();
            expertBot.game.turn.countdown.next(58);
            expertBot.playTurn();
            clock.tick(2500);
            expect(spyPlay.calledOnceWithExactly(stubCommandInfo2)).to.be.equal(true);
        });

        it('should not call play() if more than 20 seconds have passed', () => {
            stubProcessWordSolver.returns(stubMapCommandInfo);
            expertBot.start();
            expertBot.game.turn.countdown.next(30);
            expertBot.playTurn();
            expect(spyPlay.called).to.be.equal(false);
        });
    });
});
