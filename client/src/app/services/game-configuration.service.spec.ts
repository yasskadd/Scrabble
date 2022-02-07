import { TestBed } from '@angular/core/testing';
import { SocketTestEmulator } from '@app/classes/test-classes/socket-test-emulator';
import { ReplaySubject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ClientSocketService } from './client-socket.service';
import { GameConfigurationService } from './game-configuration.service';

export class SocketClientServiceMock extends ClientSocketService {
    // Reason : connect shouldn't actually connect
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
        socketServiceMock.socket = socketEmulator as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [{ provide: ClientSocketService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(GameConfigurationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('beginScrabbleGame() send a message to the server with a room id to start the game of this room', () => {
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'startScrabbleGame';
        const ROOMID = '1';
        service.roomId = ROOMID;

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service.beginScrabbleGame();
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, ROOMID);
    });
    it('joinPage() send a command to the server to tell that a player wants to join a multiplayer game', () => {
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'roomLobby';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service.joinPage();
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE);
    });

    it('updateAvailableRooms() should update and add the games available for a player to join', () => {
        const TEST_ROOM = [{ id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' }];

        expect(service.availableRooms.length).toEqual(0);
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['updateAvailableRooms'](TEST_ROOM);
        expect(service.availableRooms.length).toEqual(1);
    });

    it('updateAvailableRooms() should  not add  games available for a player to join if there is not more room available', () => {
        expect(service.availableRooms.length).toEqual(0);
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['updateAvailableRooms']([]);
        expect(service.availableRooms.length).not.toEqual(1);
    });

    it('joinGame() should  send the id of the room the player wants to join and is username', () => {
        const ROOMID = '1';
        const USERNAME_PLAYER = 'Maurice';
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'roomJoin';
        service.joinGame(ROOMID, USERNAME_PLAYER);
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, { id: ROOMID, name: USERNAME_PLAYER });
        expect(service.playerName[0]).toEqual(USERNAME_PLAYER);
        expect(service.roomId).toEqual(ROOMID);
    });

    it('gameInitialization() should  send the parameters of the game a player wants to create', () => {
        const TEST_GAME_CONFIGURATION = { username: 'Pauline', dictionary: 'francais', timer: 1, mode: 'classique' };
        const TEST_STATUS_GAME = "En Attente d'un Adversaire ...";
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'createGame';
        service.gameInitialization(TEST_GAME_CONFIGURATION);
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, TEST_GAME_CONFIGURATION);
        expect(service.playerName[0]).toEqual(TEST_GAME_CONFIGURATION.username);
        expect(service.isCreator).toBeTruthy();
        expect(service.statusGame).toEqual(TEST_STATUS_GAME);
    });

    it('rejectOpponent() should  send a command to the server to reject the opponent that wanted to join the multiplayer game', () => {
        const TEST_STATUS_GAME = "En Attente d'un Adversaire ...";
        const ROOMID = '1';
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'rejectOpponent';
        service.roomId = ROOMID;
        service.rejectOpponent();
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, ROOMID);
        expect(service.statusGame).toEqual(TEST_STATUS_GAME);
    });

