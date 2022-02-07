import { TestBed } from '@angular/core/testing';
import { SocketTestEmulator } from '@app/classes/test-classes/socket-test-emulator';
import { Socket } from 'socket.io-client';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { ClientSocketService } from './client-socket.service';
import { GameConfigurationService } from './game-configuration.service';

const ROOM_ID = '1';
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
    beforeEach(() => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['removeRoom', 'rejectOpponent', 'beginScrabbleGame'], {
            roomId: ROOM_ID,
        });
        socketEmulator = new SocketTestEmulator();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock.socket = socketEmulator as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [
                { provide: ClientSocketService, useValue: socketServiceMock },
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
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

    it('validCommand() should add command to the displayed messages and return true on a valid command', () => {
        const VALID_COMMAND = '!aide';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](VALID_COMMAND)).toBeTruthy();

        const EXPECTED_COMMAND_MESSAGE = { type: 'current-user', data: `Toi : ${VALID_COMMAND}` };
        expect(service.messages.pop()).toEqual(EXPECTED_COMMAND_MESSAGE);
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false on an invalid syntax', () => {
        const INVALID_SYNTAX = '!abcdefg';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](INVALID_SYNTAX)).toBeFalsy();

        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: '[Erreur] Erreur de synthese' };
        expect(service.messages.pop()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false on an invalid command parameters', () => {
        const INVALID_COMMAND_PARAMS = '!placer Laruche enStage';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        expect(service['validCommand'](INVALID_COMMAND_PARAMS)).toBeFalsy();

        const EXPECTED_MESSAGE_FORMATED = { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };
        expect(service.messages.pop()).toEqual(EXPECTED_MESSAGE_FORMATED);
    });

    it('configureSyntaxError() should return the valid ErrorMessage', () => {
        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: '[Erreur] Erreur de synthese' };

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
        const EXPECTED_USER_DISCONNECTED_MESSAGE = { type: 'system-message', data: "L'autre joueur s'est déconnecté" };

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['addDisconnect']();
        expect(service.messages.pop()).toEqual(EXPECTED_USER_DISCONNECTED_MESSAGE);
    });

    it('submitMessage() should call sendCommand() if the command is valid ', () => {
        const spyOnSendCommand = spyOn<ChatboxHandlerService>(service, 'sendCommand' as never);
        const VALID_COMMAND = '!passer';

        service.submitMessage(VALID_COMMAND);
        expect(spyOnSendCommand).toHaveBeenCalled();
    });

    it('submitMessage() should call sendMessage() if the command is valid ', () => {
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'sendMessage' as never);
        const MESSAGE = 'Bonjour monsieur Robert';

        service.submitMessage(MESSAGE);
        expect(spyOnSendMessage).toHaveBeenCalled();
    });

    it("submitMessage() shouldn't send anything", () => {
        const spyOnSendCommand = spyOn<ChatboxHandlerService>(service, 'sendCommand' as never);
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'sendMessage' as never);

        const INVALID_COMMAND = '!|!|PokemonMasterXX20|!|';

        service.submitMessage(INVALID_COMMAND);
        expect(spyOnSendCommand).not.toHaveBeenCalled();
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

    it('sendCommand() send a command to the server with a message event', () => {
        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        const spy = spyOn(service['clientSocket'], 'send');
        const EVENT_COMMAND = 'command';
        const TEST_COMMAND = '!echanger avd';

        // Reason : testing a private method
        // eslint-disable-next-line dot-notation
        service['sendCommand'](TEST_COMMAND);
        expect(spy).toHaveBeenCalledWith(EVENT_COMMAND, TEST_COMMAND);
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

    // TODO : Finish last method ??? (No idea if there's one more after configureImpossibleCommandError)

    // TODO : come back to test and code

    // it('configureImpossibleCommandError() should return the valid error configuration', () => {
    //     const EXPECTED_IMPOSSIBLE_ERROR = { type: 'system-message', data: '[Erreur] Commande impossible à réaliser' };

    //     // Reason : testing a private method
    //     // eslint-disable-next-line dot-notation
    //     expect(service['configureImpossibleCommandError']()).toEqual(EXPECTED_IMPOSSIBLE_ERROR);
    // });
});
