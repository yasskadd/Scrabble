/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Player } from '@app/classes/player';
import { expect } from 'chai';
import { createStubInstance, SinonStubbedInstance, spy } from 'sinon';
import { GameService } from './game.service';
import { LetterReserveService } from './letter-reserve.service';
import { TurnService } from './turn.service';

describe('GameService', () => {
    let gameService: GameService;
    let player1: Player;
    let player2: Player;
    let turnService: SinonStubbedInstance<TurnService> & TurnService;
    let letterReserveService: SinonStubbedInstance<LetterReserveService>;

    beforeEach(() => {
        player1 = new Player('player1');
        player2 = new Player('player2');
        turnService = createStubInstance(TurnService) as SinonStubbedInstance<TurnService> & TurnService;
        letterReserveService = createStubInstance(LetterReserveService);
        gameService = new GameService(player1, player2, turnService, letterReserveService);
    });

    it('start() should call generateLetter of letterReserveService two times', () => {
        gameService.start();
        expect(letterReserveService.generateLetters.callCount).to.equal(2);
    });

    it('start() should call determinePlayer', () => {
        gameService.start();
        expect(turnService.determinePlayer.called).to.be.true;
    });

    it('start() should call start of turnService', () => {
        gameService.start();
        expect(turnService.start.called).to.be.true;
    });

    it('end() should called end of turnService', () => {
        gameService.end();
        expect(turnService.end.called).to.be.true;
    });

    // it('skip() should return false if no player has skipped', () => {
    //     const skip = gameService.skip('undefined');
    //     // turnService.validating.callsFake(() => {
    //     //     return true;
    //     // });
    //     expect(skip).to.be.false;
    // });

    it('skip() should return true and end turn of player1 on skip', () => {
        turnService.validating.returns(true);
        const skip = gameService.skip(player1.name);
        expect(skip).to.be.true;
        expect(turnService.end.called).to.be.true;
    });

    it('skip() should return true and end turn of player2 on skip', () => {
        turnService.validating.returns(true);
        const skip = gameService.skip(player2.name);
        expect(skip).to.be.true;
        expect(turnService.end.called).to.be.true;
    });

    it('skip() should return false if a player wants to skip but it is not his turn', () => {
        turnService.validating.returns(false);
        const skip = gameService.skip(player1.name);
        expect(skip).to.be.false;
        expect(turnService.end.called).to.be.false;
    });

    it('play() should return true and end turn of player1 on play', () => {
        turnService.validating.returns(true);
        gameService.play(player1.name);
        // expect(play).to.be.true;
        expect(turnService.end.called).to.be.true;
    });

    it('play() should return true and end turn of player2 on play', () => {
        turnService.validating.returns(true);
        gameService.play(player2.name);
        // expect(play).to.be.true;
        expect(turnService.end.called).to.be.true;
    });

    it('play() should return nothing? if a player wants to play but it is not his turn', () => {
        turnService.validating.returns(false);
        gameService.play(player1.name);
        // expect(skip).to.be.false;
        expect(turnService.end.called).to.be.false;
    });

    it('exchange() should return the new player1 rack and end turn of player1 on exchange', () => {
        const oldPlayer2Rack = player2.rack;
        const lettersToExchange = player1.rack;
        turnService.validating.returns(true);
        const exchange = gameService.exchange(lettersToExchange, player1.name);
        expect(exchange).to.not.equal(lettersToExchange);
        expect(turnService.end.called).to.be.true;
        expect(oldPlayer2Rack).to.equal(player2.rack);
    });

    it('exchange() should return the new player2 rack and end turn of player2 on exchange', () => {
        const oldPlayer1Rack = player1.rack;
        const lettersToExchange = player2.rack;
        turnService.validating.returns(true);
        const exchange = gameService.exchange(lettersToExchange, player2.name);
        expect(exchange).to.not.equal(lettersToExchange);
        expect(turnService.end.called).to.be.true;
        expect(oldPlayer1Rack).to.equal(player1.rack);
    });

    it('exchange() should return an empty array if a player wants to exchange but it is not his turn', () => {
        const lettersToExchange = player1.rack;
        turnService.validating.returns(false);
        const exchange = gameService.exchange(lettersToExchange, player1.name);
        expect(exchange).to.deep.equal([]);
    });

    it('abandon() should called end of gameService', () => {
        const spyEnd = spy(gameService, 'end');
        gameService.abandon();
        expect(spyEnd.called).to.be.true;
        expect(turnService.end.called).to.be.true;
    });
});
