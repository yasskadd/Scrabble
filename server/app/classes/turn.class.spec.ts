import { expect } from 'chai';
import { restore, SinonFakeTimers, spy, stub, useFakeTimers } from 'sinon';
import { Player } from './player/player.class';
import { Turn } from './turn.class';

const SECOND = 1000;

describe('turn', () => {
    let turn: Turn;
    let clock: SinonFakeTimers;
    let time: number;
    let player1: Player;
    let player2: Player;

    beforeEach(() => {
        // Reason : magic number for tests
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        time = 30;
        turn = new Turn(time);
        clock = useFakeTimers();
        player1 = new Player('player1');
        player2 = new Player('player2');
    });

    afterEach(() => {
        clock.restore();
        restore();
    });

    it('start() should start the timer and not skip it when there is still time left on the clock', () => {
        turn.start();
        const skipTurnSpy = spy(turn, 'skipTurn');
        clock.tick(SECOND);
        expect(skipTurnSpy.called).to.equal(false);
    });

    it('start() should start the timer and skip it when the time up', () => {
        turn.start();
        const skipTurnSpy = spy(turn, 'skipTurn');
        clock.tick(time * SECOND);
        expect(skipTurnSpy.called).to.equal(true);
    });

    it('determinePlayer() should initialize activePlayer and inactivePlayer both different from each other', () => {
        turn.determinePlayer(player1, player2);
        const activePlayer = turn.activePlayer;
        const inactivePlayer = turn.inactivePlayer;
        expect(activePlayer).to.not.equal(undefined);
        expect(inactivePlayer).to.not.equal(undefined);
        expect(activePlayer).to.not.equal(inactivePlayer);
    });

    it('determinePlayer() should initialize activePlayer and inactivePlayer both different from each other when random number is 0', () => {
        stub(Math, 'floor').returns(0);
        turn.determinePlayer(player1, player2);
        const activePlayer = turn.activePlayer;
        const inactivePlayer = turn.inactivePlayer;
        expect(activePlayer).to.not.equal(undefined);
        expect(inactivePlayer).to.not.equal(undefined);
        expect(activePlayer).to.not.equal(inactivePlayer);
    });

    it('determinePlayer() should initialize activePlayer and inactivePlayer both different from each other when random number is 1', () => {
        stub(Math, 'floor').returns(1);
        turn.determinePlayer(player1, player2);
        const activePlayer = turn.activePlayer;
        const inactivePlayer = turn.inactivePlayer;
        expect(activePlayer).to.not.equal(undefined);
        expect(inactivePlayer).to.not.equal(undefined);
        expect(activePlayer).to.not.equal(inactivePlayer);
    });

    it('end() should end the activePlayer turn and start the inactivePlayer turn', () => {
        turn.activePlayer = player1.name;
        turn.inactivePlayer = player2.name;
        const startSpy = spy(turn, 'start');
        turn.end();

        expect(startSpy.called).to.equal(true);
        expect(turn.activePlayer).to.equal(player2.name);
        expect(turn.inactivePlayer).to.equal(player1.name);
    });

    it('end() should not start anyone turn if true is entered as parameter to signal the ending of the game', () => {
        turn.activePlayer = player1.name;
        turn.inactivePlayer = player2.name;
        const spyStart = spy(turn, 'start');
        turn.end(true);

        expect(spyStart.called).to.equal(false);
        expect(turn.activePlayer).to.equal(undefined);
    });

    it('validating() should return true if it is the turn of the player entered as the parameter to play', () => {
        turn.activePlayer = player1.name;
        turn.inactivePlayer = player2.name;
        const validated = turn.validating(player1.name);

        expect(validated).to.equal(true);
    });

    it('validating() should return false if it is not the turn of the player entered as the parameter to play', () => {
        turn.activePlayer = player2.name;
        turn.inactivePlayer = player1.name;
        const validated = turn.validating(player1.name);

        expect(validated).to.equal(false);
    });

    it('skipTurn() should increment skipCounter by 1', () => {
        turn.skipTurn();

        expect(turn.skipCounter).to.equal(1);
    });

    it('skipTurn() should call end with true as argument when the skipCounter is at 6', () => {
        const endSpy = spy(turn, 'end');
        turn.skipCounter = 5;
        turn.skipTurn();

        expect(endSpy.calledWith(true)).to.equal(true);
    });

    it('skipTurn() should call end without true as argument when the skipCounter is not at 6', () => {
        const endSpy = spy(turn, 'end');
        turn.skipCounter = 4;
        turn.skipTurn();

        expect(endSpy.calledWith(true)).to.equal(false);
    });

    it('resetSkipCounter() should assign skipCounter to 0', () => {
        turn.skipCounter = 4;
        turn.resetSkipCounter();

        expect(turn.skipCounter).to.equal(0);
    });

    it('incrementSkipCounter() should increment skipCounter by 1', () => {
        // Reason : testing private method
        // eslint-disable-next-line dot-notation
        turn['incrementSkipCounter']();

        expect(turn.skipCounter).to.equal(1);
    });
});
