/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { SocketTestEmulator } from '@app/classes/test-classes/socket-test-emulator';
import { Letter } from '@common/letter';
import { LetterTile } from '@common/letter-tile.class';
import { SocketEvents } from '@common/socket-events';
import { Socket } from 'socket.io-client';
import { ClientSocketService } from './client-socket.service';
import { GameClientService } from './game-client.service';
import { GridService } from './grid.service';
type Player = { name: string; score: number; rack: Letter[]; room: string };
type PlayInfo = { gameboard: LetterTile[]; activePlayer: string };
type GameInfo = { gameboard: LetterTile[]; players: Player[]; activePlayer: string };
const PLAYER_ONE: Player = {
    name: 'Maurice',
    score: 23,
    rack: [{ value: 'b', quantity: 2, points: 1 }],
    room: '1',
};
const LETTER_RESERVE_LENGTH = 9;
const LETTER_RESERVE = [
    { value: 'c', quantity: 2, points: 1 },
    { value: 'r', quantity: 2, points: 1 },
    { value: 'p', quantity: 2, points: 1 },
    { value: 'x', quantity: 2, points: 10 },
    { value: 'w', quantity: 1, points: 7 },
];
const PLAYER_TWO: Player = {
    name: 'Paul',
    score: 327,
    rack: [
        { value: 'c', quantity: 2, points: 1 },
        { value: 'r', quantity: 2, points: 1 },
        { value: 'p', quantity: 2, points: 1 },
    ],
    room: '3',
};

const PLAYER_INFO: PlayInfo = {
    gameboard: [
        {
            x: 3,
            y: 2,
            isOccupied: true,
            letter: { value: 'b', quantity: 2, points: 1 },
            letterMultiplier: 2,
            wordMultiplier: 1,
            resetLetterMultiplier: () => {},
            resetWordMultiplier: () => {},
        },
    ],
    activePlayer: 'Paul',
};

const GAME_INFO: GameInfo = {
    gameboard: [
        {
            x: 3,
            y: 2,
            isOccupied: true,
            letter: { value: 'e', quantity: 2, points: 1 },
            letterMultiplier: 2,
            wordMultiplier: 1,
            resetLetterMultiplier: () => {},
            resetWordMultiplier: () => {},
        },
    ],
    players: [
        {
            name: 'Paul',
            score: 23,
            rack: [{ value: 'b', quantity: 2, points: 1 }],
            room: '1',
        },
        {
            name: 'Maurice',
            score: 333,
            rack: [{ value: 'c', quantity: 2, points: 1 }],
            room: '1',
        },
    ],
    activePlayer: 'Maurice',
};

const TIME = 12;

