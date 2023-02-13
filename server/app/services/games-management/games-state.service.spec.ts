/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-empty-function*/
/* eslint-disable dot-notation*/
import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { Gameboard } from '@app/classes/gameboard.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { ObjectivesHandler } from '@app/classes/objectives-handler.class';
import { BeginnerBot } from '@app/classes/player/beginner-bot.class';
import { Player } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { ScoreStorageService } from '@app/services/database/score-storage.service';
import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { RackService } from '@app/services/rack.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { expect } from 'chai';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { ReplaySubject } from 'rxjs';
import * as sinon from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { GamesStateService } from './games-state.service';

const ROOM = '0';

describe('GamesState Service', () => {
    let gamesStateService: GamesStateService;
    let gamesHandlerStub: sinon.SinonStubbedInstance<GamesHandler>;
    let socketManagerStub: sinon.SinonStubbedInstance<SocketManager>;
    let scoreStorageStub: sinon.SinonStubbedInstance<ScoreStorageService>;
    let virtualPlayersStorageStub: sinon.SinonStubbedInstance<VirtualPlayersStorageService>;
    let game: sinon.SinonStubbedInstance<Game> & Game;

    let httpServer: Server;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: ioServer;

    let player1: sinon.SinonStubbedInstance<RealPlayer>;
    let player2: sinon.SinonStubbedInstance<RealPlayer>;
    let gameInfo: {
        playerName: string[];
        roomId: string;
        timer: number;
        socketId: string[];
        mode: string;
        botDifficulty?: string;
        dictionary: string;
    };

    beforeEach((done) => {
        player1 = sinon.createStubInstance(RealPlayer);
        player2 = sinon.createStubInstance(RealPlayer);

        player1.room = '1';
        player2.room = '1';
        player1.rack = [{ value: 'c', quantity: 2, points: 1 }];
        player2.rack = [{ value: 'c', quantity: 2, points: 1 }];
        player1.score = 0;
        player2.score = 0;
        player1.objectives = [];
        player2.objectives = [];

        game = sinon.createStubInstance(Game) as sinon.SinonStubbedInstance<Game> & Game;
        game.wordSolver = sinon.createStubInstance(WordSolver) as unknown as WordSolver;
        game.turn = { countdown: new ReplaySubject(), endTurn: new ReplaySubject() } as Turn;
        game.letterReserve = sinon.createStubInstance(LetterReserve) as unknown as LetterReserve;
        game.letterReserve.lettersReserve = [{ value: 'c', quantity: 2, points: 1 }];
        game.gameboard = sinon.createStubInstance(Gameboard);
        game.objectivesHandler = sinon.createStubInstance(ObjectivesHandler) as ObjectivesHandler & sinon.SinonStubbedInstance<ObjectivesHandler>;
        game.dictionaryValidation = sinon.createStubInstance(DictionaryValidation) as unknown as DictionaryValidation;
        game.letterPlacement = sinon.createStubInstance(LetterPlacement) as unknown as LetterPlacement;
        game.wordSolver = sinon.createStubInstance(WordSolver) as unknown as WordSolver;

        player1.game = game;

        socketManagerStub = sinon.createStubInstance(SocketManager);
        scoreStorageStub = sinon.createStubInstance(ScoreStorageService);
        gamesHandlerStub = sinon.createStubInstance(GamesHandler);
        virtualPlayersStorageStub = sinon.createStubInstance(VirtualPlayersStorageService);
        gamesStateService = new GamesStateService(
            socketManagerStub as never,
            gamesHandlerStub as never,
            scoreStorageStub as never,
            virtualPlayersStorageStub as never,
        );

        gamesHandlerStub.players = new Map();
        gamesHandlerStub.gamePlayers = new Map();
        gamesHandlerStub.dictionaries = new Map();

        httpServer = createServer();
        sio = new ioServer(httpServer);
        httpServer.listen(() => {
            port = (httpServer.address() as AddressInfo).port;
            clientSocket = Client(`http://localhost:${port}`);
            sio.on('connection', (socket) => {
                serverSocket = socket;
                gameInfo = {
                    playerName: [],
                    roomId: ROOM,
                    timer: 0,
                    socketId: [serverSocket.id],
                    mode: 'classique',
                    botDifficulty: undefined,
                    dictionary: 'Francais',
                };
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
        const createGameSpy = sinon.stub(gamesStateService, 'createGame' as never);
        const disconnectSpy = sinon.stub(gamesStateService, 'disconnect' as never);
        const abandonGameSpy = sinon.stub(gamesStateService, 'abandonGame' as never);

        gamesStateService.initSocketsEvents();
        const CALL_NUMBER = 4;
        for (let i = 0; i < CALL_NUMBER; i++) {
            socketManagerStub.on.getCall(i).args[1](serverSocket);
        }

        expect(createGameSpy.called).to.be.eql(true);
        expect(disconnectSpy.called).to.be.eql(true);
        expect(abandonGameSpy.called).to.be.eql(true);
        expect(socketManagerStub.on.called).to.equal(true);

        done();
    });

    it('setAndGetPlayer() should set a new player and return him for the first player', () => {
        const FIRST_PLAYER = 'BIGBROTHER';
        const FIRST_PLAYER_SOCKET_ID = '0';
        const EXPECTED_NEW_PLAYER = new Player(FIRST_PLAYER);
        EXPECTED_NEW_PLAYER.room = ROOM;

        const gameInformation = {
            playerName: [FIRST_PLAYER],
            roomId: ROOM,
            timer: 0,
            socketId: [FIRST_PLAYER_SOCKET_ID],
            mode: 'classique',
            botDifficulty: undefined,
            dictionary: 'Francais',
        };

        const newPlayer = gamesStateService['setAndGetPlayer'](gameInformation) as Player;
        expect(newPlayer).to.be.eql(EXPECTED_NEW_PLAYER as Player);

        expect(gamesHandlerStub['players'].get(FIRST_PLAYER_SOCKET_ID) as Player).to.be.eql(EXPECTED_NEW_PLAYER as Player);
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
            mode: 'classique',
            botDifficulty: undefined,
            dictionary: 'Francais',
        };

        gamesStateService['setAndGetPlayer'](gameInformation) as Player;

        const newPlayer = gamesStateService['setAndGetPlayer'](gameInformation) as Player;
        expect(newPlayer).to.be.eql(EXPECTED_NEW_PLAYER as Player);

        expect(gamesHandlerStub['players'].get(SECOND_PLAYER_SOCKET_ID) as Player).to.be.eql(EXPECTED_NEW_PLAYER as Player);
    });
    it('setAndGetPlayer() should set a Beginner bot player and return him for the second player', () => {
        const FIRST_PLAYER = 'BIGBROTHER';
        const SECOND_PLAYER = 'LITTLEBROTHER';
        const FIRST_PLAYER_SOCKET_ID = '0';
        const dictionaryValidation = new DictionaryValidation(['string']);
        const wordSolver = new WordSolver(dictionaryValidation);
        const letterPlacement = new LetterPlacement(dictionaryValidation, Container.get(RackService));

        const gameInformation = {
            playerName: [FIRST_PLAYER, SECOND_PLAYER],
            roomId: ROOM,
            timer: 0,
            socketId: [FIRST_PLAYER_SOCKET_ID],
            mode: 'classique',
            botDifficulty: 'Débutant',
            dictionary: 'Francais',
        };

        const EXPECTED_NEW_PLAYER = new BeginnerBot(false, SECOND_PLAYER, {
            timer: gameInformation.timer,
            roomId: gameInformation.roomId,
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
        });

        gamesHandlerStub['dictionaries'].set('Francais', {
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
            wordSolver: wordSolver as WordSolver,
            letterPlacement: letterPlacement as LetterPlacement,
        });
        gamesStateService['setAndGetPlayer'](gameInformation) as Player;

        const newPlayer = gamesStateService['setAndGetPlayer'](gameInformation) as Player;
        expect(newPlayer).to.be.eql(EXPECTED_NEW_PLAYER as Player);
    });

    it('setAndGetPlayer() should set a  Expert bot player and return him for the second player', () => {
        const FIRST_PLAYER = 'BIGBROTHER';
        const SECOND_PLAYER = 'LITTLEBROTHER';
        const FIRST_PLAYER_SOCKET_ID = '0';
        const dictionaryValidation = new DictionaryValidation(['string']);
        const wordSolver = new WordSolver(dictionaryValidation);
        const letterPlacement = new LetterPlacement(dictionaryValidation, Container.get(RackService));

        const gameInformation = {
            playerName: [FIRST_PLAYER, SECOND_PLAYER],
            roomId: ROOM,
            timer: 0,
            socketId: [FIRST_PLAYER_SOCKET_ID],
            mode: 'classique',
            botDifficulty: 'Expert',
            dictionary: 'Francais',
        };
        const EXPECTED_NEW_PLAYER = new BeginnerBot(false, SECOND_PLAYER, {
            timer: gameInformation.timer,
            roomId: gameInformation.roomId,
            dictionaryValidation: new DictionaryValidation(['string']),
        });

        gamesHandlerStub['dictionaries'].set('Francais', {
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
            wordSolver: wordSolver as WordSolver,
            letterPlacement: letterPlacement as LetterPlacement,
        });
        gamesStateService['setAndGetPlayer'](gameInformation) as Player;
        const newPlayer = gamesStateService['setAndGetPlayer'](gameInformation) as Player;
        expect(newPlayer).to.be.eql(EXPECTED_NEW_PLAYER as Player);
    });

    it('createNewGame() should return a new game created in classique mode', () => {
        sinon.stub(Turn);
        const TIMER = 60;
        const dictionaryValidation = new DictionaryValidation(['string']);
        const wordSolver = new WordSolver(dictionaryValidation);
        const letterPlacement = new LetterPlacement(dictionaryValidation, Container.get(RackService));
        const params = {
            playerName: [player1.name, player2.name],
            roomId: '1',
            timer: TIMER,
            socketId: [serverSocket.id],
            mode: 'classique',
            botDifficulty: undefined,
            dictionary: 'Francais',
        };

        gamesHandlerStub['dictionaries'].set('Francais', {
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
            wordSolver: wordSolver as WordSolver,
            letterPlacement: letterPlacement as LetterPlacement,
        });
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);
        const gameTest = gamesStateService['createNewGame'](params);
        expect(gameTest !== undefined).to.eql(true);
    });

    it('createNewGame() should return a new game created in LOG2990 mode', () => {
        const dictionaryValidation = new DictionaryValidation(['string']);
        const wordSolver = new WordSolver(dictionaryValidation);
        const letterPlacement = new LetterPlacement(dictionaryValidation, Container.get(RackService));
        const TIMER = 60;
        const params = {
            playerName: [player1.name, player2.name],
            roomId: '1',
            timer: TIMER,
            socketId: [serverSocket.id],
            mode: 'LOG2990',
            botDifficulty: undefined,
            dictionary: 'Francais',
        };

        gamesHandlerStub['dictionaries'].set('Francais', {
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
            wordSolver: wordSolver as WordSolver,
            letterPlacement: letterPlacement as LetterPlacement,
        });
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);
        const gameTest = gamesStateService['createNewGame'](params);
        expect(gameTest !== undefined).to.eql(true);
    });

    it('sendObjectivesToClient() should emit the objective to the client', () => {
        player1.game.isMode2990 = true;

        gamesStateService['sendObjectivesToClient'](player1, player2);
        expect(socketManagerStub.emitRoom.called).to.equal(true);
    });

    it("changeTurn() should send the game's information when called and the active player isn't undefined", () => {
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);
        gamesStateService['changeTurn']('1');
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.Skip, game));
    });

    it('sendTimer() should call emitRoom() with the correct parameters', () => {
        gamesStateService['sendTimer'](ROOM, 0);
        expect(socketManagerStub.emitRoom.calledOnceWith(ROOM, SocketEvents.TimerClientUpdate, 0));
    });

    it('abandonGame() should emit to the room that the opponent left when it his a multiplayerGame', () => {
        const switchToSoloStub = sinon.stub(gamesStateService, 'switchToSolo' as never);
        const gameStub = sinon.createStubInstance(Game);
        const player = sinon.createStubInstance(Player);
        player.game = gameStub as unknown as Game;
        player.room = ROOM;

        gamesHandlerStub['players'].set(serverSocket.id, player);

        gamesStateService['abandonGame'](serverSocket);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.UserDisconnect)).to.equal(true);
        expect(switchToSoloStub.called).to.equal(true);
    });

    it('abandonGame() should not emit to the room that the opponent left when it his a solo Game', () => {
        const switchToSoloStub = sinon.stub(gamesStateService, 'switchToSolo' as never);
        const gameStub = sinon.createStubInstance(Game);
        const player = sinon.createStubInstance(Player);
        player.game = gameStub as unknown as Game;
        player.room = ROOM;
        player.game.isModeSolo = true;
        gamesHandlerStub['players'].set(serverSocket.id, player);

        gamesStateService['abandonGame'](serverSocket);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.UserDisconnect)).to.equal(false);
        expect(switchToSoloStub.called).to.equal(false);
    });

    it("abandonGame() shouldn't do anything if the player isn't in the map ()", () => {
        gamesStateService['abandonGame'](serverSocket);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.OpponentGameLeave)).to.not.be.equal(true);
        expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.GameEnd)).to.not.be.equal(true);
    });

    it('switchToSolo() should call generateBotName when we replace a player with a bot', () => {
        const generateBotNameStub = sinon.stub(gamesStateService, 'generateBotName' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];

        gamesHandlerStub['players'].set(serverSocket.id, player1);
        gamesHandlerStub['players'].set(socketId[1], player2);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

        player1.getInformation.returns({
            name: 'vincent',
            score: player1.score,
            rack: player1.rack,
            room: player1.room,
            gameboard: game.gameboard.gameboardTiles,
        });

        gamesStateService['switchToSolo'](serverSocket, player1);

        expect(generateBotNameStub.called).to.equal(true);
    });

    it('switchToSolo() should call generateBotName when we replace a player with a bot', () => {
        const generateBotNameStub = sinon.stub(gamesStateService, 'generateBotName' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];
        player1.game.turn.activePlayer = 'Bob';
        gamesHandlerStub['players'].set(serverSocket.id, player1);
        gamesHandlerStub['players'].set(socketId[1], player2);
        gamesHandlerStub['gamePlayers'].set(player1.room, [player2, player1]);
        player1.getInformation.returns({
            name: 'vincent',
            score: player1.score,
            rack: player1.rack,
            room: player1.room,
            gameboard: game.gameboard.gameboardTiles,
        });

        gamesStateService['switchToSolo'](serverSocket, player1);
        expect(generateBotNameStub.called).to.equal(true);
    });

    it('switchToSolo() should  not call updateNewBot when there is no player in the room', () => {
        const generateBotNameStub = sinon.stub(gamesStateService, 'generateBotName' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];

        gamesHandlerStub['players'].set(serverSocket.id, player1);
        gamesHandlerStub['players'].set(socketId[1], player2);

        player1.getInformation.returns({
            name: 'vincent',
            score: player1.score,
            rack: player1.rack,
            room: player1.room,
            gameboard: game.gameboard.gameboardTiles,
        });

        gamesStateService['switchToSolo'](serverSocket, player1);
        expect(generateBotNameStub.called).to.equal(false);
    });

    it('disconnect() should call this.waitBeforeDisconnect() when the game is not already finish', () => {
        const waitBeforeDisconnectStub = sinon.stub(gamesStateService, 'waitBeforeDisconnect' as never);
        const player = new Player('Jean');
        player.room = ROOM;
        const gameHolderTest = sinon.createStubInstance(Game);
        gameHolderTest.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        gameHolderTest.turn = { activePlayer: '' } as Turn;
        gameHolderTest.skip.returns(true);
        player.game = gameHolderTest as unknown as Game;

        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

        gamesStateService['disconnect'](serverSocket);
        expect(waitBeforeDisconnectStub.called).to.equal(true);
    });
    it('disconnect() should emit to the room that the opponent left when the game is already finish', (done) => {
        const player = new Player('Jean');
        player.room = ROOM;
        const gameHolderTest = sinon.createStubInstance(Game);
        gameHolderTest.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        gameHolderTest.turn = { activePlayer: '' } as Turn;
        gameHolderTest.skip.returns(true);
        player.game = gameHolderTest as unknown as Game;
        player.game.isGameFinish = true;

        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

        gamesStateService['disconnect'](serverSocket);
        expect(socketManagerStub.emitRoom.called).to.be.equal(true);
        done();
    });
    it('disconnect() should not do anything if the socket is invalid', (done) => {
        const player = new Player('Jean');
        player.room = ROOM;
        const gameHolderTest = sinon.createStubInstance(Game);
        gameHolderTest.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        gameHolderTest.turn = { activePlayer: '' } as Turn;
        gameHolderTest.skip.returns(true);
        player.game = gameHolderTest as unknown as Game;
        player.game.isGameFinish = true;

        gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

        gamesStateService['disconnect'](serverSocket);
        expect(socketManagerStub.emitRoom.called).to.not.be.equal(true);
        done();
    });

    it('waitBeforeDisconnect() should call abandonGame after 5 seconds of waiting for a reconnect', (done) => {
        const abandonGameStub = sinon.stub(gamesStateService, 'abandonGame' as never);
        const clock = sinon.useFakeTimers();
        const player = new Player('Jean');
        player.room = ROOM;
        const gameHolderTest = sinon.createStubInstance(Game);
        gameHolderTest.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
        gameHolderTest.turn = { activePlayer: '' } as Turn;
        gameHolderTest.skip.returns(true);
        player.game = gameHolderTest as unknown as Game;
        const timeOut5Seconds = 5500;

        gamesHandlerStub['players'].set(serverSocket.id, player);
        gamesHandlerStub['gamePlayers'].set(ROOM, [player]);

        gamesStateService['waitBeforeDisconnect'](serverSocket);
        clock.tick(timeOut5Seconds);
        expect(abandonGameStub.called).to.be.equal(true);
        done();
    });

    it('generateBotName() should call scoreStorage.getBeginnerBot', () => {
        const player = { name: 'Vincent', room: ROOM, score: 40 } as Player;

        gamesStateService['generateBotName'](player.name);
        expect(virtualPlayersStorageStub.getBeginnerBot.called).to.equal(true);
    });

    it('generateBotName() should return a name for the bot', async () => {
        const player = { name: 'Vincent', room: ROOM, score: 40 } as Player;
        virtualPlayersStorageStub.getBeginnerBot.resolves([
            {
                username: 'Paul',
                difficulty: 'debutant',
            },
            {
                username: 'Vincent',
                difficulty: 'debutant',
            },
            {
                username: 'Luc',
                difficulty: 'debutant',
            },
        ]);
        const result = await gamesStateService['generateBotName'](player.name);
        expect(result).to.not.equal('Vincent');
    });

    it('sendHighScore() should call scoreStorage.addTopScore', () => {
        const gameStub = sinon.createStubInstance(Game);
        const player = { name: 'Vincent', room: ROOM, score: 40 } as Player;
        player.game = gameStub as unknown as Game;
        player.game.gameMode = 'classique';
        gamesHandlerStub['players'].set(serverSocket.id, player);

        gamesStateService['sendHighScore'](serverSocket.id);
        expect(scoreStorageStub.addTopScores.called).to.equal(true);
    });

    it('userConnected() should call sendHighScore and endGame when the two player are still in the game', () => {
        const endGameStub = sinon.stub(gamesStateService, 'endGame' as never);
        const sendHighScoreStub = sinon.stub(gamesStateService, 'sendHighScore' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];

        gamesHandlerStub['players'].set(socketId[0], player1);
        gamesHandlerStub['players'].set(socketId[1], player2);

        gamesStateService['userConnected'](socketId, player1.room);
        expect(endGameStub.called).to.equal(true);
        expect(sendHighScoreStub.called).to.equal(true);
    });
    it('userConnected() should call sendHighScore and endGame when the first player is still in the game', () => {
        const endGameStub = sinon.stub(gamesStateService, 'endGame' as never);
        const sendHighScoreStub = sinon.stub(gamesStateService, 'sendHighScore' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];

        gamesHandlerStub['players'].set(socketId[0], player1);

        gamesStateService['userConnected'](socketId, player1.room);
        expect(endGameStub.called).to.equal(true);
        expect(sendHighScoreStub.called).to.equal(true);
    });
    it('userConnected() should call sendHighScore and endGame when the second player is still in the game', () => {
        const endGameStub = sinon.stub(gamesStateService, 'endGame' as never);
        const sendHighScoreStub = sinon.stub(gamesStateService, 'sendHighScore' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];

        gamesHandlerStub['players'].set(socketId[1], player2);

        gamesStateService['userConnected'](socketId, player1.room);
        expect(endGameStub.called).to.equal(true);
        expect(sendHighScoreStub.called).to.equal(true);
    });

    it('userConnected() should not call sendHighScore and endGame when the sockets are invalid', () => {
        const endGameStub = sinon.stub(gamesStateService, 'endGame' as never);
        const sendHighScoreStub = sinon.stub(gamesStateService, 'sendHighScore' as never);
        const socketId = ['asdjcvknxcv', '534876tgsdfj'];

        gamesStateService['userConnected'](socketId, player1.room);
        expect(endGameStub.called).to.not.equal(true);
        expect(sendHighScoreStub.called).to.not.equal(true);
    });

    context('endGameScore tests', () => {
        beforeEach(() => {
            player1 = sinon.createStubInstance(RealPlayer);
            player2 = sinon.createStubInstance(RealPlayer);

            player1.room = '1';
            player2.room = '1';
            player1.rack = [{ value: 'c', quantity: 2, points: 1 }];
            player2.rack = [{ value: 'c', quantity: 2, points: 1 }];
            player1.score = 0;
            player2.score = 0;

            player1.game = game;
            player2.game = game;
        });
        it('endGameScore() should call deductPoints() of each player in a game if there is 6 consecutive skips in the classic mode', () => {
            player1.game.isMode2990 = false;
            player1.game.turn.skipCounter = 6;
            gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

            gamesStateService['endGameScore'](player1.room);
            expect(player1.deductPoints.called).to.equal(true);
        });

        it('endGameScore() should call deductPoints() of each player in a game if there is 6 consecutive skips in the LOG2990 mode ', () => {
            player1.game.isMode2990 = true;
            player1.game.turn.skipCounter = 6;
            gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

            gamesStateService['endGameScore'](player1.room);
            expect(player1.deductPoints.called).to.equal(true);
        });
        it(
            'endGameScore() should call addPoints() with the second player rack as param for the first player ' +
                'if his rack is empty and call deductPoints() for the other player',
            () => {
                player1.rackIsEmpty.returns(true);
                player1.game.isMode2990 = true;
                player1.game.turn.skipCounter = 0;
                gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

                gamesStateService['endGameScore'](player1.room);
                expect(player1.addPoints.calledWith(player2.rack)).to.equal(true);
                expect(player2.deductPoints.called).to.equal(true);
            },
        );
        it(
            'endGameScore() should call addPoints() with the first player rack as param for ' +
                'the second player if his rack is empty and call deductPoints() for the other player',
            () => {
                player2.rackIsEmpty.returns(true);
                player1.game.turn.skipCounter = 0;

                gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

                gamesStateService['endGameScore'](player1.room);
                expect(player2.addPoints.calledWith(player1.rack)).to.equal(true);
                expect(player1.deductPoints.called).to.equal(true);
            },
        );
        it('endGameScore() should not do anything if the game has not ended', () => {
            player1.game.turn.skipCounter = 0;
            gamesHandlerStub['gamePlayers'].set(player1.room, [player1, player2]);

            gamesStateService['endGameScore'](player1.room);
            expect(player2.addPoints.calledWith(player1.rack)).to.not.equal(true);
            expect(player1.deductPoints.called).to.not.equal(true);
            expect(player1.addPoints.calledWith(player2.rack)).to.not.equal(true);
            expect(player2.deductPoints.called).to.not.equal(true);
        });
    });

    context('endGame() Tests', () => {
        it('endGame() should emit a event to the client when the game is not already finished and we need to post endGame information', (done) => {
            const player = sinon.createStubInstance(RealPlayer);
            player.name = '';
            player.room = ROOM;
            const gameHolderTest = sinon.createStubInstance(Game);
            gameHolderTest.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
            gameHolderTest.turn = { activePlayer: '' } as Turn;
            gameHolderTest.skip.returns(true);
            player.game = gameHolderTest as unknown as Game;

            gamesHandlerStub['players'].set(serverSocket.id, player);
            gamesHandlerStub['gamePlayers'].set(player.room, [player]);

            gamesStateService['endGame'](serverSocket.id);
            expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.GameEnd));
            done();
        });

        it('endGame() should emit a event to the client when the game is already finished and we need to post endGame information', (done) => {
            const player = sinon.createStubInstance(RealPlayer);
            player.name = '';
            player.room = ROOM;
            const gameHolderTest = sinon.createStubInstance(Game);
            gameHolderTest.gameboard = { gameboardCoords: [] } as unknown as Gameboard;
            gameHolderTest.turn = { activePlayer: '' } as Turn;
            gameHolderTest.skip.returns(true);
            gameHolderTest.isGameFinish = true;
            player.game = gameHolderTest as unknown as Game;

            gamesHandlerStub['players'].set(serverSocket.id, player);
            gamesHandlerStub['gamePlayers'].set(player.room, [player]);

            gamesStateService['endGame'](serverSocket.id);
            expect(socketManagerStub.emitRoom.notCalled).to.be.equal(true);
            done();
        });
    });

    context('CreateGame(), gameSubscriptions, initializePlayers() and updateNewBot() Tests', () => {
        let createNewGameStub: sinon.SinonStub<unknown[], unknown>;
        let setAndGetPlayerStub: sinon.SinonStub<unknown[], unknown>;
        let botPlayer: sinon.SinonStubbedInstance<BeginnerBot>;
        let realPlayer: sinon.SinonStubbedInstance<RealPlayer>;
        let userConnectedStub: sinon.SinonStub<unknown[], unknown>;

        beforeEach(() => {
            gamesStateService = new GamesStateService(
                socketManagerStub as never,
                gamesHandlerStub as never,
                scoreStorageStub as never,
                virtualPlayersStorageStub as never,
            );

            createNewGameStub = sinon.stub(gamesStateService, 'createNewGame' as never);
            gameInfo.socketId = [serverSocket.id];
            createNewGameStub.returns(game);
            userConnectedStub = sinon.stub(gamesStateService, 'userConnected' as never);
            setAndGetPlayerStub = sinon.stub(gamesStateService, 'setAndGetPlayer' as never);
            botPlayer = sinon.createStubInstance(BeginnerBot);
            botPlayer.room = ROOM;
            botPlayer.game = game;
            botPlayer.name = 'VINCENT';
            realPlayer = sinon.createStubInstance(RealPlayer);
            realPlayer.room = ROOM;
            realPlayer.game = game;
            realPlayer.name = 'ROBERT';
            setAndGetPlayerStub.onCall(0).returns(realPlayer);
            setAndGetPlayerStub.onCall(1).returns(botPlayer);
        });

        afterEach(() => {
            sinon.restore();
            game.turn.countdown.unsubscribe();
            game.turn.endTurn.unsubscribe();
        });
        it('CreateGame() should call setAndGetPlayer()', (done) => {
            gameInfo.socketId[1] = '3249adf8243';

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(setAndGetPlayerStub.called).to.equal(true);
            done();
        });

        it('CreateGame() should call sendObjectivesToClient()', (done) => {
            const sendObjectivesToClientStub = sinon.stub(gamesStateService, 'sendObjectivesToClient' as never);
            gameInfo.socketId[1] = '3249adf8243';

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(sendObjectivesToClientStub.called).to.equal(true);
            done();
        });

        it('CreateGame() should call initializePlayers()', (done) => {
            const initializePlayersStub = sinon.stub(gamesStateService, 'initializePlayers' as never);
            gameInfo.socketId[1] = '3249adf8243';

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(initializePlayersStub.called).to.equal(true);
            done();
        });

        it('CreateGame() should call updatePlayerInfo when you are the player creating the game()', (done) => {
            gameInfo.socketId[1] = '3249adf8243';

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(gamesHandlerStub.updatePlayerInfo.called).to.equal(true);
            done();
        });

        it('initializePlayers() should call the setGame and the start function of the player when you are playing against a bot', (done) => {
            botPlayer.game.isMode2990 = true;
            gamesStateService['initializePlayers']([realPlayer, botPlayer], botPlayer.game, [serverSocket.id]);

            expect(realPlayer.setGame.called).to.equal(true);
            expect(botPlayer.setGame.called).to.equal(true);
            expect(botPlayer.start.called).to.equal(true);
            done();
        });

        it('updateNewBot() should call the setGame and the start function of the bot and update the Player info', (done) => {
            gamesStateService['updateNewBot'](serverSocket, botPlayer.game, botPlayer.room, botPlayer);
            expect(botPlayer.setGame.called).to.equal(true);
            expect(botPlayer.start.called).to.equal(true);
            expect(gamesHandlerStub.updatePlayerInfo.called).to.equal(true);
            done();
        });

        it('CreateGame() should call createNewGame()', () => {
            gameInfo.socketId[1] = '3249adf8243';

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(createNewGameStub.called).to.equal(true);
        });

        it('CreateGame() should call gameSubscriptions()', () => {
            const gameSubscriptionsStub = sinon.stub(gamesStateService, 'gameSubscriptions' as never);
            gameInfo.socketId[1] = '3249adf8243';

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(gameSubscriptionsStub.called).to.equal(true);
        });

        it('gameSubscriptions() should call endGameScore() and changeTurn() when the turn end ', () => {
            gameInfo.socketId[1] = '3249adf8243';
            const endGameScore = sinon.stub(gamesStateService, 'endGameScore' as never);
            const changeTurn = sinon.stub(gamesStateService, 'changeTurn' as never);

            gamesStateService['gameSubscriptions'](gameInfo, realPlayer.game);
            game.turn.endTurn.next(player1.name);
            expect(endGameScore.called).to.equal(true);
            expect(changeTurn.called).to.equal(true);
        });

        it('gameSubscriptions() should not call userConnected() if the turn.activePlayer is not undefined ', () => {
            gameInfo.socketId[1] = '3249adf8243';
            realPlayer.game.turn.activePlayer = 'KRATOS';
            sinon.stub(gamesStateService, 'endGameScore' as never);
            sinon.stub(gamesStateService, 'changeTurn' as never);

            gamesStateService['gameSubscriptions'](gameInfo, realPlayer.game);
            game.turn.endTurn.next(player1.name);
            expect(userConnectedStub.called).to.not.equal(true);
        });

        it('gameSubscriptions() should call sendTimer() when the countdown change value ', () => {
            player1.name = 'Vincent';
            gameInfo.socketId[1] = '3249adf8243';
            const sendTimer = sinon.stub(gamesStateService, 'sendTimer' as never);

            gamesStateService['gameSubscriptions'](gameInfo, realPlayer.game);
            game.turn.countdown.next(1);
            expect(sendTimer.called).to.equal(true);
        });

        it('CreateGame() should emit game information to the room', () => {
            gameInfo.socketId[1] = '3249adf8243';
            player1.room = ROOM;
            serverSocket.join(ROOM);

            gamesStateService['createGame'](serverSocket, gameInfo);
            expect(
                socketManagerStub.emitRoom.calledWithExactly(gameInfo.roomId, SocketEvents.LetterReserveUpdated, game.letterReserve.lettersReserve),
            ).to.be.equal(true);
        });
    });
});
