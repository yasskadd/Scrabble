/* eslint-disable max-lines */
/* eslint-disable dot-notation -- testing private methods or attributes */
import { TestBed } from '@angular/core/testing';
import { SocketTestEmulator } from '@app/classes/test-classes/socket-test-emulator';
import { RoomInformation } from '@app/interfaces/room-information';
import { SocketEvents } from '@common/constants/socket-events';
import { ReplaySubject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ClientSocketService } from './communication/client-socket.service';
import { GameConfigurationService } from './game-configuration.service';

interface GameScrabbleInformation {
    playerName: string[];
    roomId: string;
    timer: number;
    socketId: string[];
    mode: string;
    botDifficulty?: string;
    dictionary: string;
}
const ROOM_INFORMATION: RoomInformation = {
    playerName: [],
    roomId: '',
    isCreator: true,
    statusGame: '',
    timer: 0,
    mode: 'classique',
    botDifficulty: undefined,
    dictionary: 'Mon dictionnaire',
};
export class SocketClientServiceMock extends ClientSocketService {
    // Reason : need mock class for tests
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}

describe('GameConfigurationService', () => {
    let service: GameConfigurationService;
    let socketEmulator: SocketTestEmulator;
    let socketServiceMock: SocketClientServiceMock;

    beforeEach(() => {
        socketEmulator = new SocketTestEmulator();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock['socket'] = socketEmulator as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(GameConfigurationService);
        service.roomInformation = ROOM_INFORMATION;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('beginScrabbleGame() send a message to the server with a room id to start the game of this room', () => {
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const roomID = '1';
        service.roomInformation.roomId = roomID;
        service.beginScrabbleGame();
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.StartScrabbleGame, roomID);
    });

    it('joinPage() send a command to the server to tell that a player wants to join a multiplayer game', () => {
        const spyOnSocket = spyOn(service['clientSocket'], 'send');

        service.joinPage(ROOM_INFORMATION.mode);
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.RoomLobby);
    });

    it('updateAvailableRooms() should update and add the games available for a player to join', () => {
        const roomTest = [{ id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' }];
        service.roomInformation.mode = 'classique';
        expect(service.availableRooms.length).toEqual(0);
        service['updateAvailableRooms'](roomTest);
        expect(service.availableRooms.length).toEqual(1);
    });

    it('updateAvailableRooms() should  not add  games available for a player to join if there is not more room available', () => {
        expect(service.availableRooms.length).toEqual(0);
        service['updateAvailableRooms']([]);
        expect(service.availableRooms.length).not.toEqual(1);
    });

    it('joinGame() should  send the id of the room the player wants to join and is username', () => {
        const roomID = '1';
        const usernamePlayer = 'Maurice';
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        service.joinGame(roomID, usernamePlayer);
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.PlayerJoinGameAvailable, { id: roomID, name: usernamePlayer });
        expect(service.roomInformation.playerName[0]).toEqual(usernamePlayer);
        expect(service.roomInformation.roomId).toEqual(roomID);
    });

    it('gameInitialization() should  send the parameters of the game a player wants to create', () => {
        const testGameConfiguration = {
            username: 'Pauline',
            dictionary: 'Mon dictionnaire',
            timer: 1,
            mode: 'classique',
            isMultiplayer: true,
        };
        const testStatusGame = "En Attente d'un Adversaire ...";
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        service.gameInitialization(testGameConfiguration);
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.CreateGame, testGameConfiguration);
        expect(service.roomInformation.playerName[0]).toEqual(testGameConfiguration.username);
        expect(service.roomInformation.isCreator).toBeTruthy();
        expect(service.roomInformation.statusGame).toEqual(testStatusGame);
    });

    it('rejectOpponent() should  send a command to the server to reject the opponent that wanted to join the multiplayer game', () => {
        const testStatusGame = "En Attente d'un Adversaire ...";
        const roomID = '1';
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        service.roomInformation.roomId = roomID;
        service.rejectOpponent();
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.RejectOpponent, roomID);
        expect(service.roomInformation.statusGame).toEqual(testStatusGame);
    });

    it('exitWaitingRoom should send to the server that the player joining wants to exit', () => {
        const playerName = 'Maurice';
        const roomID = '1';
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        service.roomInformation.roomId = roomID;
        service.roomInformation.playerName[0] = playerName;
        service.exitWaitingRoom();
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.ExitWaitingRoom, { id: roomID, name: playerName });
    });

    it('removeRoom() should  send a command to the server to removeRoom from the the games when a player decide to return to the create page', () => {
        const roomID = '1';
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        service.roomInformation.roomId = roomID;
        service.removeRoom();
        expect(spyOnSocket).toHaveBeenCalledWith(SocketEvents.RemoveRoom, roomID);
        expect(service.roomInformation.roomId).toEqual('');
    });

    it('removeRoom() should call rejectOpponent when player is rejected ', () => {
        const spyOnRejectOpponent = spyOn(service, 'rejectOpponent');
        service.roomInformation.playerName[1] = 'Marcel';
        service.removeRoom();
        expect(spyOnRejectOpponent).toHaveBeenCalled();
    });

    it('removeRoom() should not call rejectOpponent when there is not an other player in the waiting room ', () => {
        service.roomInformation.playerName[1] = '';
        const spyOnRejectOpponent = spyOn(service, 'rejectOpponent');
        service.removeRoom();
        expect(spyOnRejectOpponent).not.toHaveBeenCalled();
    });

    it('setErrorSubject() should  initialize the value of the error Reason ', () => {
        const spy = spyOn(service.errorReason, 'next');
        const roomNotAvailableError = "La salle n'est plus disponible";
        service.errorReason.next(roomNotAvailableError);
        expect(spy).toHaveBeenCalledWith(roomNotAvailableError);
        service.setErrorSubject(roomNotAvailableError);
        expect(service.errorReason).toEqual(new ReplaySubject<string>(1));
    });

    it('gameInitialization() should assign a name to the opponent when the method is called with the name of the bot ', () => {
        const testGameConfiguration = {
            username: 'Pauline',
            dictionary: 'Mon dictionnaire',
            timer: 1,
            mode: 'classique',
            isMultiplayer: true,
            opponent: 'robert',
        };
        service.gameInitialization(testGameConfiguration);
        expect(service.roomInformation.playerName[1]).toEqual('robert');
    });

    it('beginScrabbleGame() should  not assign a name to the opponent when the method is not called with the name of the bot ', () => {
        const roomInformationUpdated: RoomInformation = {
            playerName: ['Vincent'],
            roomId: '1',
            isCreator: true,
            statusGame: "En Attente d'un Adversaire ...",
            timer: 60,
            mode: 'classique',
            botDifficulty: undefined,
            dictionary: 'Mon dictionnaire',
        };
        service.roomInformation = roomInformationUpdated;

        service.beginScrabbleGame();
        expect(service.roomInformation.playerName[1]).not.toEqual('robert');
    });

    it('setRoomJoinableSubject() should  initialize the value of the roomJoinable variable ', () => {
        const spy = spyOn(service.isRoomJoinable, 'next');
        const roomJoinable = true;
        service.isRoomJoinable.next(roomJoinable);
        expect(spy).toHaveBeenCalledWith(roomJoinable);
        service.setRoomJoinableSubject();
        expect(service.isRoomJoinable).toEqual(new ReplaySubject<boolean>(1));
    });

    it('setIsGameStartedSubject() should  initialize the value of the IsGameStarted variable ', () => {
        const spy = spyOn(service.isGameStarted, 'next');
        const isGameStarted = true;
        service.isGameStarted.next(isGameStarted);
        expect(spy).toHaveBeenCalledWith(isGameStarted);
        service.setIsGameStartedSubject();
        expect(service.isGameStarted).toEqual(new ReplaySubject<boolean>(1));
    });

    it('should handle joiningError event with a error reason to not being able to join the room', () => {
        const roomNotAvailableError = "La salle n'est plus disponible";
        const spyOnSetResetError = spyOn(service, 'setErrorSubject');
        socketEmulator.peerSideEmit(SocketEvents.ErrorJoining, roomNotAvailableError);
        expect(spyOnSetResetError).toHaveBeenCalled();
    });

    it('should handle updateListOfRooms event with a list of the games available to join for the player in the join game page', () => {
        const spy = spyOn(service, 'updateAvailableRooms' as never);
        const testRoom = [
            { id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' },
            { id: '2', users: ['Poulin', 'George'], dictionary: 'francais', timer: 1, mode: 'classique' },
        ];

        socketEmulator.peerSideEmit(SocketEvents.UpdateRoomJoinable, testRoom);
        expect(spy).toHaveBeenCalledWith(testRoom as never);
    });

    it('should handle gameCreatedConfirmation event with the ID of the game he just created', () => {
        const roomId = '3';
        socketEmulator.peerSideEmit(SocketEvents.GameCreatedConfirmation, roomId);
        expect(service.roomInformation.roomId).toEqual(roomId);
    });

    it('should handle foundOpponent event with the username of the opponent that wants to join his game', () => {
        const opponentName = 'Marcel';
        const spyONFoundAnOpponentEvent = spyOn(service, 'foundAnOpponentEvent' as never);
        socketEmulator.peerSideEmit(SocketEvents.FoundAnOpponent, opponentName);
        expect(spyONFoundAnOpponentEvent).toHaveBeenCalled();
    });

    it('foundOpponentEvent should set certain attribute', () => {
        const opponentName = 'Marcel';
        const statusGame = 'Adversaire Trouvé';
        service['foundAnOpponentEvent'](opponentName);
        expect(service.roomInformation.playerName[1]).toEqual(opponentName);
        expect(service.roomInformation.statusGame).toEqual(statusGame);
    });

    it('should handle gameAboutToStart event to inform the player of the room that the game is about to start ', () => {
        const spyONGameAboutToStartEvent = spyOn(service, 'gameAboutToStartEvent' as never);
        socketEmulator.peerSideEmit(SocketEvents.GameAboutToStart);
        expect(spyONGameAboutToStartEvent).toHaveBeenCalled();
    });

    it('gameAboutToStartEvent should call setIsGameStartedSubject', () => {
        const socketIDUserRoom = ['346574gdvb', 'dsfhg56ter'];
        const spyONResetIsGameStarted = spyOn(service, 'setIsGameStartedSubject');
        service['gameAboutToStartEvent'](socketIDUserRoom);
        expect(spyONResetIsGameStarted).toHaveBeenCalled();
    });

    it('should handle rejectByOtherPlayer event with a reason why he was rejected from the other player ', () => {
        const playerRejectFromRoomError = "L'adversaire à rejeter votre demande";
        const spyOnRejectByOtherPlayerEvent = spyOn(service, 'rejectByOtherPlayerEvent' as never);
        socketEmulator.peerSideEmit(SocketEvents.RejectByOtherPlayer, playerRejectFromRoomError);
        expect(spyOnRejectByOtherPlayerEvent).toHaveBeenCalled();
    });

    it('rejectByOtherPlayerEvent should set certain attribute and call setErrorSubject', () => {
        const playerRejectFromRoomError = "L'adversaire à rejeter votre demande";
        const spyOnResetErrorSubject = spyOn(service, 'setErrorSubject');
        service['rejectByOtherPlayerEvent'](playerRejectFromRoomError);
        expect(spyOnResetErrorSubject).toHaveBeenCalled();
        expect(service.roomInformation.roomId).toEqual('');
        expect(service.roomInformation.statusGame).toEqual('');
    });

    it('should handle joinValid event with the name of the other player in the game you want to join ', () => {
        const playerName = 'Marc';
        const spyOnjoinValidGameEvent = spyOn(service, 'joinValidGameEvent' as never);
        socketEmulator.peerSideEmit(SocketEvents.JoinValidGame, playerName);
        expect(spyOnjoinValidGameEvent).toHaveBeenCalled();
    });

    it('joinValidGameEvent should set certain attribute and call setRoomJoinableSubject', () => {
        const playerName = 'Marc';
        const statusGame = "En Attente de la confirmation de L'adversaire";
        const isCreator = false;
        const spyOnResetRoomJoinableSubject = spyOn(service, 'setRoomJoinableSubject');
        service['joinValidGameEvent'](playerName);
        expect(spyOnResetRoomJoinableSubject).toHaveBeenCalled();
        expect(service.roomInformation.isCreator).toEqual(isCreator);
        expect(service.roomInformation.playerName[1]).toEqual(playerName);
        expect(service.roomInformation.statusGame).toEqual(statusGame);
    });

    it('should handle OpponentLeave event to remove the player name of the second player ', () => {
        const playerNames = ['Marc', 'Maurice'];
        const spyOnOpponentLeaveEvent = spyOn(service, 'opponentLeaveEvent' as never);
        service.roomInformation.playerName = playerNames;
        socketEmulator.peerSideEmit(SocketEvents.OpponentLeave);
        expect(spyOnOpponentLeaveEvent).toHaveBeenCalled();
    });

    it('opponentLeaveEvent should set certain attribute', () => {
        const playerNames = ['Marc', 'Maurice'];
        const searchingOpponent = "En Attente d'un Adversaire ...";
        service.roomInformation.playerName = playerNames;
        expect(service.roomInformation.playerName.length).toEqual(2);
        service['opponentLeaveEvent']();
        expect(service.roomInformation.playerName.length).toEqual(1);
        expect(service.roomInformation.statusGame).toEqual(searchingOpponent);
    });

    it('gameCreatedConfirmationEvent should emit an event to the server when we create solo game', () => {
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const playerNames = ['Marc', 'Maurice'];
        service.roomInformation.playerName = playerNames;

        service['gameCreatedConfirmationEvent']('12fhsiv');
        expect(spyOnSocket).toHaveBeenCalled();
    });

    it('gameCreatedConfirmationEvent should not emit an event to the server when we create a multiplayer game', () => {
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const playerNames = ['Marc'];
        service.roomInformation.playerName = playerNames;

        service['gameCreatedConfirmationEvent']('12fhsiv');
        expect(spyOnSocket).not.toHaveBeenCalled();
    });

    it('should handle createScrabbleGame event if you are the creator of the game ', () => {
        const socketIDUserRoom = ['346574gdvb', 'dsfhg56ter'];
        const gameScrabbleInformation: GameScrabbleInformation = {
            playerName: ROOM_INFORMATION.playerName,
            roomId: ROOM_INFORMATION.roomId,
            timer: ROOM_INFORMATION.timer,
            socketId: socketIDUserRoom,
            mode: 'classique',
            botDifficulty: undefined,
            dictionary: ROOM_INFORMATION.dictionary,
        };
        service.roomInformation.playerName = ROOM_INFORMATION.playerName;
        service.roomInformation.roomId = ROOM_INFORMATION.roomId;
        service.roomInformation.timer = ROOM_INFORMATION.timer;
        service.roomInformation.mode = 'classique';
        service.roomInformation.botDifficulty = undefined;
        service.roomInformation.isCreator = true;
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        socketEmulator.peerSideEmit(SocketEvents.GameAboutToStart, socketIDUserRoom);

        expect(spyOnSocket).toHaveBeenCalledWith('createScrabbleGame', gameScrabbleInformation);
    });

    it('should  not handle createScrabbleGame event if you are not the creator of the game ', () => {
        const socketIDUserRoom = ['346574gdvb', 'dsfhg56ter'];
        service.roomInformation.playerName = ROOM_INFORMATION.playerName;
        service.roomInformation.roomId = ROOM_INFORMATION.roomId;
        service.roomInformation.timer = ROOM_INFORMATION.timer;
        service.roomInformation.isCreator = false;
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        socketEmulator.peerSideEmit(SocketEvents.GameAboutToStart, socketIDUserRoom);

        expect(spyOnSocket).not.toHaveBeenCalled();
    });

    it('should reset the room Information', () => {
        const roomInformationUpdated: RoomInformation = {
            playerName: ['Vincent', 'Marcel'],
            roomId: '1',
            isCreator: true,
            statusGame: 'Adversaire Trouvé',
            timer: 60,
            mode: 'classique',
            botDifficulty: undefined,
            dictionary: 'Mon dictionnaire',
        };
        service.roomInformation = roomInformationUpdated;
        expect(service.roomInformation.playerName).toEqual(['Vincent', 'Marcel']);
        expect(service.roomInformation.roomId).toEqual('1');
        expect(service.roomInformation.statusGame).toEqual('Adversaire Trouvé');
        expect(service.roomInformation.isCreator).toEqual(true);
        service['resetRoomInformation']();
        expect(service.roomInformation.playerName).toEqual([]);
        expect(service.roomInformation.roomId).toEqual('');
        expect(service.roomInformation.statusGame).toEqual('');
        expect(service.roomInformation.isCreator).toEqual(false);
    });

    it('joinRandomRoom should send a event to the server with the room Id that he will randomly join', () => {
        const playerName = 'Pierre';
        const spy = spyOn(service['clientSocket'], 'send');
        const testRoom = [
            { id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' },
            { id: '2', users: ['Poulin', 'George'], dictionary: 'francais', timer: 1, mode: 'classique' },
        ];
        service.availableRooms = testRoom;
        service.joinRandomRoom(playerName);
        const information = { id: service.roomInformation.roomId, name: playerName };
        expect(spy).toHaveBeenCalledWith(SocketEvents.PlayerJoinGameAvailable, information);
    });
});
