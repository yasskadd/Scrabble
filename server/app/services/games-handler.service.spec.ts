/* eslint-disable max-lines */
import { Game } from '@app/classes/game';
import { Gameboard } from '@app/classes/gameboard.class';
import { Player } from '@app/classes/player.class';
import { Turn } from '@app/classes/turn';
import { GamesHandler } from '@app/services/games-handler.service';
import { Letter } from '@common/letter';
import { SocketEvents } from '@common/socket-events';
import { expect } from 'chai';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import * as sinon from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { LetterPlacementService } from './letter-placement.service';
import { LetterReserveService } from './letter-reserve.service';
import { SocketManager } from './socket-manager.service';
interface GameHolder {
    game: Game | undefined;
    players: Player[];
    roomId: string;
}
// type SioSignature = SocketManager['sio'];

const ROOM = '0';
describe.only('GamesHandler Service', () => {
    let gamesHandler: GamesHandler;
    let socketManagerStub: sinon.SinonStubbedInstance<SocketManager>;
    let httpServer: Server;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: ioServer;
    // let gameInfo: { playerName: string[]; roomId: string; timer: number; socketId: string[] };

    beforeEach((done) => {
        // ||| Stubbing SocketManager |||
        socketManagerStub = sinon.createStubInstance(SocketManager);
        // We need emitRoom to do nothing
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        socketManagerStub.emitRoom.callsFake(() => {});
        gamesHandler = new GamesHandler(socketManagerStub as unknown as SocketManager);

        // ||| Creating a new Server |||
        httpServer = createServer();
        sio = new ioServer(httpServer);
        // ||| Connecting sockets to corresponding sockets when turning the server on |||
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            clientSocket = Client(`http://localhost:${port}`);
            // DO STUFF ON CLIENT CONNECT
            // (socketServer is the socket received on the server side, the one we do socket.emit() and stuff from the server)
            sio.on('connection', (socket) => {
                serverSocket = socket;
                console.log(`Server client connected : ${serverSocket.id}`);
                // gameInfo = { playerName: [], roomId: ROOM, timer: 0, socketId: [serverSocket.id] };
            });
            clientSocket.on('connect', done);
        });
    });

    afterEach(() => {
        clientSocket.close();
        sio.close();
        sinon.restore();
    });

    it('InitSocketEvents() should call the on() and io() methods of socketManager', (done) => {
        const createGameSpy = sinon.stub(gamesHandler, 'createGame' as never);
        const playSpy = sinon.stub(gamesHandler, 'playGame' as never);
        const exchangeSpy = sinon.stub(gamesHandler, 'exchange' as never);
        const skipSpy = sinon.stub(gamesHandler, 'skip' as never);
        const disconnectSpy = sinon.stub(gamesHandler, 'disconnect' as never);
        const abandonGameSpy = sinon.stub(gamesHandler, 'abandonGame' as never);

        gamesHandler.initSocketsEvents();
        socketManagerStub.io.getCall(0).args[1](sio, serverSocket);
        socketManagerStub.io.getCall(1).args[1](sio, serverSocket);
        socketManagerStub.io.getCall(2).args[1](sio, serverSocket);

        socketManagerStub.on.getCall(0).args[1](serverSocket);
        socketManagerStub.on.getCall(1).args[1](serverSocket);
        socketManagerStub.on.getCall(2).args[1](serverSocket);

        expect(createGameSpy.called).to.be.eql(true);
        expect(playSpy.called).to.be.eql(true);
        expect(exchangeSpy.called).to.be.eql(true);
        expect(skipSpy.called).to.be.eql(true);
        expect(disconnectSpy.called).to.be.eql(true);
        expect(abandonGameSpy.called).to.be.eql(true);

        expect(socketManagerStub.io.called).to.equal(true);
        expect(socketManagerStub.on.called).to.equal(true);
        done();
    });

    it('skip() should call game.skip()', (done) => {
        const player = { room: ROOM } as Player;
        const game = sinon.createStubInstance(Game);
        game.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        game.turn = { activePlayer: '' } as Turn;
        game.skip.returns(true);
        const gameHolder = { game, players: [] };
        // eslint-disable-next-line dot-notation
        gamesHandler['players'].set(serverSocket.id, player);
        // eslint-disable-next-line dot-notation
        gamesHandler['games'].set(ROOM, gameHolder as unknown as GameHolder);

        // eslint-disable-next-line dot-notation
        gamesHandler['skip'](serverSocket);
        expect(game.skip.called).to.equal(true);
        done();
    });
    it('skip() should call changeTurn()', (done) => {
        const player = { room: ROOM } as Player;
        const game = sinon.createStubInstance(Game);
        game.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        game.turn = { activePlayer: '' } as Turn;
        game.skip.returns(true);
        const gameHolder = { game, players: [] };
        // eslint-disable-next-line dot-notation
        gamesHandler['players'].set(serverSocket.id, player);
        // eslint-disable-next-line dot-notation
        gamesHandler['games'].set(ROOM, gameHolder as unknown as GameHolder);

        const changeTurnSpy = sinon.spy(gamesHandler, 'changeTurn' as never);

        // eslint-disable-next-line dot-notation
        gamesHandler['skip'](serverSocket);
        expect(changeTurnSpy.called).to.equal(true);
        done();
    });

    it('sendTimer() should call emitRoom() with the correct parameters', () => {
        // eslint-disable-next-line dot-notation
        gamesHandler['sendTimer'](ROOM, 0);
        expect(socketManagerStub.emitRoom.calledOnceWith(ROOM, SocketEvents.TimerClientUpdate, 0));
    });

    it('setAndGetPlayer() should set a new player and return him for the first player', () => {
        const FIRST_PLAYER = 'BIGBROTHER';
        const FIRST_PLAYER_SOCKET_ID = '0';
        const EXPECTED_NEW_PLAYER = new Player(FIRST_PLAYER);
        EXPECTED_NEW_PLAYER.room = ROOM;

        const gameInformation = { playerName: [FIRST_PLAYER], roomId: ROOM, timer: 0, socketId: [FIRST_PLAYER_SOCKET_ID] };
        // eslint-disable-next-line dot-notation
        const newPlayer = gamesHandler['setAndGetPlayer'](gameInformation) as Player;
        expect(newPlayer).to.be.eql(EXPECTED_NEW_PLAYER as Player);
        // eslint-disable-next-line dot-notation
        expect(gamesHandler['players'].get(FIRST_PLAYER_SOCKET_ID) as Player).to.be.eql(EXPECTED_NEW_PLAYER as Player);
    });
    it('setAndGetPlayer() should set a new player and return him for the second player', () => {
        const FIRST_PLAYER = 'BIGBROTHER';
        const SECOND_PLAYER = 'LITTLEBROTHER';
        const FIRST_PLAYER_SOCKET_ID = '0';
        const SECOND_PLAYER_SOCKET_ID = '1';
        const EXPECTED_NEW_PLAYER = new Player(SECOND_PLAYER);
        EXPECTED_NEW_PLAYER.room = ROOM;

        const gameInformation = {
            playerName: [FIRST_PLAYER, SECOND_PLAYER],
            roomId: ROOM,
            timer: 0,
            socketId: [FIRST_PLAYER_SOCKET_ID, SECOND_PLAYER_SOCKET_ID],
        };
        // eslint-disable-next-line dot-notation
        gamesHandler['setAndGetPlayer'](gameInformation) as Player;

        // eslint-disable-next-line dot-notation
        const newPlayer = gamesHandler['setAndGetPlayer'](gameInformation) as Player;
        expect(newPlayer).to.be.eql(EXPECTED_NEW_PLAYER as Player);
        // eslint-disable-next-line dot-notation
        expect(gamesHandler['players'].get(SECOND_PLAYER_SOCKET_ID) as Player).to.be.eql(EXPECTED_NEW_PLAYER as Player);
    });

    it("changeTurn() should send the game's information when called and the active player isn't undefined", () => {
        const game = {
            gameboard: { gameboardCoords: [] },
            players: [],
            turn: { activePlayer: true },
        } as unknown as Game;
        const gameHolder = { game } as unknown as GameHolder;
        // eslint-disable-next-line dot-notation
        gamesHandler['games'].set(ROOM, gameHolder);

        // eslint-disable-next-line dot-notation
        gamesHandler['changeTurn'](ROOM);

        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.Skip, game));
    });
    it('changeTurn() should emit that the game ended when the active player is undefined', () => {
        const game = {
            gameboard: { gameboardCoords: [] },
            players: [],
            turn: { activePlayer: false },
        } as unknown as Game;
        const gameHolder = { game } as unknown as GameHolder;
        // eslint-disable-next-line dot-notation
        gamesHandler['games'].set(ROOM, gameHolder);

        // eslint-disable-next-line dot-notation
        gamesHandler['changeTurn'](ROOM);

        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.GameEnd));
    });

    it('createNewGame() should return a new game created', () => {
        const FIRST_PLAYER = 'ISKANDAR';
        const SECOND_PLAYER = 'GILGAMESH';
        const PLAYER_ONE = new Player(FIRST_PLAYER);
        const PLAYER_TWO = new Player(SECOND_PLAYER);

        const params = {
            game: {} as Game,
            players: [PLAYER_ONE, PLAYER_TWO],
            roomId: ROOM,
        };
        // eslint-disable-next-line dot-notation
        const game = gamesHandler['createNewGame'](params);
        expect(game !== undefined).to.eql(true);
    });

    it('abandonGame() should emit to the room that the opponent left and that the game ended', () => {
        const player = { room: ROOM } as Player;
        // eslint-disable-next-line dot-notation
        gamesHandler['players'].set(serverSocket.id, player);
        // eslint-disable-next-line dot-notation
        gamesHandler['abandonGame'](serverSocket);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.OpponentGameLeave));
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.GameEnd));
    });
    it("abandonGame() shouldn't do anything if the player isn't in the map ()", () => {
        // eslint-disable-next-line dot-notation
        gamesHandler['abandonGame'](serverSocket);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.OpponentGameLeave)).to.not.be.equal(true);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.GameEnd)).to.not.be.equal(true);
    });
    context('Two Clientsocket tests', () => {
        let secondSocket: Socket;

        const PLAYER_ONE = { name: 'Cthulhu' } as Player;
        const PLAYER_TWO = { name: '' } as Player;
        const RESERVE = [] as Letter[];
        const game = {
            player1: PLAYER_ONE,
            player2: PLAYER_TWO,
            letterReserve: RESERVE,
        } as unknown as Game;
        beforeEach((done) => {
            serverSocket.join(ROOM);
            secondSocket = Client(`http://localhost:${port}`);
            secondSocket.on('connect', done);
        });
        afterEach(() => {
            secondSocket.close();
        });
        it('updatePlayerInfo() should broadcast correct info to the first Player', (done) => {
            clientSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(PLAYER_ONE);
                done();
            });
            clientSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(PLAYER_TWO);
            });
            // eslint-disable-next-line dot-notation
            gamesHandler['players'].set(serverSocket.id, PLAYER_ONE);

            // eslint-disable-next-line dot-notation
            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });
        it('updatePlayerInfo() should broadcast correct info to the second Player', (done) => {
            secondSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(PLAYER_TWO);
                done();
            });
            secondSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(PLAYER_ONE);
            });
            // eslint-disable-next-line dot-notation
            gamesHandler['players'].set(serverSocket.id, PLAYER_ONE);

            // eslint-disable-next-line dot-notation
            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });
        it("updatePlayerInfo() should broadcast correct info if it isn't the first player the second Player", (done) => {
            game.player1 = PLAYER_TWO;
            game.player2 = PLAYER_ONE;
            secondSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(PLAYER_TWO);
                done();
            });
            secondSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(PLAYER_ONE);
            });
            // eslint-disable-next-line dot-notation
            gamesHandler['players'].set(serverSocket.id, PLAYER_ONE);

            // eslint-disable-next-line dot-notation
            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });
        it('updatePlayerInfo() should emit the letterReserve to the room', () => {
            // eslint-disable-next-line dot-notation
            gamesHandler['players'].set(serverSocket.id, PLAYER_ONE);

            // eslint-disable-next-line dot-notation
            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
            expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.LetterReserveUpdated, RESERVE));
        });
        it('disconnect() should emit to the room that the opponent left/ game ended after 5 seconds of waiting for a reconnect', (done) => {
            const timeOut5Seconds = 5500;
            let testBoolean1 = false;
            let testBoolean2 = false;
            const player = { room: ROOM } as Player;
            serverSocket.join(ROOM);
            clientSocket.on(SocketEvents.OpponentGameLeave, () => {
                testBoolean1 = true;
            });
            clientSocket.on(SocketEvents.GameEnd, () => {
                testBoolean2 = true;
            });
            // eslint-disable-next-line dot-notation
            gamesHandler['players'].set(serverSocket.id, player);
            // eslint-disable-next-line dot-notation
            gamesHandler['disconnect'](serverSocket);
            // REASON : We ned to wait and check 5 seconds
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            setTimeout(() => {
                expect(testBoolean1).to.be.equal(true);
                expect(testBoolean2).to.be.equal(true);
                done();
            }, timeOut5Seconds);
        });
        it("disconnect() shouldn't emit to the room that the opponent left/ game ended after 5 seconds of waiting for a reconnect", (done) => {
            const timeOut5Seconds = 5500;
            let testBoolean1 = false;
            let testBoolean2 = false;
            serverSocket.join(ROOM);
            clientSocket.on(SocketEvents.OpponentGameLeave, () => {
                testBoolean1 = true;
            });
            clientSocket.on(SocketEvents.GameEnd, () => {
                testBoolean2 = true;
            });
            // eslint-disable-next-line dot-notation
            gamesHandler['disconnect'](serverSocket);
            // REASON : We ned to wait and check 5 seconds
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            setTimeout(() => {
                expect(testBoolean1).to.be.equal(false);
                expect(testBoolean2).to.be.equal(false);
                done();
            }, timeOut5Seconds);
        });
    });
    it("exchange() shouldn't do anything if the player isn't in the map ()", () => {
        const player = { room: ROOM } as Player;
        const letterReserveStub = {} as unknown as LetterReserveService;
        const LetterPlacementService = {} as unknown as LetterPlacementService;

        const gameStub = sinon.createStubInstance<Game>({ name: '' } as Player, { name: '' } as Player);
        const gameHolder = { game: gameStub as unknown as Game };
        // eslint-disable-next-line dot-notation
        gamesHandler['exchange'](sio, serverSocket, []);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.OpponentGameLeave)).to.not.be.equal(true);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.GameEnd)).to.not.be.equal(true);
    });

    // it('CreateGame() should call setAndGetPlayer()', (done) => {
    //     const setAndGetPlayer = sinon.spy(gamesHandler, 'setAndGetPlayer' as never);
    //     // eslint-disable-next-line dot-notation
    //     gamesHandler['createGame'](sio, serverSocket, gameInfo);
    //     expect(setAndGetPlayer.called).to.equal(true);
    //     done();
    // });
    // it('CreateGame() should call createNewGame()', (done) => {
    //     const createNewGameSpy = sinon.spy(gamesHandler, 'createNewGame' as never);
    //     // eslint-disable-next-line dot-notation
    //     gamesHandler['createGame'](sio, serverSocket, gameInfo);
    //     expect(createNewGameSpy.called).to.equal(true);
    //     done();
    // });
    // it('CreateGame() should emit game information to the room', (done) => {
    //     serverSocket.join(ROOM);
    //     clientSocket.on(SocketEvents.ViewUpdate, (information) => {
    //         expect(information).to.not.equal(undefined);
    //         done();
    //     });
    //     // eslint-disable-next-line dot-notation
    //     gamesHandler['createGame'](sio, serverSocket, gameInfo);
    // });
    // it('CreateGame() should add the game to the game Map', () => {
    //     // eslint-disable-next-line dot-notation
    //     gamesHandler['createGame'](sio, serverSocket, gameInfo);
    //     // eslint-disable-next-line dot-notation
    //     expect(gamesHandler['games'].get(ROOM)).to.not.equal(undefined);
    // });

    // TODO : FINISH TESTS for  playGame, exchange
});
