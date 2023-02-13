/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable dot-notation*/
import { GameParameters } from '@app/interfaces/game-parameters';
import { GameRoom } from '@app/interfaces/game-room';
import { GameSessions } from '@app/services/client-utilities/game-sessions.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { assert, expect } from 'chai';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import * as sinon from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';

type Parameters = { id: string; name: string };
type SioSignature = SocketManager['sio'];

const PLAYER_NAME = 'Vincent';
const OPPONENT_NAME = 'Maurice';
const SOCKET_ID = 'EFOFJS4534';
const ROOM_ID = '1';
const IS_ROOM_NOT_AVAILABLE = false;
const GAME_ROOM: GameRoom = {
    socketID: [SOCKET_ID],
    id: ROOM_ID,
    isAvailable: !IS_ROOM_NOT_AVAILABLE,
    users: ['Maurice'],
    dictionary: 'Francais',
    timer: 1,
    mode: 'classique',
};
const GAME_ROOM_2_PLAYER: GameRoom = {
    socketID: [SOCKET_ID, 'sfdg78fdsg'],
    id: ROOM_ID,
    isAvailable: IS_ROOM_NOT_AVAILABLE,
    users: ['Vincent', 'Maurice'],
    dictionary: 'Francais',
    timer: 1,
    mode: 'classique',
};
const GAME_PARAMETERS: GameParameters = {
    username: 'Vincent',
    dictionary: 'Francais',
    timer: 1,
    mode: 'classique',
    isMultiplayer: true,
};

const GAME_PARAMETERS_SOLO: GameParameters = {
    username: 'Vincent',
    dictionary: 'Francais',
    timer: 1,
    mode: 'classique',
    isMultiplayer: false,
};