    it('removeRoom() should  send a command to the server to removeRoom from the the games when a player decide to return to the create page', () => {
        const ROOMID = '1';
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'removeRoom';
        service.roomId = ROOMID;
        service.removeRoom();
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, ROOMID);
        expect(service.roomId).toEqual('');
    });

    it('resetErrorSubject() should  initialize the value of the error Reason ', () => {
        const spy = spyOn(service.errorReason, 'next');
        const ROOM_NOT_AVAILABLE_ERROR = "La salle n'est plus disponible";
        service.errorReason.next(ROOM_NOT_AVAILABLE_ERROR);
        expect(spy).toHaveBeenCalledWith(ROOM_NOT_AVAILABLE_ERROR);
        service.resetErrorSubject();
        expect(service.errorReason).toEqual(new ReplaySubject<string>(1));
    });

    it('resetRoomJoinableSubject() should  initialize the value of the roomJoinable variable ', () => {
        const spy = spyOn(service.isRoomJoinable, 'next');
        const TEST_ROOMJOINABLE = true;
        service.isRoomJoinable.next(TEST_ROOMJOINABLE);
        expect(spy).toHaveBeenCalledWith(TEST_ROOMJOINABLE);
        service.resetRoomJoinableSubject();
        expect(service.isRoomJoinable).toEqual(new ReplaySubject<boolean>(1));
    });

    it('resetIsGameStartedSubject() should  initialize the value of the IsGameStarted variable ', () => {
        const spy = spyOn(service.isGameStarted, 'next');
        const TEST_IS_GAME_STARTED = true;
        service.isGameStarted.next(TEST_IS_GAME_STARTED);
        expect(spy).toHaveBeenCalledWith(TEST_IS_GAME_STARTED);
        service.resetIsGameStartedSubject();
        expect(service.isGameStarted).toEqual(new ReplaySubject<boolean>(1));
    });

    it('should handle joiningError event with a error reason to not being able to join the room', () => {
        const ROOM_NOT_AVAILABLE_ERROR = "La salle n'est plus disponible";
        const spy = spyOn(service.errorReason, 'next');
        const spyOnResetError = spyOn(service, 'resetErrorSubject');
        socketEmulator.peerSideEmit('joiningError', ROOM_NOT_AVAILABLE_ERROR);
        expect(spy).toHaveBeenCalledWith(ROOM_NOT_AVAILABLE_ERROR);
        expect(spyOnResetError).toHaveBeenCalled();
    });

    it('should handle updateListOfRooms event with a list of the games available to join for the player in the join game page', () => {
        const spy = spyOn(service, 'updateAvailableRooms' as never);
        const TEST_ROOM = [
            { id: '1', users: ['Vincent', 'Marcel'], dictionary: 'francais', timer: 1, mode: 'classique' },
            { id: '2', users: ['Poulin', 'George'], dictionary: 'francais', timer: 1, mode: 'classique' },
        ];

        socketEmulator.peerSideEmit('updateListOfRooms', TEST_ROOM);
        expect(spy).toHaveBeenCalledWith(TEST_ROOM as never);
    });

    it('should handle gameCreatedConfirmation event with the ID of the game he just created', () => {
        const ROOMID = '3';
        socketEmulator.peerSideEmit('gameCreatedConfirmation', ROOMID);
        expect(service.roomId).toEqual(ROOMID);
    });

    it('should handle foundOpponent event with the username of the opponent that wants to join his game', () => {
        const OPPONENT_NAME = 'Marcel';
        const STATUS_GAME = 'Adversaire Trouvé';
        socketEmulator.peerSideEmit('foundOpponent', OPPONENT_NAME);
        expect(service.playerName[1]).toEqual(OPPONENT_NAME);
        expect(service.statusGame).toEqual(STATUS_GAME);
    });

    it('should handle foundOpponent event with the username of the opponent that wants to join his game', () => {
        const OPPONENT_NAME = 'Marcel';
        const STATUS_GAME = 'Adversaire Trouvé';

        socketEmulator.peerSideEmit('foundOpponent', OPPONENT_NAME);
        expect(service.playerName[1]).toEqual(OPPONENT_NAME);
        expect(service.statusGame).toEqual(STATUS_GAME);
    });

    it('should handle gameAboutToStart event to inform the player of the room that the game is about to start ', () => {
        const ISGAMESTARTED = true;
        const spy = spyOn(service.isGameStarted, 'next');
        const spyONResetISGAMESTARTED = spyOn(service, 'resetIsGameStartedSubject');
        socketEmulator.peerSideEmit('gameAboutToStart');
        expect(spy).toHaveBeenCalledWith(ISGAMESTARTED);
        expect(spyONResetISGAMESTARTED).toHaveBeenCalled();
    });

    it('should handle rejectByOtherPlayer event with a reason why he was rejected from the other player ', () => {
        const PLAYERS_REJECT_FROM_ROOM_ERROR = "L'adversaire à rejeter votre demande";
        const spy = spyOn(service.errorReason, 'next');
        const SPYON_RESET_ERROR_SUBJECT = spyOn(service, 'resetErrorSubject');
        socketEmulator.peerSideEmit('rejectByOtherPlayer', PLAYERS_REJECT_FROM_ROOM_ERROR);
        expect(spy).toHaveBeenCalledWith(PLAYERS_REJECT_FROM_ROOM_ERROR);
        expect(SPYON_RESET_ERROR_SUBJECT).toHaveBeenCalled();
        expect(service.roomId).toEqual('');
        expect(service.statusGame).toEqual('');
    });

    it('should handle joinValid event with the name of the other player in the game you want to join ', () => {
        const PLAYERS_NAME = 'Marc';
        const STATUS_GAME = "En Attente de la confirmation de L'adversaire";
        const IS_CREATOR = false;
        const IS_ROOM_JOINABLE = true;
        const spy = spyOn(service.isRoomJoinable, 'next');
        const SPYON_RESET_ROOM_JOINABLE_SUBJECT = spyOn(service, 'resetRoomJoinableSubject');
        socketEmulator.peerSideEmit('joinValid', PLAYERS_NAME);
        expect(spy).toHaveBeenCalledWith(IS_ROOM_JOINABLE);
        expect(SPYON_RESET_ROOM_JOINABLE_SUBJECT).toHaveBeenCalled();
        expect(service.isCreator).toEqual(IS_CREATOR);
        expect(service.playerName[1]).toEqual(PLAYERS_NAME);
        expect(service.statusGame).toEqual(STATUS_GAME);
    });
});
