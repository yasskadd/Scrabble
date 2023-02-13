import { Game } from '@app/classes/game.class';
import { Gameboard } from '@app/classes/gameboard.class';
import { Letter } from '@common/interfaces/letter';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Player } from './player.class';

describe('Player', () => {
    let player: Player;
    beforeEach(() => {
        player = new Player('player');
    });

    it('should return true if the rack is empty', () => {
        const isEmpty = player.rackIsEmpty();
        expect(isEmpty).to.equal(true);
    });

    it('should return false if the rack is not empty', () => {
        player.rack = [{} as Letter];
        const isEmpty = player.rackIsEmpty();
        expect(isEmpty).to.equal(false);
    });

    it('rackToString() should convert rack list to string', () => {
        player.rack = [{ value: 'l' } as Letter, { value: 'e' } as Letter];
        expect(player.rackToString()).to.eql(['l', 'e']);
    });

    it("getInformation() should return the player's information", () => {
        const gameStub = sinon.createStubInstance(Game);
        gameStub.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        player.game = gameStub as unknown as Game;
        const info = {
            name: player.name,
            score: player.score,
            rack: player.rack,
            room: player.room,
            gameboard: player.game.gameboard.gameboardTiles,
        };
        const result = player.getInformation();
        expect(result).to.be.deep.equal(info);
    });

    it('getInformation() should send an empty object if game is undefined', () => {
        const result = player.getInformation();
        expect(result).to.be.deep.equal({});
    });

    it('deductPoints() should subtract the sum of points of the letters in the player rack', () => {
        player.score = 10;
        player.rack = [{ points: 1 } as Letter, { points: 2 } as Letter];
        const expectedScore = 7;
        player.deductPoints();
        expect(player.score).to.equal(expectedScore);
    });

    it('deductPoints() should set the score to 0 if the deduction return a negative score', () => {
        player.score = 0;
        player.rack = [{ points: 1 } as Letter, { points: 2 } as Letter];
        const expectedScore = 0;
        player.deductPoints();
        expect(player.score).to.equal(expectedScore);
    });

    it('addPoints() should add the sum of points of the letters in the rack passed as param', () => {
        player.score = 0;
        const rack = [{ points: 1 } as Letter, { points: 2 } as Letter];
        const expectedScore = 3;
        player.addPoints(rack);
        expect(player.score).to.equal(expectedScore);
    });
});