export class SocketClientServiceMock extends ClientSocketService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}
describe('GameClientService', () => {
    let service: GameClientService;
    let socketEmulator: SocketTestEmulator;
    let socketServiceMock: SocketClientServiceMock;
    let gridServiceSpy: jasmine.SpyObj<GridService>;
    beforeEach(() => {
        gridServiceSpy = jasmine.createSpyObj('GridService', ['drawGrid', 'drawRack']);
        socketEmulator = new SocketTestEmulator();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketEmulator as unknown as Socket;
        TestBed.configureTestingModule({
            providers: [
                { provide: ClientSocketService, useValue: socketServiceMock },
                { provide: GridService, useValue: gridServiceSpy },
            ],
        });
        service = TestBed.inject(GameClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should update the player information', () => {
        socketEmulator.peerSideEmit('UpdateMyPlayerInformation', PLAYER_ONE);
        expect(service.playerOne).toEqual(PLAYER_ONE);
    });
    it('should update the opponent information', () => {
        service.playerOne = PLAYER_ONE;
        socketEmulator.peerSideEmit('UpdateOpponentInformation', PLAYER_TWO);
        expect(service.secondPlayer).toEqual(PLAYER_TWO);
    });
    it('the playerOneTurn should be false when ViewUpdate is called and it is not their turn to play', () => {
        service.playerOne = PLAYER_ONE;
        socketEmulator.peerSideEmit(SocketEvents.ViewUpdate, PLAYER_INFO);
        expect(service.playerOneTurn).not.toBeTruthy();
    });
    it('playerOneTurn should be true when ViewUpdate is called and it is their turn to play', () => {
        service.playerOne = PLAYER_TWO;
        socketEmulator.peerSideEmit(SocketEvents.ViewUpdate, PLAYER_INFO);
        expect(service.playerOneTurn).toBeTruthy();
    });

    it('updateNewGameboard should call updateGameboard', () => {
        service.gameboard = PLAYER_INFO.gameboard;
        const spy = spyOn(service, 'updateNewGameboard');
        service.updateNewGameboard(GAME_INFO.gameboard);
        expect(spy).toHaveBeenCalled();
    });

    it('updateGamboard should call drawGridArray', () => {
        service.gameboard = PLAYER_INFO.gameboard;
        const spy = spyOn(service, 'updateGameboard');
        service.updateGameboard();
        expect(spy).toHaveBeenCalled();
    });

    it('should update the gameboard information when the player skips his turn', () => {
        service.playerOne = PLAYER_ONE;
        service.secondPlayer = PLAYER_TWO;
        service.gameboard = PLAYER_INFO.gameboard;
        expect(service.gameboard).not.toEqual(GAME_INFO.gameboard);
        socketEmulator.peerSideEmit(SocketEvents.Skip, GAME_INFO);
        expect(service.gameboard).toEqual(GAME_INFO.gameboard);
        expect(service.playerOneTurn).toBeTruthy();
    });
    it('should update the playOneTurn to false if it is not your turn to play', () => {
        service.playerOne = PLAYER_TWO;
        service.secondPlayer = PLAYER_ONE;
        service.gameboard = PLAYER_INFO.gameboard;
        expect(service.gameboard).not.toEqual(GAME_INFO.gameboard);
        socketEmulator.peerSideEmit(SocketEvents.Skip, GAME_INFO);
        expect(service.gameboard).toEqual(GAME_INFO.gameboard);
        expect(service.playerOneTurn).not.toBeTruthy();
    });
    it('should update the letter reserve length if SocketEvents.letterReserveUpdated event is called from the server', () => {
        socketEmulator.peerSideEmit('letterReserveUpdated', LETTER_RESERVE);
        expect(service.letterReserveLength).toEqual(LETTER_RESERVE_LENGTH);
    });

    it('should update the time when the SocketEvents.TimerClientUpdate event is called from the server', () => {
        socketEmulator.peerSideEmit(SocketEvents.TimerClientUpdate, TIME);
        expect(service.timer).toEqual(TIME);
    });

    it('should  not update the time when the SocketEvents.TimerClientUpdate event is not called from the server', () => {
        expect(service.timer).not.toEqual(TIME);
    });
    it('should  not update the letter reserve if SocketEvents.letterReserveUpdated  is not called from the server', () => {
        expect(service.letterReserveLength).not.toEqual(LETTER_RESERVE_LENGTH);
    });
    it('should set the value of isGameFinish to true when the opponent left the game ', () => {
        service.isGameFinish = false;
        socketEmulator.peerSideEmit('OpponentLeftTheGame');
        expect(service.playerOneTurn).toBeFalsy();
        expect(service.isGameFinish).toBeTruthy();
    });

    it('should call findWinnerByScore when the endGame event is emit and the game is not finish already', () => {
        const spy = spyOn(service, 'findWinnerByScore' as never);
        service.isGameFinish = false;
        socketEmulator.peerSideEmit('endGame');
        expect(spy).toHaveBeenCalled();
    });

    it('should emit abandonGame to the server if the player Abandon the game', () => {
        // eslint-disable-next-line dot-notation
        const spy = spyOn(service['clientSocketService'], 'send');
        service.abandonGame();
        expect(spy).toHaveBeenCalledOnceWith('AbandonGame');
    });

    it('should emit quitGame to the server if the player quit the game', () => {
        // eslint-disable-next-line dot-notation
        const spy = spyOn(service['clientSocketService'], 'send');
        service.quitGame();
        expect(spy).toHaveBeenCalledOnceWith('quitGame');
    });
    it('should not call findWinnerByScore if the game is already finish', () => {
        const spy = spyOn(service, 'findWinnerByScore' as never);
        const messageWinner = "Bravo vous avez gagné la partie, l'adversaire a quitté la partie";
        service.winningMessage = messageWinner;
        service.isGameFinish = true;
        socketEmulator.peerSideEmit(SocketEvents.GameEnd);
        expect(spy).not.toHaveBeenCalled();
    });
    it('should emit a message that say that the two player have the same score', () => {
        service.playerOne = PLAYER_ONE;
        service.secondPlayer = PLAYER_TWO;
        service.playerOne.score = 32;
        service.secondPlayer.score = 32;
        const messageWinner = 'Bravo aux deux joueur, vous avez le même score';

        // eslint-disable-next-line dot-notation
        service['findWinnerByScore']();
        expect(service.winningMessage).toEqual(messageWinner);
    });

    it('should emit a message that say that the first player won the game because he has a higher score than the second one', () => {
        service.playerOne = PLAYER_ONE;
        service.secondPlayer = PLAYER_TWO;
        service.playerOne.score = 33;
        service.secondPlayer.score = 32;
        const messageWinner = 'Bravo Vous avez gagné la partie de Scrabble';

        // eslint-disable-next-line dot-notation
        service['findWinnerByScore']();
        expect(service.winningMessage).toEqual(messageWinner);
    });

    it(' getAllLetterReserve should return the length of the reserve', () => {
        // eslint-disable-next-line dot-notation
        expect(service['getAllLetterReserve'](LETTER_RESERVE)).toEqual(LETTER_RESERVE_LENGTH);
    });
    it('should emit a message that say that the second player won the game because he has a higher score than the first one', () => {
        service.playerOne = PLAYER_ONE;
        service.secondPlayer = PLAYER_TWO;
        service.playerOne.score = 32;
        service.secondPlayer.score = 42;
        const messageWinner = "L'adversaire a gagné la partie";

        // eslint-disable-next-line dot-notation
        service['findWinnerByScore']();
        expect(service.winningMessage).toEqual(messageWinner);
    });
});
