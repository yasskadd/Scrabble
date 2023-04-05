import { Game } from '@app/classes/game.class';
import { Word } from '@app/classes/word.class';
import { Gameboard } from '@common/classes/gameboard.class';
import { Letter } from '@common/interfaces/letter';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { RealPlayer } from './real-player.class';

describe('RealPlayer', () => {
    let player: RealPlayer;
    beforeEach(() => {
        player = new RealPlayer('player');
    });

    it('setGame() should set the game and set playerOne', () => {
        const gameStub = {} as Game;
        player.setGame(gameStub, true);
        expect(player.game).to.equal(gameStub);
        expect(player.isPlayerOne).to.be.equal(true);
    });

    it('placeLetter() should call game.play() and return the result', () => {
        const gameStub = sinon.createStubInstance(Game);
        player.game = gameStub as unknown as Game;
        gameStub.placeWord.returns({ hasPassed: true, gameboard: {} as Gameboard, invalidWords: [] as Word[] });
        expect(player.placeLetter({} as PlaceWordCommandInfo)).to.eql({ hasPassed: true, gameboard: {} as Gameboard, invalidWords: [] as Word[] });
        expect(gameStub.placeWord.called).to.equal(true);
    });

    it("placeLetter() shouln't do anything if game is undefined", () => {
        const gameStub = sinon.createStubInstance(Game);
        gameStub.placeWord.returns({ hasPassed: true, gameboard: {} as Gameboard, invalidWords: {} as Word[] });
        const command = {} as PlaceWordCommandInfo;
        player.placeLetter(command);
        expect(gameStub.placeWord.called).to.be.equal(false);
    });

    it('exchangeLetter() should call game.exchange() and replace rack with the current rack', () => {
        const gameStub = sinon.createStubInstance(Game);
        player.game = gameStub as unknown as Game;
        gameStub.exchange.returns([{} as Letter]);
        player.exchangeLetter(['letters']);
        expect(player.rack).to.deep.equal([{} as Letter]);
        expect(gameStub.exchange.called).to.be.equal(true);
    });

    it("exchangeLetter() shouln't do anything if game is undefined", () => {
        const gameStub = sinon.createStubInstance(Game);
        player.exchangeLetter(['letters']);
        expect(gameStub.exchange.called).to.be.equal(false);
    });
    it('skipTurn() should call game.skip()', () => {
        const gameStub = sinon.createStubInstance(Game);
        player.game = gameStub as unknown as Game;
        player.skipTurn();
        expect(gameStub.skip.called).to.be.equal(true);
    });

    it("skipTurn() shouln't do anything if game is undefined", () => {
        const gameStub = sinon.createStubInstance(Game);
        player.skipTurn();
        expect(gameStub.skip.called).to.be.equal(false);
    });
});
