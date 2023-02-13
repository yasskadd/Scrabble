/* eslint-disable @typescript-eslint/no-empty-function*/
/* eslint-disable dot-notation*/
import { DictionaryValidation } from '@app/classes/dictionary-validation.class';
import { Game } from '@app/classes/game.class';
import { Gameboard } from '@app/classes/gameboard.class';
import { LetterPlacement } from '@app/classes/letter-placement.class';
import { LetterReserve } from '@app/classes/letter-reserve.class';
import { Player } from '@app/classes/player/player.class';
import { RealPlayer } from '@app/classes/player/real-player.class';
import { Turn } from '@app/classes/turn.class';
import { WordSolver } from '@app/classes/word-solver.class';
import { DictionaryStorageService } from '@app/services/database/dictionary-storage.service';
import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { SocketManager } from '@app/services/socket/socket-manager.service';
import { SocketEvents } from '@common/constants/socket-events';
import { Letter } from '@common/interfaces/letter';
import { expect } from 'chai';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { ReplaySubject } from 'rxjs';
import * as sinon from 'sinon';
import { Server as ioServer, Socket as ServerSocket } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';

const ROOM = '0';

describe('GamesHandler Service', () => {
    let gamesHandler: GamesHandler;
    let socketManagerStub: sinon.SinonStubbedInstance<SocketManager>;
    let dictionaryStorageStub: sinon.SinonStubbedInstance<DictionaryStorageService>;

    let httpServer: Server;
    let clientSocket: Socket;
    let serverSocket: ServerSocket;
    let port: number;
    let sio: ioServer;

    let game: sinon.SinonStubbedInstance<Game> & Game;

    beforeEach((done) => {
        socketManagerStub = sinon.createStubInstance(SocketManager);
        socketManagerStub.emitRoom.callsFake(() => {});
        dictionaryStorageStub = sinon.createStubInstance(DictionaryStorageService);

        game = sinon.createStubInstance(Game) as sinon.SinonStubbedInstance<Game> & Game;
        game.turn = { countdown: new ReplaySubject(), endTurn: new ReplaySubject() } as Turn;
        game.letterReserve = new LetterReserve();
        game.letterReserve.lettersReserve = [{ value: 'c', quantity: 2, points: 1 }];
        game.gameboard = sinon.createStubInstance(Gameboard);

        gamesHandler = new GamesHandler(socketManagerStub as unknown as SocketManager, dictionaryStorageStub as unknown as DictionaryStorageService);

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

    context('Two Clientsocket tests', () => {
        let secondSocket: Socket;
        let playerOne: sinon.SinonStubbedInstance<RealPlayer>;
        let playerTwo: sinon.SinonStubbedInstance<RealPlayer>;

        const RESERVE = [] as Letter[];
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

        it('updatePlayerInfo() should broadcast correct info to the first Player', (done) => {
            clientSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(playerOne.getInformation());
                done();
            });
            clientSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(playerTwo.getInformation());
            });

            gamesHandler['gamePlayers'].set(playerOne.room, [playerOne, playerTwo]);

            gamesHandler['players'].set(serverSocket.id, playerOne);

            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });

        it('updatePlayerInfo() should broadcast correct info to the second Player', (done) => {
            secondSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(playerTwo.getInformation());
                done();
            });
            secondSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(playerOne.getInformation());
            });
            playerOne.isPlayerOne = false;
            gamesHandler['gamePlayers'].set(playerOne.room, [playerOne, playerTwo]);

            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });

        it('updatePlayerInfo() should broadcast correct info to the first Player when we play with a bot', (done) => {
            secondSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(playerOne.getInformation());
                done();
            });
            secondSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(playerTwo.getInformation());
            });
            playerOne.isPlayerOne = true;
            gamesHandler['gamePlayers'].set(playerOne.room, [playerOne, playerTwo]);

            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });

        it("updatePlayerInfo() should broadcast correct info if it isn't the first player", (done) => {
            secondSocket.on(SocketEvents.UpdateOpponentInformation, (information) => {
                expect(information).to.be.eql(playerOne.getInformation());
                done();
            });
            secondSocket.on(SocketEvents.UpdatePlayerInformation, (information) => {
                expect(information).to.be.eql(playerTwo.getInformation());
            });

            playerOne.isPlayerOne = false;
            playerTwo.isPlayerOne = true;

            gamesHandler['gamePlayers'].set(playerOne.room, [playerOne, playerTwo]);

            gamesHandler['players'].set(serverSocket.id, playerOne);

            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
        });

        it('updatePlayerInfo() should emit the letterReserve to the room', () => {
            gamesHandler['players'].set(serverSocket.id, playerOne);

            gamesHandler['updatePlayerInfo'](serverSocket, ROOM, game);
            expect(socketManagerStub.emitRoom.calledWith(ROOM, SocketEvents.LetterReserveUpdated, RESERVE));
        });

        it("updatePlayerInfo() shouldn't do anything if the players are undefined", () => {
            gamesHandler['players'].set(serverSocket.id, playerOne);

            gamesHandler['gamePlayers'].set(playerOne.room, undefined as unknown as Player[]);

            gamesHandler['updatePlayerInfo'](serverSocket, playerOne.room, playerOne.game);
            expect(socketManagerStub.emitRoom.called).to.not.be.equal(true);
        });

        it("updatePlayerInfo() shouldn't do anything if the players are undefined", () => {
            gamesHandler['players'].set(serverSocket.id, playerOne);

            gamesHandler['gamePlayers'].set(playerOne.room, undefined as unknown as Player[]);

            gamesHandler['updatePlayerInfo'](serverSocket, playerOne.room, playerOne.game);
            expect(socketManagerStub.emitRoom.called).to.not.be.equal(true);
        });
    });

    it('setDictionaries() should call getDictionaries', async () => {
        const getDictionaryStub = sinon.stub(gamesHandler, 'getDictionaries');
        const dictionary = { title: 'dictionary', description: 'description', words: ['string'] };
        getDictionaryStub.resolves([dictionary]);
        await gamesHandler.setDictionaries();
        expect(getDictionaryStub.called).to.equal(true);
    });

    it('setDictionaries() should set dictionaries attribute', async () => {
        const getDictionaryStub = sinon.stub(gamesHandler, 'getDictionaries');
        const dictionary = { title: 'dictionary', description: 'description', words: ['string'] };
        getDictionaryStub.resolves([dictionary]);
        await gamesHandler.setDictionaries();
        expect(gamesHandler['dictionaries'].size).to.be.greaterThan(0);
    });

    it('addDictionary() should do nothing if the dictionary to be added is already in the database', async () => {
        const dictionaryIsInDbStub = sinon.stub(gamesHandler, 'dictionaryIsInDb');
        const dictionary = { title: 'dictionary', description: 'description', words: ['string'] };
        dictionaryIsInDbStub.resolves({} as unknown as void);
        await gamesHandler.addDictionary(dictionary);
        expect(gamesHandler['dictionaries'].size).to.equal(0);
        expect(dictionaryStorageStub.addDictionary.called).to.equal(false);
    });

    // Reason : test name is very descriptive
    // eslint-disable-next-line max-len
    it('addDictionary() should call addDictionary of DictionaryStorage and set dictionaries attribute if the dictionary to be added is not in the database', async () => {
        const dictionaryIsInDbStub = sinon.stub(gamesHandler, 'dictionaryIsInDb');
        const dictionary = { title: 'dictionary1', description: 'description', words: ['string'] };
        dictionaryIsInDbStub.throws();
        await gamesHandler.addDictionary(dictionary);
        expect(gamesHandler['dictionaries'].size).to.be.greaterThan(0);
        expect(dictionaryStorageStub.addDictionary.called).to.equal(true);
    });

    it('updateDictionary() should call updateDictionary of DictionaryStorage', async () => {
        await gamesHandler.updateDictionary({
            title: 'dictionary',
            newTitle: 'dictionaryModified',
            newDescription: 'description',
        });
        expect(dictionaryStorageStub.updateDictionary.called).to.equal(true);
    });

    it('updateDictionary() should set dictionaries with new key', async () => {
        const dictionary = { title: 'dictionary1', description: 'description', words: ['string'] };
        const dictionaryValidation = sinon.createStubInstance(DictionaryValidation) as sinon.SinonStubbedInstance<DictionaryValidation> &
            DictionaryValidation;
        const wordSolver = sinon.createStubInstance(WordSolver) as sinon.SinonStubbedInstance<WordSolver> & WordSolver;
        const letterPlacement = sinon.createStubInstance(LetterPlacement) as sinon.SinonStubbedInstance<LetterPlacement> & LetterPlacement;
        const behavior = {
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
            wordSolver: wordSolver as WordSolver,
            letterPlacement: letterPlacement as LetterPlacement,
        };
        gamesHandler['dictionaries'].set(dictionary.title, behavior);
        await gamesHandler.updateDictionary({
            title: 'dictionary',
            newTitle: 'dictionaryModified',
            newDescription: 'description',
        });
        expect(gamesHandler['dictionaries'].has('dictionary')).to.equal(false);
    });

    it('resetDictionaries() should call getDictionariesFileName of DictionaryStorage', async () => {
        const deleteDictionaryStub = sinon.stub(gamesHandler, 'deleteDictionary');
        dictionaryStorageStub.getDictionariesFileName.resolves(['Dictionary', 'Dictionary2']);
        await gamesHandler.resetDictionaries();
        expect(dictionaryStorageStub.getDictionariesFileName.called).to.equal(true);
        expect(deleteDictionaryStub.called).to.equal(true);
    });

    it('deleteDictionary() should call deleteDictionary of DictionaryStorage', async () => {
        await gamesHandler.deleteDictionary('dictionary1');
        expect(dictionaryStorageStub.deletedDictionary.called).to.equal(true);
    });

    it('deleteDictionary() should delete key value of dictionaries', async () => {
        const dictionary = { title: 'dictionary1', description: 'description', words: ['string'] };
        const dictionaryValidation = sinon.createStubInstance(DictionaryValidation) as sinon.SinonStubbedInstance<DictionaryValidation> &
            DictionaryValidation;
        const wordSolver = sinon.createStubInstance(WordSolver) as sinon.SinonStubbedInstance<WordSolver> & WordSolver;
        const letterPlacement = sinon.createStubInstance(LetterPlacement) as sinon.SinonStubbedInstance<LetterPlacement> & LetterPlacement;
        const behavior = {
            dictionaryValidation: dictionaryValidation as DictionaryValidation,
            wordSolver: wordSolver as WordSolver,
            letterPlacement: letterPlacement as LetterPlacement,
        };
        gamesHandler['dictionaries'].set(dictionary.title, behavior);
        await gamesHandler.deleteDictionary('dictionary1');
        expect(gamesHandler['dictionaries'].size).to.equal(0);
    });

    it('dictionaryIsInDb() should call dictionaryIsInDb of DictionaryStorage', async () => {
        await gamesHandler.dictionaryIsInDb('dictionary');
        expect(dictionaryStorageStub.dictionaryIsInDb.called).to.equal(true);
    });

    it('dictionaryIsInDb() should call dictionaryIsInDb of DictionaryStorage with dictionary if we check the default dictionnary', async () => {
        await gamesHandler.dictionaryIsInDb('Mon dictionnaire');
        expect(dictionaryStorageStub.dictionaryIsInDb.calledOnceWithExactly('dictionary')).to.equal(true);
    });

    it('getDictionaries() should call getDictionaries of DictionaryStorage', async () => {
        await gamesHandler.getDictionaries();
        expect(dictionaryStorageStub.getDictionaries.called).to.equal(true);
    });

    it('getDictionary() should call getDictionary of DictionaryStorage', async () => {
        // REASON : We need a buffer
        // eslint-disable-next-line deprecation/deprecation
        const testBuffer = new Buffer('{ "hello": "World" }');
        dictionaryStorageStub.getDictionary.resolves(testBuffer);
        await gamesHandler.getDictionary('dictionary');
        expect(dictionaryStorageStub.getDictionary.called).to.equal(true);
    });

    it('getDictionary() should call getDictionary of DictionaryStorage with dictionary if we want to default dictionnary', async () => {
        // REASON : We need a buffer
        // eslint-disable-next-line deprecation/deprecation
        const testBuffer = new Buffer('{ "hello": "World" }');
        dictionaryStorageStub.getDictionary.resolves(testBuffer);
        await gamesHandler.getDictionary('Mon dictionnaire');
        expect(dictionaryStorageStub.getDictionary.calledOnceWithExactly('dictionary')).to.equal(true);
    });
});