describe('GameSession Service', () => {
    let gameSessions: GameSessions;
    let service: sinon.SinonStubbedInstance<SocketManager>;
    let httpServer: Server;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: SioSignature;
    beforeEach((done) => {
        service = sinon.createStubInstance(SocketManager);
        gameSessions = new GameSessions(service as unknown as SocketManager);
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
        clientSocket.close();
        sio.close();
        sinon.restore();
    });

    it('removeRoom should remove a room from the gameRoom map ', (done: Mocha.Done) => {
        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM);
        expect(gameSessions['gameRooms']?.size).equal(1);

        gameSessions['removeRoom'](sio, ROOM_ID);
        expect(gameSessions['gameRooms']?.size).equal(0);
        done();
    });

    it('removeUserFromRoom should remove a User from a room if the room is in the list ', (done: Mocha.Done) => {
        const spy2 = sinon.spy(gameSessions, 'makeRoomAvailable' as never);
        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM_2_PLAYER);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.users.length).equal(2);

        gameSessions['removeUserFromRoom'](PLAYER_NAME, SOCKET_ID, ROOM_ID);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.users.length).equal(1);
        assert(spy2.called);
        done();
    });

    it('removeUserFromRoom should call makeRoomAvailable', (done: Mocha.Done) => {
        const spy2 = sinon.spy(gameSessions, 'makeRoomAvailable' as never);

        gameSessions['removeUserFromRoom'](PLAYER_NAME, SOCKET_ID, ROOM_ID);
        assert(spy2.called);
        done();
    });

    it('removeUserFromRoom should not remove a user from a room if the user is not in the room ', (done: Mocha.Done) => {
        const userName = 'Marcel';
        const gameRoomTest: GameRoom = {
            socketID: [SOCKET_ID, 'sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: IS_ROOM_NOT_AVAILABLE,
            users: ['Vincent', 'Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomTest);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.users.length).equal(2);

        gameSessions['removeUserFromRoom'](userName, SOCKET_ID, ROOM_ID);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.users.length).equal(2);
        done();
    });

    it('addUserToRoom should add a  user to a room if the room is in the MAP ', (done: Mocha.Done) => {
        const spy2 = sinon.spy(gameSessions, 'makeRoomUnavailable' as never);
        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.users.length).equal(1);

        gameSessions['addUserToRoom'](PLAYER_NAME, SOCKET_ID, ROOM_ID);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.users.length).equal(2);
        assert(spy2.called);
        done();
    });

    it('addUserToRoom should make room Unavailable when a we add a user to a room ', (done: Mocha.Done) => {
        const spy2 = sinon.spy(gameSessions, 'makeRoomUnavailable' as never);

        gameSessions['addUserToRoom'](PLAYER_NAME, SOCKET_ID, ROOM_ID);
        assert(spy2.called);
        done();
    });

    it('makeRoomUnavailable should put the room Unavailable if the roomID is the key of a gameRoom in the gameRooms Map', (done: Mocha.Done) => {
        const gameRoomAvailable: GameRoom = {
            socketID: ['sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: !IS_ROOM_NOT_AVAILABLE,
            users: ['Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomAvailable);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.isAvailable).equal(!IS_ROOM_NOT_AVAILABLE);

        gameSessions['makeRoomUnavailable'](ROOM_ID);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.isAvailable).not.equal(!IS_ROOM_NOT_AVAILABLE);
        done();
    });

    it('makeRoomAvailable should put the room Available if the roomID is the key of a gameRoom in the gameRooms Map', (done: Mocha.Done) => {
        const gameRoomNotAvailable: GameRoom = {
            socketID: ['sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: IS_ROOM_NOT_AVAILABLE,
            users: ['Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomNotAvailable);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.isAvailable).equal(IS_ROOM_NOT_AVAILABLE);

        gameSessions['makeRoomAvailable'](ROOM_ID);
        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.isAvailable).not.equal(IS_ROOM_NOT_AVAILABLE);
        done();
    });

    it('makeRoomAvailable should not put the room Available if the room is undefined', (done: Mocha.Done) => {
        gameSessions['makeRoomAvailable'](ROOM_ID);

        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.isAvailable).equal(undefined);
        done();
    });

    it('makeRoomUnAvailable should not put the room UnAvailable if the room is undefined', (done: Mocha.Done) => {
        gameSessions['makeRoomUnavailable'](ROOM_ID);

        expect(gameSessions['gameRooms']?.get(ROOM_ID)?.isAvailable).equal(undefined);
        done();
    });

    it('getOpponentName should return the name of the other player in the gameRoom', (done: Mocha.Done) => {
        const gameRoom2: GameRoom = {
            socketID: [SOCKET_ID, 'sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: IS_ROOM_NOT_AVAILABLE,
            users: [OPPONENT_NAME, PLAYER_NAME],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        gameSessions['gameRooms'].set(ROOM_ID, gameRoom2);

        expect(gameSessions['getOpponentName'](PLAYER_NAME, ROOM_ID)).equal(OPPONENT_NAME);
        expect(gameSessions['getOpponentName'](OPPONENT_NAME, ROOM_ID)).equal(PLAYER_NAME);
        done();
    });

    it('getOpponentName should return empty string if the room is undefined', (done: Mocha.Done) => {
        expect(gameSessions['getOpponentName'](PLAYER_NAME, ROOM_ID)).equal('');

        done();
    });

    it("getOpponentName should return a empty string if the room doesn't exist", (done: Mocha.Done) => {
        const GAME_ROOM_2: GameRoom = {
            socketID: [SOCKET_ID, 'sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: IS_ROOM_NOT_AVAILABLE,
            users: [OPPONENT_NAME, PLAYER_NAME],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        const undefinedRoomID = '2';
        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM_2);

        expect(gameSessions['getOpponentName'](PLAYER_NAME, undefinedRoomID)).equal('');
        done();
    });

    it('sameUsernameExists should return true if the user in the room Has the same name that the player in the room', (done: Mocha.Done) => {
        const sameName = 'Maurice';
        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM);

        expect(gameSessions['sameUsernameExists'](sameName, ROOM_ID)).equal(true);
        done();
    });

    it('sameUsernameExists should return true if the room is undefined', (done: Mocha.Done) => {
        const sameName = 'Maurice';

        expect(gameSessions['sameUsernameExists'](sameName, ROOM_ID)).equal(true);
        done();
    });

    it('sameUsernameExists should return false if the user in the room has not the same name that the player in the room', (done: Mocha.Done) => {
        const notSameName = 'Paul';
        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM);

        expect(gameSessions['sameUsernameExists'](notSameName, ROOM_ID)).equal(false);
        done();
    });

    it('setupNewRoom should add the room in the map of the room when setUp a new multiplayer game', (done: Mocha.Done) => {
        expect(gameSessions['gameRooms']?.size).equal(0);

        gameSessions['setupNewRoom'](GAME_PARAMETERS, SOCKET_ID);

        expect(gameSessions['gameRooms']?.size).equal(1);
        done();
    });

    it('setupNewRoom should add the room in the map of the room when setUp a new solo game', (done: Mocha.Done) => {
        expect(gameSessions['gameRooms']?.size).equal(0);

        gameSessions['setupNewRoom'](GAME_PARAMETERS_SOLO, SOCKET_ID);

        expect(gameSessions['gameRooms']?.size).equal(1);
        done();
    });

    it('roomStatus should return the isAvailable property of the GameRoom', (done: Mocha.Done) => {
        const gameRoomTest: GameRoom = {
            socketID: ['sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: !IS_ROOM_NOT_AVAILABLE,
            users: ['Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        const roomIDInvalid = '2';
        gameSessions['gameRooms'].set(ROOM_ID, gameRoomTest);

        expect(gameSessions['roomStatus'](ROOM_ID)).equal(!IS_ROOM_NOT_AVAILABLE);
        expect(gameSessions['roomStatus'](roomIDInvalid)).not.equal(!IS_ROOM_NOT_AVAILABLE);
        done();
    });

    it('getAvailableRooms should return an Array with all the room that are Available', (done: Mocha.Done) => {
        const gameRoomTest: GameRoom = {
            socketID: ['sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: true,
            users: ['Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        const gameRoomTest2: GameRoom = {
            socketID: [SOCKET_ID],
            id: '2',
            isAvailable: true,
            users: ['Vincent'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        const roomID2 = '2';

        let GAME_ROOM_AVAILABLE = gameSessions['getAvailableRooms']();
        expect(GAME_ROOM_AVAILABLE.length).equal(0);

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomTest);

        gameSessions['gameRooms'].set(roomID2, gameRoomTest2);

        GAME_ROOM_AVAILABLE = gameSessions['getAvailableRooms']();
        expect(GAME_ROOM_AVAILABLE.length).equal(2);
        done();
    });

    it('getNewId should return a new id for a new room', (done: Mocha.Done) => {
        const gameId = gameSessions['getNewId']();
        expect(gameId).equal((--gameSessions.idCounter).toString());
        done();
    });

    it('createGame should return confirmation that the game was created with the id of the room', (done: Mocha.Done) => {
        serverSocket.on('createGame', (gameInfo) => {
            gameSessions['createGame'](sio, serverSocket, gameInfo);
        });
        clientSocket.emit('createGame', GAME_PARAMETERS);
        clientSocket.on('gameCreatedConfirmation', (roomId: string) => {
            expect(roomId).to.contain((--gameSessions.idCounter).toString());
            done();
        });
    });

    it('rejectByOtherPlayer should call removeUserFromRoom', (done: Mocha.Done) => {
        const parametersTest: Parameters = {
            id: ROOM_ID,
            name: OPPONENT_NAME,
        };
        const spy = sinon.spy(gameSessions, 'removeUserFromRoom' as never);

        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM_2_PLAYER);

        gameSessions['rejectByOtherPlayer'](sio, serverSocket, parametersTest);

        assert(spy.called);
        done();
    });

    it('removeRoom should delete the room from the list ', (done: Mocha.Done) => {
        const spy = sinon.spy(gameSessions['gameRooms'], 'delete' as never);

        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM_2_PLAYER);

        gameSessions['removeRoom'](sio, ROOM_ID);

        assert(spy.called);
        done();
    });

    it('exitWaitingRoom should call the method removeUserFromRoom ', (done: Mocha.Done) => {
        const parametersTest: Parameters = {
            id: ROOM_ID,
            name: OPPONENT_NAME,
        };

        const spy = sinon.spy(gameSessions, 'removeUserFromRoom' as never);

        gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM_2_PLAYER);

        gameSessions['exitWaitingRoom'](serverSocket, parametersTest);

        assert(spy.called);
        done();
    });

    it('getRoomId should return null if there is no room Available ', (done: Mocha.Done) => {
        const value = gameSessions['getRoomId'](serverSocket.id);
        expect(value).to.equal(null);
        done();
    });

    it('disconnect should not call the removeRoom method after 6 second if the room Id is null', (done: Mocha.Done) => {
        const clock = sinon.useFakeTimers();
        const timeout6seconds = 6000;

        const spy = sinon.spy(gameSessions, 'removeRoom' as never);

        gameSessions['disconnect'](sio, serverSocket);
        clock.tick(timeout6seconds);
        assert(spy.notCalled);
        clock.restore();
        done();
    });

    it('disconnect should call the removeRoom method after 6 seconds ', (done: Mocha.Done) => {
        const clock = sinon.useFakeTimers();
        const timeout6seconds = 6000;
        const gameRoomAvailable: GameRoom = {
            socketID: [serverSocket.id],
            id: ROOM_ID,
            isAvailable: !IS_ROOM_NOT_AVAILABLE,
            users: ['Vincent'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        const spy = sinon.spy(gameSessions, 'removeRoom' as never);

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomAvailable);

        gameSessions['disconnect'](sio, serverSocket);
        clock.tick(timeout6seconds);
        assert(spy.called);
        clock.restore();
        done();
    });

    it('roomJoin should emit an error if the person in the room have the same name that the player that want to join', (done: Mocha.Done) => {
        const sameUserError = "L'adversaire a le même nom";
        const parameters2: Parameters = { id: '1', name: 'Vincent' };
        const gameRoomAvailable: GameRoom = {
            socketID: ['sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: !IS_ROOM_NOT_AVAILABLE,
            users: ['Vincent'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomAvailable);
        serverSocket.on(SocketEvents.PlayerJoinGameAvailable, (parameters) => {
            gameSessions['playerJoinGameAvailable'](sio, serverSocket, parameters);
        });
        clientSocket.emit(SocketEvents.PlayerJoinGameAvailable, parameters2);
        clientSocket.on(SocketEvents.ErrorJoining, (reason: string) => {
            expect(reason).to.equal(sameUserError);
            done();
        });
    });

    it('roomJoin should add the player in the room if no problem occurred', (done: Mocha.Done) => {
        const gameRoomAvailable: GameRoom = {
            socketID: ['sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: !IS_ROOM_NOT_AVAILABLE,
            users: ['Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };
        const parametersTest: Parameters = { id: '1', name: 'Chris' };
        const spy = sinon.spy(gameSessions, 'addUserToRoom' as never);

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomAvailable);

        gameSessions['playerJoinGameAvailable'](sio, serverSocket, parametersTest);
        assert(spy.called);
        done();
    });

    it('roomJoin should emit an error if the room is full and he try to join the room', (done: Mocha.Done) => {
        const roomNotAvailableError = "La salle n'est plus disponible";
        const parametersTest: Parameters = { id: '1', name: 'Chris' };
        const gameRoomFull: GameRoom = {
            socketID: [SOCKET_ID, 'sfdg78fdsg'],
            id: ROOM_ID,
            isAvailable: false,
            users: ['Vincent', 'Maurice'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomFull);
        serverSocket.on(SocketEvents.PlayerJoinGameAvailable, (parameters) => {
            gameSessions['playerJoinGameAvailable'](sio, serverSocket, parameters);
        });
        clientSocket.emit(SocketEvents.PlayerJoinGameAvailable, parametersTest);
        clientSocket.on(SocketEvents.ErrorJoining, (reason: string) => {
            expect(reason).to.equal(roomNotAvailableError);
            done();
        });
    });

    it('InitSocketEvents() should call the on() and io() methods of socketManager', (done) => {
        const createGameSpy = sinon.stub(gameSessions, 'createGame' as never);
        const playerJoinGameSpy = sinon.stub(gameSessions, 'playerJoinGameAvailable' as never);
        const roomLobbySpy = sinon.stub(gameSessions, 'roomLobby' as never);
        const exitWaitingRoomSpy = sinon.stub(gameSessions, 'exitWaitingRoom' as never);
        const removeRoomSpy = sinon.stub(gameSessions, 'removeRoom' as never);
        const rejectOpponentSpy = sinon.stub(gameSessions, 'rejectOpponent' as never);
        const joinRoomSpy = sinon.stub(gameSessions, 'joinRoom' as never);
        const rejectByOtherPlayerSpy = sinon.stub(gameSessions, 'rejectByOtherPlayer' as never);
        const startScrabbleGameSpy = sinon.stub(gameSessions, 'startScrabbleGame' as never);
        const disconnectSpy = sinon.stub(gameSessions, 'disconnect' as never);

        gameSessions.initSocketEvents();
        service.io.getCall(0).args[1](sio, serverSocket);
        service.io.getCall(1).args[1](sio, serverSocket);
        service.io.getCall(2).args[1](sio, serverSocket);
        service.io.getCall(3).args[1](sio, serverSocket);
        service.io.getCall(4).args[1](sio, serverSocket);
        service.io.getCall(5).args[1](sio, serverSocket);
        service.io.getCall(6).args[1](sio, serverSocket);

        service.on.getCall(0).args[1](serverSocket);
        service.on.getCall(1).args[1](serverSocket);
        service.on.getCall(2).args[1](serverSocket);

        expect(createGameSpy.called).to.be.eql(true);
        expect(playerJoinGameSpy.called).to.be.eql(true);
        expect(roomLobbySpy.called).to.be.eql(true);
        expect(exitWaitingRoomSpy.called).to.be.eql(true);
        expect(removeRoomSpy.called).to.be.eql(true);
        expect(rejectOpponentSpy.called).to.be.eql(true);
        expect(joinRoomSpy.called).to.be.eql(true);
        expect(rejectByOtherPlayerSpy.called).to.be.eql(true);
        expect(startScrabbleGameSpy.called).to.be.eql(true);
        expect(disconnectSpy.called).to.be.eql(true);

        expect(service.io.called).to.equal(true);
        expect(service.on.called).to.equal(true);
        done();
    });

    it('joinRoom should make the player join the room with the roomID parameter', (done: Mocha.Done) => {
        gameSessions['joinRoom'](serverSocket, ROOM_ID);
        expect(serverSocket.rooms).contain(ROOM_ID);
        done();
    });

    it('joinRoom should make the player join a room to be updated with the room Available to join', (done: Mocha.Done) => {
        const playerJoiningRoom = 'joinGameRoom';

        gameSessions['roomLobby'](sio, serverSocket);
        expect(serverSocket.rooms).contain(playerJoiningRoom);
        done();
    });

    it('getRoomId should return the key of a socket ID ', (done: Mocha.Done) => {
        const gameRoomTest2: GameRoom = {
            socketID: [SOCKET_ID],
            id: '2',
            isAvailable: false,
            users: ['Vincent'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomTest2);

        const key = gameSessions['getRoomId'](SOCKET_ID);
        expect(key).to.equal(ROOM_ID);
        done();
    });

    it('getRoomId should return null if the socket ID is not in a room', (done: Mocha.Done) => {
        const fakeSocket = 'adsfds345';
        const gameRoomTest2: GameRoom = {
            socketID: [SOCKET_ID],
            id: '2',
            isAvailable: false,
            users: ['Vincent'],
            dictionary: 'Francais',
            timer: 1,
            mode: 'classique',
        };

        gameSessions['gameRooms'].set(ROOM_ID, gameRoomTest2);

        const key = gameSessions['getRoomId'](fakeSocket);
        expect(key).to.equal(null);
        done();
    });

    context('Two Clientsocket tests', () => {
        let secondSocket: Socket;
        beforeEach((done) => {
            serverSocket.join(ROOM_ID);
            secondSocket = Client(`http://localhost:${port}`);
            secondSocket.on('connect', done);
        });

        it('startScrabbleGame should not emit an event to the player if the room is undefined', () => {
            gameSessions['startScrabbleGame'](sio, serverSocket, ROOM_ID);

            expect(gameSessions['gameRooms'].get(ROOM_ID)).to.equal(undefined);
        });

        it('rejectOpponent should emit a message to the other player in the room when he reject him', (done) => {
            const rejectMessage = "L'adversaire à rejeter votre demande";

            clientSocket.on(SocketEvents.RejectByOtherPlayer, (information) => {
                expect(information).to.be.eql(rejectMessage);
                done();
            });

            gameSessions['rejectOpponent'](serverSocket, ROOM_ID);
        });

        it('startScrabbleGame should emit an event to the player in the room with the socketID of the players', (done: Mocha.Done) => {
            gameSessions['gameRooms'].set(ROOM_ID, GAME_ROOM_2_PLAYER);

            clientSocket.on(SocketEvents.GameAboutToStart, (socketId: string[]) => {
                expect(socketId).to.be.eql(GAME_ROOM_2_PLAYER.socketID);
                done();
            });

            gameSessions['startScrabbleGame'](sio, serverSocket, ROOM_ID);
        });

        afterEach(() => {
            secondSocket.close();
        });
    });
});
