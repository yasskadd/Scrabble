/* eslint-disable max-lines */
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketTestEmulator } from '@app/classes/test-classes/socket-test-emulator';
import { SocketEvents } from '@common/constants/socket-events';
import { Letter } from '@common/interfaces/letter';
import { Socket } from 'socket.io-client';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { ClientSocketService } from './client-socket.service';
import { CommandHandlerService } from './command-handler.service';
import { GameClientService } from './game-client.service';
import { GameConfigurationService } from './game-configuration.service';

type Player = { name: string; score: number; rack?: Letter[]; room: string };
interface RoomInformation {
    playerName: string[];
    roomId: string;
    isCreator: boolean;
    statusGame: string;
}
const ROOM_INFORMATION: RoomInformation = {
    playerName: ['Vincent', 'RICHARD'],
    roomId: '1',
    isCreator: true,
    statusGame: 'En attente du joueur',
};

const PLAYER1_INFORMATION: Player = {
    name: 'Vincent',
    score: 70,
    rack: [
        { value: 'c', quantity: 2, points: 1 },
        { value: 'r', quantity: 2, points: 1 },
        { value: 'p', quantity: 2, points: 1 },
    ],
    room: '1',
};
const SECOND_PLAYER_INFORMATION: Player = {
    name: 'Vincent',
    score: 70,
    rack: [
        { value: 'w', quantity: 2, points: 1 },
        { value: 'k', quantity: 2, points: 1 },
        { value: 't', quantity: 2, points: 1 },
    ],
    room: '1',
};
export class SocketClientServiceMock extends ClientSocketService {
    // Reason : connect shouldn't actually connect
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    override connect() {}
}
// { provide: ClientSocketService, useValue: SocketClientServiceMock }
describe('ChatboxHandlerService', () => {
    let service: ChatboxHandlerService;
    let socketServiceMock: SocketClientServiceMock;
    let socketEmulator: SocketTestEmulator;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    let gameClientServiceSpy: jasmine.SpyObj<GameClientService>;
    let commandHandlerSpy: jasmine.SpyObj<CommandHandlerService>;
    beforeEach(() => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['removeRoom', 'rejectOpponent', 'beginScrabbleGame'], {
            roomInformation: ROOM_INFORMATION,
        });
        gameClientServiceSpy = jasmine.createSpyObj('GameClientService', [], {
            playerOne: PLAYER1_INFORMATION,
            secondPlayer: SECOND_PLAYER_INFORMATION,
        });
        commandHandlerSpy = jasmine.createSpyObj('CommandHandlerService', ['sendCommand']);
        socketEmulator = new SocketTestEmulator();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketEmulator as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [
                { provide: ClientSocketService, useValue: socketServiceMock },
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
                { provide: GameClientService, useValue: gameClientServiceSpy },
                { provide: CommandHandlerService, useValue: commandHandlerSpy },
            ],
        });
        // socketServiceMock = new SocketClientServiceMock();
        service = TestBed.inject(ChatboxHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'aide' command", () => {
        const VALID_SYNTAX = '!aide';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validSyntax'](VALID_SYNTAX)).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'placer' command", () => {
        const VALID_SYNTAX = '!placer';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validSyntax'](VALID_SYNTAX)).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'échanger' command", () => {
        const VALID_SYNTAX_1 = '!échanger';
        const VALID_SYNTAX_2 = '!echanger';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validSyntax'](VALID_SYNTAX_1)).toBeTruthy();

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validSyntax'](VALID_SYNTAX_2)).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'passer' command", () => {
        const VALID_SYNTAX = '!passer ';
        // eslint-disable-next-line dot-notation
        expect(service['validSyntax'](VALID_SYNTAX)).toBeTruthy();
    });

    it("validCommandParameters() shouldn't validate invalid command syntax", () => {
        const INVALID_SYNTAX = '!/d!azLaRuche! ';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](INVALID_SYNTAX)).toBeFalsy();
    });

    it("validCommandParameters() should validate the command parameters of the 'aide' command", () => {
        const VALID_COMMAND_PARAMS = '!aide';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS)).toBeTruthy();
    });

    it("validCommandParameters() should validate the command parameters of the 'passer' command", () => {
        const VALID_COMMAND_PARAMS = '!passer';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS)).toBeTruthy();
    });

    it("validCommandParameters() should validate the command parameters of the 'placer' command", () => {
        const VALID_COMMAND = '!placer a5v acd';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](VALID_COMMAND)).toBeTruthy();
    });

    it("validCommandParameters() should validate the command parameters of the 'échanger' command", () => {
        const VALID_COMMAND_PARAMS_1 = '!échanger avd';
        const VALID_COMMAND_PARAMS_2 = '!echanger avd';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS_1)).toBeTruthy();
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS_2)).toBeTruthy();
    });

    it("validCommandParameters() shouldn't validate invalid command parameters", () => {
        const INVALID_COMMAND_PARAMS_1 = '!echanger 93248';
        const INVALID_COMMAND_PARAMS_2 = '!placer 251d Monsieur420Robert';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](INVALID_COMMAND_PARAMS_1)).toBeFalsy();
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommandParameters'](INVALID_COMMAND_PARAMS_2)).toBeFalsy();
    });

    it('isCommand() should recognize a command structure', () => {
        const IS_COMMAND = '!aide';
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['isCommand'](IS_COMMAND)).toBeTruthy();
    });

    it("isCommand() should recognize when it's not a command", () => {
        const NOT_A_COMMAND = 'aide moi Robert';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['isCommand'](NOT_A_COMMAND)).toBeFalsy();
    });

    it('validCommand() should return true on a valid command', () => {
        const VALID_COMMAND = '!aide';
        gameClientServiceSpy.playerOneTurn = true;
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](VALID_COMMAND)).toBeTruthy();
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false on an invalid syntax', () => {
        const INVALID_SYNTAX = '!abcdefg';
        gameClientServiceSpy.playerOneTurn = true;
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](INVALID_SYNTAX)).toBeFalsy();

        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: '[Erreur] Erreur de syntaxe' };
        expect(service.messages.pop()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false when it is not the player turn', () => {
        const commandTest = '!passer';
        gameClientServiceSpy.playerOneTurn = false;
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](commandTest)).toBeFalsy();

        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: "Ce n'est pas votre tour" };
        expect(service.messages.pop()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false on an invalid command parameters', () => {
        const INVALID_COMMAND_PARAMS = '!placer Laruche enStage';
        gameClientServiceSpy.playerOneTurn = true;
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](INVALID_COMMAND_PARAMS)).toBeFalsy();

        const EXPECTED_MESSAGE_FORMATED = { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };
        expect(service.messages.pop()).toEqual(EXPECTED_MESSAGE_FORMATED);
    });

    it('configureSyntaxError() should return the valid ErrorMessage', () => {
        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: '[Erreur] Erreur de syntaxe' };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['configureSyntaxError']()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('configureInvalidError() should return the valid ErrorMessage', () => {
        const EXPECTED_INVALID_ERROR = { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['configureInvalidError']()).toEqual(EXPECTED_INVALID_ERROR);
    });

    it('configureUserMessage() should return the valid message configuration', () => {
        const userInput = 'Bonjour adversaire';
        const EXPECTED_USER_MESSAGE = { type: 'current-user', data: `Toi : ${userInput}` };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['configureUserMessage'](userInput)).toEqual(EXPECTED_USER_MESSAGE);
    });

    it('addMessage() should add message to the messages Array', () => {
        const EXPECTED_USER_MESSAGE = { type: 'current-user', data: 'Bonjour Monsieur' };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['addMessage'](EXPECTED_USER_MESSAGE);
        expect(service.messages.pop()).toEqual(EXPECTED_USER_MESSAGE);
    });

    it('addDisconnect() should add a system-message to the messages Array saying that the other player disconnected from the room', () => {
        const EXPECTED_USER_DISCONNECTED_MESSAGE = { type: 'system-message', data: 'RICHARD a quitté le jeu' };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['addDisconnect']();
        expect(service.messages.pop()).toEqual(EXPECTED_USER_DISCONNECTED_MESSAGE);
    });

    it('submitMessage() should call sendCommand() if the command is valid ', () => {
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND = '!passer';

        service.submitMessage(VALID_COMMAND);
        expect(commandHandlerSpy.sendCommand).toHaveBeenCalled();
    });

    it('submitMessage() should call sendMessage() if the command is valid ', () => {
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'sendMessage' as never);
        const MESSAGE = 'Bonjour monsieur Robert';

        service.submitMessage(MESSAGE);
        expect(spyOnSendMessage).toHaveBeenCalled();
    });

    it("submitMessage() shouldn't send anything", () => {
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'sendMessage' as never);

        const INVALID_COMMAND = '!|!|PokemonMasterXX20|!|';

        service.submitMessage(INVALID_COMMAND);
        expect(commandHandlerSpy.sendCommand).not.toHaveBeenCalled();
        expect(spyOnSendMessage).not.toHaveBeenCalled();
    });

    it('sendMessage() send a message to the server with a message event', () => {
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'message';
        const TEST_MESSAGE = 'Bonjour mon ami';
        const TEST_MESSAGE_OBJECT = { roomId: '1', message: 'Bonjour mon ami' };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['sendMessage'](TEST_MESSAGE);
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, TEST_MESSAGE_OBJECT);
    });

    it('resetMessage should reset the array of message', () => {
        service.messages = [{ type: 'system-message', data: 'Fin de la partie : lettres restantes' }];
        expect(service.messages.length).toEqual(1);
        service.resetMessage();
        expect(service.messages.length).toEqual(0);
    });

    it('configureBaseSocketFeatures() should add the listeners to the socket', () => {
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spy = spyOn(service['clientSocket'], 'on');

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['configureBaseSocketFeatures']();
        expect(spy).toHaveBeenCalled();
    });

    it('getAllLetter should return a list off all the letters with the string char of them', () => {
        const rackLetter = 'crp';
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['getAllLetter'](gameClientServiceSpy.playerOne.rack as never)).toEqual(rackLetter);
    });

    it('configureReserveLetterCommand should push message with the amount of letter left', () => {
        const letterReserve = [
            { value: 'c', quantity: 2, points: 1 },
            { value: 'r', quantity: 2, points: 1 },
            { value: 'p', quantity: 2, points: 1 },
        ];
        const message1 = { type: 'system-message', data: `${letterReserve[0].value}: ${letterReserve[0].quantity}` };
        const message2 = { type: 'system-message', data: `${letterReserve[1].value}: ${letterReserve[1].quantity}` };
        const message3 = { type: 'system-message', data: `${letterReserve[2].value}: ${letterReserve[2].quantity}` };
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['configureReserveLetterCommand'](letterReserve as never);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('configureClueCommand should push  3 message with the possible word placements given by the command Indice if 3 option are push', () => {
        const CHAR_ASCII = 96;
        const wordPlacements = [
            { firstCoordinate: { x: 1, y: 2 }, direction: true, lettersPlaced: ['a', 'l', 'r'] },
            { firstCoordinate: { x: 3, y: 2 }, direction: false, lettersPlaced: ['b', 'i', 'l', 'l', 'e'] },
            { firstCoordinate: { x: 8, y: 8 }, direction: false, lettersPlaced: ['c', 'a', 'n', 'n', 'e'] },
        ];
        const message1 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[0].firstCoordinate.y)}${wordPlacements[0].firstCoordinate.x}${
                wordPlacements[0].direction
            } ${wordPlacements[0].lettersPlaced.join('')}`,
        };
        const message2 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[1].firstCoordinate.y)}${wordPlacements[1].firstCoordinate.x}${
                wordPlacements[1].direction
            } ${wordPlacements[1].lettersPlaced.join('')}`,
        };
        const message3 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[2].firstCoordinate.y)}${wordPlacements[2].firstCoordinate.x}${
                wordPlacements[2].direction
            } ${wordPlacements[2].lettersPlaced.join('')}`,
        };
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['configureClueCommand'](wordPlacements as never);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('configureClueCommand should push 2 message with the possible word placements given by the command Indice if 2 option are push', () => {
        const CHAR_ASCII = 96;
        const wordPlacements = [
            { firstCoordinate: { x: 1, y: 2 }, direction: true, lettersPlaced: ['a', 'l', 'r'] },
            { firstCoordinate: { x: 3, y: 2 }, direction: false, lettersPlaced: ['b', 'i', 'l', 'l', 'e'] },
        ];
        const message1 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[0].firstCoordinate.y)}${wordPlacements[0].firstCoordinate.x}${
                wordPlacements[0].direction
            } ${wordPlacements[0].lettersPlaced.join('')}`,
        };
        const message2 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[1].firstCoordinate.y)}${wordPlacements[1].firstCoordinate.x}${
                wordPlacements[1].direction
            } ${wordPlacements[1].lettersPlaced.join('')}`,
        };
        const message3 = { type: 'system-message', data: 'Aucune autre possibilité possible' };
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['configureClueCommand'](wordPlacements as never);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('configureClueCommand should explain to the player that no word placement are possible with the letters on his rack', () => {
        const message1 = { type: 'system-message', data: "Il n'y a pas de possibilité de formation de mot possible" };
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['configureClueCommand']([] as never);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('should emit 3 messages to show in the chatBox when the game is finish', fakeAsync(() => {
        const message1 = { type: 'system-message', data: 'Fin de la partie : lettres restantes' };
        const message2 = { type: 'system-message', data: `${gameClientServiceSpy.playerOne.name} : crp` };
        const message3 = { type: 'system-message', data: `${gameClientServiceSpy.secondPlayer.name} : wkt` };

        service.endGameMessage();
        tick();
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    }));

    it('should add a message emit from the server when gameMessage event is emit', () => {
        const messageReceive = '!passer';
        const messageShow = { type: 'opponent-user', data: `${gameConfigurationServiceSpy.roomInformation.playerName[1]} : ${messageReceive}` };
        socketEmulator.peerSideEmit(SocketEvents.GameMessage, messageReceive);
        expect(service.messages.pop()).toEqual(messageShow);
    });

    it('should called the configureImpossibleCommandError if the server emit the Event', () => {
        const messageError = 'impossible de placer la lettre';
        const spy = spyOn(service, 'configureImpossibleCommandError' as never);
        socketEmulator.peerSideEmit(SocketEvents.ImpossibleCommandError, messageError);
        expect(spy).toHaveBeenCalledWith(messageError as never);
    });

    it('should called the addDisconnect  method if the server emit the Event', () => {
        const spy = spyOn(service, 'addDisconnect' as never);
        socketEmulator.peerSideEmit('user disconnect');
        expect(spy).toHaveBeenCalled();
    });

    it('should called the endGame Message method if the server emit the Event', () => {
        const spy = spyOn(service, 'endGameMessage' as never);
        socketEmulator.peerSideEmit('endGame');
        expect(spy).toHaveBeenCalled();
    });

    it('should called the configureClueCommand method if the server emit the Event', () => {
        const spy = spyOn(service, 'configureClueCommand' as never);
        socketEmulator.peerSideEmit(SocketEvents.ClueCommand);
        expect(spy).toHaveBeenCalled();
    });

    it('should called configureReserveLetterCommand  method if the server emit the Event', () => {
        const spy = spyOn(service, 'configureReserveLetterCommand' as never);
        socketEmulator.peerSideEmit(SocketEvents.AllReserveLetters);
        expect(spy).toHaveBeenCalled();
    });

    it('configureImpossibleCommandError() should return the valid error configuration', () => {
        const errorMessage = 'invalid placement';
        const EXPECTED_IMPOSSIBLE_ERROR = { type: 'system-message', data: `[Erreur] ${errorMessage}` };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['configureImpossibleCommandError'](errorMessage)).toEqual(EXPECTED_IMPOSSIBLE_ERROR);
    });

    it('SubmitMessage should send nothing if the user input is empty', () => {
        const spy2 = spyOn(service, 'addMessage' as never);
        service.submitMessage('');
        expect(commandHandlerSpy.sendCommand).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });
});
