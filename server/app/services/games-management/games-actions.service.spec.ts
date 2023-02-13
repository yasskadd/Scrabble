/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-empty-function*/
/* eslint-disable dot-notation*/
import { Game } from '@app/classes/game.class';
import { Gameboard } from '@app/classes/gameboard.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { Word } from '@app/classes/word.class';
import { PlaceLettersReturn } from '@app/interfaces/place-letters-return';
import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Letter } from '@common/interfaces/letter';
import { expect } from 'chai';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { ReplaySubject } from 'rxjs';
import * as sinon from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { GamesActionsService } from './games-actions.service';

const ROOM = '0';

describe('GamesActions Service', () => {
    let gamesActionsService: GamesActionsService;
    let gamesHandlerStub: sinon.SinonStubbedInstance<GamesHandler>;
    let socketManagerStub: sinon.SinonStubbedInstance<SocketManager>;
    let rackServiceStub: sinon.SinonStubbedInstance<RackService>;
    let game: sinon.SinonStubbedInstance<Game> & Game;

    let httpServer: Server;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: ioServer;

    let player1: sinon.SinonStubbedInstance<RealPlayer>;
    let player2: sinon.SinonStubbedInstance<RealPlayer>;

    beforeEach((done) => {
        player1 = sinon.createStubInstance(RealPlayer);
        player2 = sinon.createStubInstance(RealPlayer);

        player1.room = '1';
        player2.room = '1';
        player1.rack = [{ value: 'c', quantity: 2, points: 1 }];
        player2.rack = [{ value: 'c', quantity: 2, points: 1 }];
        player1.score = 0;
        player2.score = 0;

        game = sinon.createStubInstance(Game) as sinon.SinonStubbedInstance<Game> & Game;
        game.wordSolver = sinon.createStubInstance(WordSolver) as sinon.SinonStubbedInstance<WordSolver> & WordSolver;
        game.turn = { countdown: new ReplaySubject(), endTurn: new ReplaySubject() } as Turn;
        game.letterReserve = sinon.createStubInstance(LetterReserve) as unknown as LetterReserve;
        game.letterReserve.lettersReserve = [{ value: 'c', quantity: 2, points: 1 }];
        game.gameboard = sinon.createStubInstance(Gameboard);

        player1.game = game;

        socketManagerStub = sinon.createStubInstance(SocketManager);
        gamesHandlerStub = sinon.createStubInstance(GamesHandler);
        rackServiceStub = sinon.createStubInstance(RackService);
        gamesActionsService = new GamesActionsService(socketManagerStub as never, gamesHandlerStub as never, rackServiceStub as never);

        gamesHandlerStub.players = new Map();
        gamesHandlerStub.gamePlayers = new Map();

        httpServer = createServer();
        sio = new ioServer(httpServer);
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            clientSocket = Client(`http://localhost:${port}`);
            sio.on('connection', (socket) => {
                serverSocket = socket;
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        game.turn.countdown.unsubscribe();
        game.turn.endTurn.unsubscribe();
        clientSocket.close();
        sio.close();
        sinon.restore();
    });

    it('InitSocketEvents() should call the on() methods of socketManager', (done) => {
        const playSpy = sinon.stub(gamesActionsService, 'playGame' as never);
        const exchangeSpy = sinon.stub(gamesActionsService, 'exchange' as never);
        const skipSpy = sinon.stub(gamesActionsService, 'skip' as never);
        const reserveCommandSpy = sinon.stub(gamesActionsService, 'reserveCommand' as never);
        const clueCommandSpy = sinon.stub(gamesActionsService, 'clueCommand' as never);

        gamesActionsService.initSocketsEvents();
        const CALL_NUMBER = 5;
        for (let i = 0; i < CALL_NUMBER; i++) {
            socketManagerStub.on.getCall(i).args[1](serverSocket);
        }

        expect(playSpy.called).to.be.eql(true);
        expect(exchangeSpy.called).to.be.eql(true);
        expect(skipSpy.called).to.be.eql(true);
        expect(reserveCommandSpy.called).to.be.eql(true);
        expect(clueCommandSpy.called).to.be.eql(true);
        expect(socketManagerStub.on.called).to.equal(true);

        done();
    });

    it('clueCommand() should call wordSolver.setGameboard,  findAllOptions  and configureClueCommand', () => {
        const configureClueCommandSpy = sinon.stub(gamesActionsService, 'configureClueCommand' as never);
        gamesHandlerStub['players'].set(serverSocket.id, player1);

        gamesActionsService['clueCommand'](serverSocket);
        expect((game.wordSolver as unknown as sinon.SinonStubbedInstance<WordSolver>).setGameboard.called).equal(true);
        expect((game.wordSolver as unknown as sinon.SinonStubbedInstance<WordSolver>).findAllOptions.called).to.equal(true);
        expect(configureClueCommandSpy.called).to.equal(true);
    });
    it('configureClueCommand() should return an array with the one placement possible when there is only one available ', (done) => {
        const placementPossible = [
            { firstCoordinate: { x: 0, y: 0 }, lettersPlaced: ['p', 'a', 'r'] as string[], direction: 'v' } as unknown as CommandInfo,
        ];

        expect(gamesActionsService['configureClueCommand'](placementPossible)).to.deep.include.members([
            { firstCoordinate: { x: 0, y: 0 }, lettersPlaced: ['p', 'a', 'r'] as string[], direction: 'v' } as unknown as CommandInfo,
        ]);
        done();
    });
    it('clueCommand() should return three placement possible when there is three or more available ', (done) => {
        const placementPossible = [
            { firstCoordinate: { x: 0, y: 0 }, lettersPlaced: ['p', 'a', 'r'] as string[], direction: 'v' } as unknown as CommandInfo,
            { firstCoordinate: { x: 4, y: 4 }, lettersPlaced: ['r', 'a', 'p'] as string[], direction: 'v' } as unknown as CommandInfo,
            { firstCoordinate: { x: 8, y: 8 }, lettersPlaced: ['c', 'a', 'r'] as string[], direction: 'h' } as unknown as CommandInfo,
        ];

        expect(gamesActionsService['configureClueCommand'](placementPossible)).to.deep.include.members([
            { firstCoordinate: { x: 0, y: 0 }, lettersPlaced: ['p', 'a', 'r'] as string[], direction: 'v' } as unknown as CommandInfo,
            { firstCoordinate: { x: 4, y: 4 }, lettersPlaced: ['r', 'a', 'p'] as string[], direction: 'v' } as unknown as CommandInfo,
            { firstCoordinate: { x: 8, y: 8 }, lettersPlaced: ['c', 'a', 'r'] as string[], direction: 'h' } as unknown as CommandInfo,
        ]);
        done();
    });

    it('reserveCommand() should emit the reserve to the client ', (done) => {
        player1.game.letterReserve = {
            lettersReserve: [
                { value: 'c', quantity: 2, points: 1 },
                { value: 'r', quantity: 2, points: 1 },
                { value: 'p', quantity: 2, points: 1 },
            ],
        } as LetterReserve;

        gamesHandlerStub['players'].set(serverSocket.id, player1);

        clientSocket.on(SocketEvents.AllReserveLetters, (information) => {
            expect(information).to.be.eql(game.letterReserve.lettersReserve);
            done();
        });

        gamesActionsService['reserveCommand'](serverSocket);
    });
    it("reserveCommand() shouldn't do anything if the socketID is invalid ", () => {
        const TIME_TO_RECEIVE_EVENT = 500;
        const clock = sinon.useFakeTimers();
        player1.game.letterReserve = {
            lettersReserve: [
                { value: 'c', quantity: 2, points: 1 },
                { value: 'r', quantity: 2, points: 1 },
                { value: 'p', quantity: 2, points: 1 },
            ],
        } as LetterReserve;
        let testBoolean = true;
        clientSocket.on(SocketEvents.AllReserveLetters, () => {
            testBoolean = false;
        });

        gamesActionsService['reserveCommand'](serverSocket);
        clock.tick(TIME_TO_RECEIVE_EVENT);
        clock.restore();
        expect(testBoolean).to.be.eql(true);
    });

    it('skip() should call player.skipTurn()', (done) => {
        const player = sinon.createStubInstance(RealPlayer);
        const gameStub = sinon.createStubInstance(Game);

        gameStub.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        gameStub.turn = { activePlayer: '' } as Turn;
        gameStub.skip.returns(true);

        gamesHandlerStub['players'].set(serverSocket.id, player);

        gamesActionsService['skip'](serverSocket);
        expect(player.skipTurn.called).to.equal(true);
        done();
    });

    it('skip() should not call player.skipTurn() when the socketID is invalid', (done) => {
        const player = sinon.createStubInstance(RealPlayer);
        const gameStub = sinon.createStubInstance(Game);

        gameStub.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        gameStub.turn = { activePlayer: '' } as Turn;
        gameStub.skip.returns(true);

        gamesActionsService['skip'](serverSocket);
        expect(player.skipTurn.called).to.equal(false);
        done();
    });

    it('exchange() should emit to the room the player information and active player', () => {
        const gameStub = sinon.createStubInstance(Game);
        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        gamesHandlerStub['players'].set(serverSocket.id, player1);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

        gamesActionsService['exchange'](serverSocket, []);
        expect(socketManagerStub.emitRoom.calledWithExactly(player1.room, SocketEvents.Play, player1.getInformation(), gameStub.turn.activePlayer));
    });

    it('exchange() should emit a message when a command error occurs', () => {
        const gameStub = sinon.createStubInstance(Game);
        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        clientSocket.on(SocketEvents.ImpossibleCommandError, (message) => {
            expect(message).to.be.equal('Vous ne possédez pas toutes les lettres à échanger');
        });
        gamesHandlerStub['players'].set(serverSocket.id, player1);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

        gamesActionsService['exchange'](serverSocket, []);
    });

    it('exchange() should call updatePlayerInfo()', () => {
        const LETTER = [
            { value: 'c', quantity: 2, points: 1 },
            { value: 'r', quantity: 2, points: 1 },
            { value: 'p', quantity: 2, points: 1 },
        ];
        const player = sinon.createStubInstance(RealPlayer);
        player.name = '';
        player.room = ROOM;
        player.rack = LETTER;
        const gameStub = sinon.createStubInstance(Game);
        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        player.game = gameStub as unknown as Game;

        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1]);
        rackServiceStub.areLettersInRack.returns(true);

        gamesActionsService['exchange'](serverSocket, ['c']);
        expect(gamesHandlerStub.updatePlayerInfo.called).to.be.equal(true);
    });

    it("exchange() shouldn't do anything if the socket doesn't exist call updatePlayerInfo()", () => {
        const LETTER = { value: '' } as Letter;
        const gameStub = sinon.createStubInstance(Game);
        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        gameStub.exchange.returns([LETTER]);
        player1.game = gameStub as unknown as Game;

        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

        gamesActionsService['exchange'](serverSocket, []);
        expect(gamesHandlerStub.updatePlayerInfo.called).to.be.equal(false);
        expect(socketManagerStub.emitRoom.called).to.not.be.equal(true);
    });

    it('playGame() should emit an impossible command', (done) => {
        const RETURNED_STRING = 'suffering';
        const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[] } as unknown as CommandInfo;
        const player = sinon.createStubInstance(RealPlayer);
        player.name = '';
        player.room = ROOM;
        const gameStub = sinon.createStubInstance(Game);

        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        player.game = gameStub as unknown as Game;
        player.placeLetter.returns(RETURNED_STRING);
        clientSocket.on(SocketEvents.ImpossibleCommandError, (information) => {
            expect(information).to.be.equal(RETURNED_STRING);
            done();
        });
        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1]);

        gamesActionsService['playGame'](serverSocket, commandInfo);
    });

    it('playGame() should emit the play info', () => {
        serverSocket.join(ROOM);
        const RETURNED_BOOLEAN = true;

        const EXPECTED_INFORMATION = {
            gameboard: [],
            activePlayer: '',
        };

        const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[] } as unknown as CommandInfo;
        const player = sinon.createStubInstance(RealPlayer);
        player.name = '';
        player.room = ROOM;
        const gameStub = sinon.createStubInstance(Game);

        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        player.game = gameStub as unknown as Game;
        player.placeLetter.returns({
            hasPassed: RETURNED_BOOLEAN,
            gameboard: { gameboardTiles: [] } as unknown as Gameboard,
            invalidWords: {} as Word[],
        });
        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1]);

        gamesActionsService['playGame'](serverSocket, commandInfo);
        expect(socketManagerStub.emitRoom.calledOnceWithExactly(ROOM, SocketEvents.ViewUpdate, EXPECTED_INFORMATION)).to.be.equal(true);
    });

    it('playGame() should call updatePlayerInfo', () => {
        serverSocket.join(ROOM);
        const RETURNED_BOOLEAN = true;

        const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[] } as unknown as CommandInfo;
        const player = sinon.createStubInstance(RealPlayer);
        player.name = '';
        player.room = ROOM;
        const gameStub = sinon.createStubInstance(Game);

        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        player.placeLetter.returns({
            hasPassed: RETURNED_BOOLEAN,
            gameboard: { gameboardTiles: [] } as unknown as Gameboard,
            invalidWords: [] as Word[],
        });
        player.game = gameStub as unknown as Game;
        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1]);

        gamesActionsService['playGame'](serverSocket, commandInfo);
        expect(gamesHandlerStub.updatePlayerInfo.called).to.be.equal(true);
    });

    it('sendValidCommand() should return an impossible command error if boolean is true', (done) => {
        serverSocket.join(ROOM);
        const RETURNED_BOOLEAN = false;
        const EXPECTED_MESSAGE = 'Le mot "' + 'HELLO' + '" ne fait pas partie du dictionnaire français';

        const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[] } as unknown as CommandInfo;
        const player = sinon.createStubInstance(RealPlayer);
        player.name = '';
        player.room = ROOM;
        const gameStub = sinon.createStubInstance(Game);

        clientSocket.on(SocketEvents.ImpossibleCommandError, (message) => {
            expect(message).to.equal(EXPECTED_MESSAGE);
            done();
        });

        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        player.placeLetter.returns({
            hasPassed: RETURNED_BOOLEAN,
            gameboard: { gameboardTiles: [] } as unknown as Gameboard,
            invalidWords: [{ stringFormat: 'HELLO' }] as Word[],
        });
        player.game = gameStub as unknown as Game;
        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(player.room, [player]);

        gamesActionsService['sendValidCommand'](player.placeLetter(commandInfo) as PlaceLettersReturn, serverSocket, player.room, EXPECTED_MESSAGE);
    });
    it("playGame() shouldn't do anything if the socket.id isn't in players", () => {
        const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[] } as unknown as CommandInfo;
        const gameStub = sinon.createStubInstance(Game);

        gameStub.turn = { activePlayer: '' } as unknown as Turn;
        player1.game = gameStub as unknown as Game;

        gamesHandlerStub['gamePlayers'].set(player1.room, [player1]);

        gamesActionsService['playGame'](serverSocket, commandInfo);
        expect(gamesHandlerStub.updatePlayerInfo.called).to.not.be.equal(true);
    });

    context('Two Clientsocket tests', () => {
        let secondSocket: Socket;
        let playerOne: sinon.SinonStubbedInstance<RealPlayer>;
        let playerTwo: sinon.SinonStubbedInstance<RealPlayer>;

        beforeEach((done) => {
            playerOne = sinon.createStubInstance(RealPlayer);
            playerOne.name = 'Cthulhu';
            playerOne.room = ROOM;
            playerOne.isPlayerOne = true;
            playerOne.getInformation.returns({ name: playerOne.name, score: 0, rack: [], room: '0', gameboard: [] });
            playerTwo = sinon.createStubInstance(RealPlayer);
            playerTwo.room = ROOM;
            playerTwo.name = '';
            playerTwo.isPlayerOne = false;
            playerTwo.getInformation.returns({ name: playerTwo.name, score: 0, rack: [], room: '0', gameboard: [] });

            serverSocket.join(ROOM);
            secondSocket = Client(`http://localhost:${port}`);
            secondSocket.on('connect', done);
        });

        afterEach(() => {
            secondSocket.close();
        });

        it('exchange() should emit the exchanged letters to the other player when an exchange occurs', () => {
            const LETTER = { value: 'LaStructureDuServeur' } as Letter;

            const player = sinon.createStubInstance(RealPlayer);
            player.name = '';
            player.room = ROOM;
            player.rack = [LETTER];
            const gameStub = sinon.createStubInstance(Game);
            gameStub.turn = { activePlayer: '' } as unknown as Turn;
            player.game = gameStub as unknown as Game;
            player.exchangeLetter.callsFake(() => {
                player.rack = [{ value: 'Ihatetests' } as Letter];
            });
            clientSocket.on(SocketEvents.GameMessage, (message) => {
                expect(message).to.be.equal('!echanger 0 lettres');
            });

            gamesHandlerStub['players'].set(serverSocket.id, player);
            gamesHandlerStub['gamePlayers'].set(player.room, [player]);

            gamesActionsService['exchange'](serverSocket, []);
        });

        it('playGame() should call sendValidCommand when direction is vertical', () => {
            const sendValidCommandStub = sinon.stub(gamesActionsService, 'sendValidCommand' as never);
            serverSocket.join(ROOM);
            const RETURNED_BOOLEAN = true;
            const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[], isHorizontal: false } as unknown as CommandInfo;
            const player = sinon.createStubInstance(RealPlayer);
            player.name = '';
            player.room = ROOM;
            const gameStub = sinon.createStubInstance(Game);
            gameStub.turn = { activePlayer: '' } as unknown as Turn;
            player.placeLetter.returns({
                hasPassed: RETURNED_BOOLEAN,
                gameboard: { gameboardCoords: [] } as unknown as Gameboard,
                invalidWords: {} as Word[],
            });
            player.game = gameStub as unknown as Game;
            gamesHandlerStub['players'].set(serverSocket.id, player);
            gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

            gamesActionsService['playGame'](serverSocket, commandInfo);
            expect(sendValidCommandStub.called).to.equal(true);
        });

        it('playGame() should call sendValidCommand when direction is horizontal', () => {
            const sendValidCommandStub = sinon.stub(gamesActionsService, 'sendValidCommand' as never);
            serverSocket.join(ROOM);
            const RETURNED_BOOLEAN = true;
            const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[], isHorizontal: true } as unknown as CommandInfo;
            const player = sinon.createStubInstance(RealPlayer);
            player.name = '';
            player.room = ROOM;
            const gameStub = sinon.createStubInstance(Game);
            gameStub.turn = { activePlayer: '' } as unknown as Turn;
            player.placeLetter.returns({
                hasPassed: RETURNED_BOOLEAN,
                gameboard: { gameboardCoords: [] } as unknown as Gameboard,
                invalidWords: {} as Word[],
            });
            player.game = gameStub as unknown as Game;
            gamesHandlerStub['players'].set(serverSocket.id, player);
            gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

            gamesActionsService['playGame'](serverSocket, commandInfo);
            expect(sendValidCommandStub.called).to.equal(true);
        });

        it('sendValidCommand() should send to the other player the command inputed', (done) => {
            serverSocket.join(ROOM);
            const RETURNED_BOOLEAN = true;
            const EXPECTED_MESSAGE = '!placer `0v ';

            const commandInfo = { firstCoordinate: { x: 0, y: 0 }, letters: [] as string[], isHorizontal: false } as unknown as CommandInfo;
            const player = sinon.createStubInstance(RealPlayer);
            player.name = '';
            player.room = ROOM;
            const gameStub = sinon.createStubInstance(Game);

            clientSocket.on(SocketEvents.GameMessage, (message) => {
                expect(message).to.equal(EXPECTED_MESSAGE);
                done();
            });

            gameStub.turn = { activePlayer: '' } as unknown as Turn;
            player.placeLetter.returns({
                hasPassed: RETURNED_BOOLEAN,
                gameboard: { gameboardCoords: [] } as unknown as Gameboard,
                invalidWords: {} as Word[],
            });
            player.game = gameStub as unknown as Game;
            gamesHandlerStub['players'].set(serverSocket.id, player);
            gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

            gamesActionsService['sendValidCommand'](
                player.placeLetter(commandInfo) as PlaceLettersReturn,
                serverSocket,
                player.room,
                EXPECTED_MESSAGE,
            );
        });
    });
});
