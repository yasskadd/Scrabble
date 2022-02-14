/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { SinonFakeTimers, spy, useFakeTimers } from 'sinon';
import { Player } from './player.class';
import { Turn } from './turn';

const SECOND = 1000;

describe('TurnService', () => {
    let turnService: Turn;
    let clock: SinonFakeTimers;
    let time: number;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
        time = 30;
        turnService = new Turn(time);
        clock = useFakeTimers();
        player1 = new Player('player1');
        player2 = new Player('player2');
    });

    afterEach(() => {
        clock.restore();
    });

    it('start() should start the timer and not end it when there is still time left on the clock', () => {
        turnService.start();
        const endSpy = spy(turnService, 'end');
        clock.tick(SECOND);
        expect(endSpy.called).to.be.false;
    });

    it('start() should start the timer and  end it when the time up', () => {
        turnService.start();
        const endSpy = spy(turnService, 'end');
        clock.tick(time * SECOND);
        expect(endSpy.called).to.be.true;
    });

    it('determinePlayer() should initialize activePlayer and inactivePlayer both different from each other', () => {
        turnService.determinePlayer(player1, player2);
        const activePlayer = turnService.activePlayer;
        const inactivePlayer = turnService.inactivePlayer;
        expect(activePlayer).to.not.undefined;
        expect(inactivePlayer).to.not.undefined;
        expect(activePlayer).to.not.equal(inactivePlayer);
    });

    it('end() should end the activePlayer turn and start the inactivePlayer turn', () => {
        turnService.activePlayer = player1.name;
        turnService.inactivePlayer = player2.name;
        const startSpy = spy(turnService, 'start');
        // turnService.start();
        turnService.end();

        expect(startSpy.called).to.be.true;
        expect(turnService.activePlayer).to.equal(player2.name);
        expect(turnService.inactivePlayer).to.equal(player1.name);
    });

    it('end() should not start anyone turn if true is entered as parameter to signal the ending of the game', () => {
        turnService.activePlayer = player1.name;
        turnService.inactivePlayer = player2.name;
        const spyStart = spy(turnService, 'start');
        turnService.end(true);

        expect(spyStart.called).to.be.false;
        expect(turnService.activePlayer).to.equal(undefined);
    });

    it('validating() should return true if it is the turn of the player entered as the parameter to play', () => {
        turnService.activePlayer = player1.name;
        turnService.inactivePlayer = player2.name;
        const validated = turnService.validating(player1.name);

        expect(validated).to.be.true;
    });

    it('validating() should return false if it is not the turn of the player entered as the parameter to play', () => {
        turnService.activePlayer = player2.name;
        turnService.inactivePlayer = player1.name;
        const validated = turnService.validating(player1.name);

        expect(validated).to.be.false;
    });

    it('skipTurn() should increment skipCounter by 1', () => {
        turnService.skipTurn();

        // eslint-disable-next-line dot-notation
        expect(turnService['skipCounter']).to.equal(1);
    });

    it('skipTurn() should call end with true as argument when the skipCounter is at 6', () => {
        const endSpy = spy(turnService, 'end');
        // eslint-disable-next-line dot-notation
        turnService['skipCounter'] = 5;
        turnService.skipTurn();

        // eslint-disable-next-line dot-notation
        expect(endSpy.calledWith(true)).to.be.true;
    });

    it('skipTurn() should call end without true as argument when the skipCounter is not at 6', () => {
        const endSpy = spy(turnService, 'end');
        // eslint-disable-next-line dot-notation
        turnService['skipCounter'] = 4;
        turnService.skipTurn();

        // eslint-disable-next-line dot-notation
        expect(endSpy.calledWith(true)).to.be.false;
    });

    it('resetSkipCounter() should assign skipCounter to 0', () => {
        // eslint-disable-next-line dot-notation
        turnService['skipCounter'] = 4;
        turnService.resetSkipCounter();

        // eslint-disable-next-line dot-notation
        expect(turnService['skipCounter']).to.equal(0);
    });

    it('incrementSkipCounter() should increment skipCounter by 1', () => {
        // eslint-disable-next-line dot-notation
        turnService['incrementSkipCounter']();

        // eslint-disable-next-line dot-notation
        expect(turnService['skipCounter']).to.equal(1);
    });
});
