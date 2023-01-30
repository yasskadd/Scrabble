/* eslint-disable max-lines */
/* eslint-disable dot-notation -- testing private methods or attributes */
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SocketTestEmulator } from '@app/classes/test-classes/socket-test-emulator';
import { SocketEvents } from '@common/constants/socket-events';
import { Letter } from '@common/interfaces/letter';
import { ReplaySubject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ChatboxHandlerService } from './chatbox-handler.service';
import { CommandHandlerService } from './command-handler.service';
import { ClientSocketService } from './communication/client-socket.service';
import { GameClientService } from './game-client.service';
import { GameConfigurationService } from './game-configuration.service';

type Player = { name: string; score: number; rack?: Letter[]; room: string };
interface RoomInformation {
    playerName: string[];
    roomId: string;
    isCreator: boolean;
    statusGame: string;
}
const TIMEOUT = 15;
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
    name: 'Richard',
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
describe('ChatboxHandlerService', () => {
    let service: ChatboxHandlerService;
    let socketServiceMock: SocketClientServiceMock;
    let socketEmulator: SocketTestEmulator;
    let gameConfigurationServiceSpy: jasmine.SpyObj<GameConfigurationService>;
    let gameClientServiceSpy: jasmine.SpyObj<GameClientService>;
    let commandHandlerSpy: jasmine.SpyObj<CommandHandlerService>;
    const TEST_TURNFINISH = new ReplaySubject<boolean>(1);
    beforeEach(() => {
        gameConfigurationServiceSpy = jasmine.createSpyObj('GameConfigurationService', ['removeRoom', 'rejectOpponent', 'beginScrabbleGame'], {
            roomInformation: ROOM_INFORMATION,
        });
        gameClientServiceSpy = jasmine.createSpyObj('GameClientService', [], {
            playerOne: PLAYER1_INFORMATION,
            secondPlayer: SECOND_PLAYER_INFORMATION,
            turnFinish: TEST_TURNFINISH,
        });
        commandHandlerSpy = jasmine.createSpyObj('CommandHandlerService', ['sendCommand']);
        socketEmulator = new SocketTestEmulator();
        socketServiceMock = new SocketClientServiceMock();
        socketServiceMock['socket'] = socketEmulator as unknown as Socket;

        TestBed.configureTestingModule({
            providers: [
                { provide: ClientSocketService, useValue: socketServiceMock },
                { provide: GameConfigurationService, useValue: gameConfigurationServiceSpy },
                { provide: GameClientService, useValue: gameClientServiceSpy },
                { provide: CommandHandlerService, useValue: commandHandlerSpy },
            ],
        });
        service = TestBed.inject(ChatboxHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'aide' command", () => {
        const VALID_SYNTAX = '!aide';

        expect(service['validSyntax'](VALID_SYNTAX)).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'placer' command", () => {
        const VALID_SYNTAX = '!placer';

        expect(service['validSyntax'](VALID_SYNTAX)).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'échanger' command", () => {
        const VALID_SYNTAX_1 = '!échanger';
        const VALID_SYNTAX_2 = '!echanger';

        expect(service['validSyntax'](VALID_SYNTAX_1)).toBeTruthy();

        expect(service['validSyntax'](VALID_SYNTAX_2)).toBeTruthy();
    });

    it("validSyntax() should validate the syntax of the 'passer' command", () => {
        const VALID_SYNTAX = '!passer';
        expect(service['validSyntax'](VALID_SYNTAX)).toBeTruthy();
    });

    it("validCommandParameters() shouldn't validate invalid command syntax", () => {
        const INVALID_SYNTAX = '!/d!azLaRuche! ';

        expect(service['validCommandParameters'](INVALID_SYNTAX)).toBeFalsy();
    });

    it("validCommandParameters() should validate the command parameters of the 'aide' command", () => {
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND_PARAMS = '!aide';

        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS)).toBeTruthy();
    });

    it('validCommand() should return false if the client wants to exchange and there is less than 7 letter in the reserve', () => {
        gameClientServiceSpy.letterReserveLength = 6;
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND_PARAMS = '!echanger abv';

        expect(service['validCommand'](VALID_COMMAND_PARAMS)).toBeFalsy();
    });

    it('validCommand() should return true if the client wants to exchange and there is more  than 7 letter in the reserve', () => {
        gameClientServiceSpy.letterReserveLength = 7;
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND_PARAMS = '!echanger abv';

        expect(service['validCommand'](VALID_COMMAND_PARAMS)).toBeTruthy();
    });

    it("validCommandParameters() should validate the command parameters of the 'passer' command", () => {
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND_PARAMS = '!passer';

        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS)).toBeTruthy();
    });

    it("validCommandParameters() should validate the command parameters of the 'placer' command", () => {
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND = '!placer a5v acd';

        expect(service['validCommandParameters'](VALID_COMMAND)).toBeTruthy();
    });

    it("validCommandParameters() should validate the command parameters of the 'échanger' command", () => {
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND_PARAMS_1 = '!échanger avd';
        const VALID_COMMAND_PARAMS_2 = '!echanger avd';

        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS_1)).toBeTruthy();

        expect(service['validCommandParameters'](VALID_COMMAND_PARAMS_2)).toBeTruthy();
    });

    it("validCommandParameters() shouldn't validate invalid command parameters", () => {
        const INVALID_COMMAND_PARAMS_1 = '!echanger 93248';
        const INVALID_COMMAND_PARAMS_2 = '!placer 251d Monsieur420Robert';

        expect(service['validCommandParameters'](INVALID_COMMAND_PARAMS_1)).toBeFalsy();

        expect(service['validCommandParameters'](INVALID_COMMAND_PARAMS_2)).toBeFalsy();
    });

    it('should call addMessage and sendMessage when turnFinish has the value true', () => {
        const spy = spyOn(service, 'addMessage' as never);
        const spy2 = spyOn(service, 'sendMessage' as never);
        gameClientServiceSpy.turnFinish.next(true);
        expect(spy).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it('exchangePossible() should return false if the client wants to exchange and there is less than 7 letter in the reserve', () => {
        gameClientServiceSpy.letterReserveLength = 6;
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND_PARAMS = '!echanger abv';

        expect(service['exchangePossible'](VALID_COMMAND_PARAMS)).toBeFalsy();
    });

    it('should not call addMessage and sendMessage when turnFinish has the value false', () => {
        const spy = spyOn(service, 'addMessage' as never);
        const spy2 = spyOn(service, 'sendMessage' as never);
        gameClientServiceSpy.turnFinish.next(false);
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });

    it('validParameters() should return false when the parameters of the command are not valid', () => {
        const IS_COMMAND = '!echanger 56g';

        expect(service['validParameters'](IS_COMMAND)).toBeFalsy();
    });

    it('validParameters() should return true when the parameters of the command are valid', () => {
        const IS_COMMAND = '!echanger gagner';

        expect(service['validParameters'](IS_COMMAND)).toBeTruthy();
    });

    it('validSyntax() should return false when the syntax of the command is not valid', () => {
        const IS_COMMAND = '!echanreer gbr';

        expect(service['validSyntax'](IS_COMMAND)).toBeFalsy();
    });

    it('validParameters() should return true when the syntax of the command is valid', () => {
        const IS_COMMAND = '!echanger gbr';

        expect(service['validSyntax'](IS_COMMAND)).toBeTruthy();
    });

    it('isCommand() should recognize a command structure', () => {
        const IS_COMMAND = '!aide';

        expect(service['isCommand'](IS_COMMAND)).toBeTruthy();
    });

    it("isCommand() should recognize when it's not a command", () => {
        const NOT_A_COMMAND = 'aide moi Robert';

        expect(service['isCommand'](NOT_A_COMMAND)).toBeFalsy();
    });

    it('validCommand() should return true on a valid command', () => {
        const VALID_COMMAND = '!aide';
        gameClientServiceSpy.playerOneTurn = true;

        expect(service['validCommand'](VALID_COMMAND)).toBeTruthy();
    });

    it('validCommand() should call validCommandSyntax when it is the turn of the player', () => {
        const spyOnvalidCommandSyntax = spyOn<ChatboxHandlerService>(service, 'validCommandSyntax' as never);
        const VALID_COMMAND = '!passer';
        gameClientServiceSpy.playerOneTurn = true;

        service['validCommand'](VALID_COMMAND);
        expect(spyOnvalidCommandSyntax).toHaveBeenCalled();
    });

    it('validCommandSyntax() should call validParameters when the command has the good syntax', () => {
        const spyOnvalidCommandSyntax = spyOn<ChatboxHandlerService>(service, 'validCommandParameters' as never);
        const VALID_COMMAND = '!passer';
        gameClientServiceSpy.playerOneTurn = true;

        service['validCommandSyntax'](VALID_COMMAND);
        expect(spyOnvalidCommandSyntax).toHaveBeenCalled();
    });

    it('validCommandSyntax() should not call validParameters when the command has not the good syntax', () => {
        const spyOnvalidCommandSyntax = spyOn<ChatboxHandlerService>(service, 'validCommandParameters' as never);
        const VALID_COMMAND = '!pastser';
        gameClientServiceSpy.playerOneTurn = true;

        service['validCommandSyntax'](VALID_COMMAND);
        expect(spyOnvalidCommandSyntax).not.toHaveBeenCalled();
    });

    it('validParameters() should call isCommandExchangePossible when the command has the good parameters', () => {
        const spyOnvalidCommandSyntax = spyOn<ChatboxHandlerService>(service, 'isCommandExchangePossible' as never);
        const VALID_COMMAND = '!echanger ate';
        gameClientServiceSpy.playerOneTurn = true;

        service['validCommandParameters'](VALID_COMMAND);
        expect(spyOnvalidCommandSyntax).toHaveBeenCalled();
    });

    it('validCommandParameters() should not call isCommandExchangePossible when the command has not the good parameters', () => {
        const spyOnvalidCommandSyntax = spyOn<ChatboxHandlerService>(service, 'isCommandExchangePossible' as never);
        const VALID_COMMAND = '!echanger 3dt';
        gameClientServiceSpy.playerOneTurn = true;

        service['validCommandParameters'](VALID_COMMAND);
        expect(spyOnvalidCommandSyntax).not.toHaveBeenCalled();
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false on an invalid syntax', () => {
        const INVALID_SYNTAX = '!abcdefg';
        gameClientServiceSpy.playerOneTurn = true;

        expect(service['validCommand'](INVALID_SYNTAX)).toBeFalsy();

        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: '[Erreur] Erreur de syntaxe' };
        expect(service.messages.pop()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false when it is not the player turn', () => {
        const commandTest = '!passer';
        gameClientServiceSpy.playerOneTurn = false;

        expect(service['validCommand'](commandTest)).toBeFalsy();

        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: "Ce n'est pas votre tour" };
        expect(service.messages.pop()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('validCommand() should add the corresponding error to the displayed messages and return false on an invalid command parameters', () => {
        const INVALID_COMMAND_PARAMS = '!placer Laruche enStage';
        gameClientServiceSpy.playerOneTurn = true;

        expect(service['validCommand'](INVALID_COMMAND_PARAMS)).toBeFalsy();

        const EXPECTED_MESSAGE_FORMATED = { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };
        expect(service.messages.pop()).toEqual(EXPECTED_MESSAGE_FORMATED);
    });

    it('configureSyntaxError() should return the valid ErrorMessage', () => {
        const EXPECTED_SYNTAX_ERROR = { type: 'system-message', data: '[Erreur] Erreur de syntaxe' };

        expect(service['configureSyntaxError']()).toEqual(EXPECTED_SYNTAX_ERROR);
    });

    it('configureInvalidError() should return the valid ErrorMessage', () => {
        const EXPECTED_INVALID_ERROR = { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };

        expect(service['configureInvalidError']()).toEqual(EXPECTED_INVALID_ERROR);
    });

    it('configureUserMessage() should return the valid message configuration', () => {
        const userInput = 'Bonjour adversaire';
        const EXPECTED_USER_MESSAGE = { type: 'current-user', data: `Toi : ${userInput}` };

        expect(service['configureUserMessage'](userInput)).toEqual(EXPECTED_USER_MESSAGE);
    });

    it('addMessage() should add message to the messages Array', () => {
        const EXPECTED_USER_MESSAGE = { type: 'current-user', data: 'Bonjour Monsieur' };

        service['addMessage'](EXPECTED_USER_MESSAGE);
        expect(service.messages.pop()).toEqual(EXPECTED_USER_MESSAGE);
    });

    it('addDisconnect() should add a system-message to the messages Array saying that the other player disconnected from the room', () => {
        const EXPECTED_USER_DISCONNECTED_MESSAGE = { type: 'system-message', data: 'Richard a quitté le jeu' };
        gameClientServiceSpy.isGameFinish = true;

        service['addDisconnect']();
        expect(service.messages.pop()).toEqual(EXPECTED_USER_DISCONNECTED_MESSAGE);
    });

    it('addDisconnect() should add a message when the player is replace by a beginner bot player', () => {
        const EXPECTED_USER_DISCONNECTED_MESSAGE = { type: 'system-message', data: 'Richard a quitté le jeu' };
        const EXPECTED_REPLACE_USER = {
            type: 'system-message',
            data: "------L'adversaire à été remplacé par un joueur virtuel Débutant------",
        };
        gameClientServiceSpy.isGameFinish = false;

        service['addDisconnect']();
        expect(service.messages.pop()).toEqual(EXPECTED_REPLACE_USER);
        expect(service.messages.pop()).toEqual(EXPECTED_USER_DISCONNECTED_MESSAGE);
    });

    it('submitMessage() should call isMessageACommand() if the input is valid ', () => {
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'isMessageACommand' as never);
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND = '!passer';

        service.submitMessage(VALID_COMMAND);
        expect(spyOnSendMessage).toHaveBeenCalled();
    });

    it('submitMessage() should not call isMessageACommand() if the input is empty ', () => {
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'isMessageACommand' as never);
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND = '';

        service.submitMessage(VALID_COMMAND);
        expect(spyOnSendMessage).not.toHaveBeenCalled();
    });

    it('isMessageACommand() should call sendCommand() if the command is valid ', () => {
        gameClientServiceSpy.playerOneTurn = true;
        const VALID_COMMAND = '!passer';

        service['isMessageACommand'](VALID_COMMAND);
        expect(commandHandlerSpy.sendCommand).toHaveBeenCalled();
    });

    it('isMessageACommand() should call sendMessage() if the command is valid ', () => {
        const spyOnSendMessage = spyOn<ChatboxHandlerService>(service, 'sendMessage' as never);
        const MESSAGE = 'Bonjour monsieur Robert';

        service['isMessageACommand'](MESSAGE);
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
        const spyOnSocket = spyOn(service['clientSocket'], 'send');
        const EVENT_MESSAGE = 'message';
        const TEST_MESSAGE = 'Bonjour mon ami';
        const TEST_MESSAGE_OBJECT = { roomId: '1', message: 'Bonjour mon ami' };

        service['sendMessage'](TEST_MESSAGE);
        expect(spyOnSocket).toHaveBeenCalledWith(EVENT_MESSAGE, TEST_MESSAGE_OBJECT);
    });

    it('resetMessage should keep only the welcome message', () => {
        service.messages = [{ type: 'system-message', data: 'Fin de la partie : lettres restantes' }];
        expect(service.messages.length).toEqual(1);
        service.resetMessage();
        expect(service.messages.length).toEqual(2);
    });

    it('configureBaseSocketFeatures() should add the listeners to the socket', () => {
        const spy = spyOn(service['clientSocket'], 'on');

        service['configureBaseSocketFeatures']();
        expect(spy).toHaveBeenCalled();
    });

    it('getAllLetter should return a list off all the letters with the string char of them', () => {
        const rackLetter = 'crp';

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

        service['configureReserveLetterCommand'](letterReserve as never);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('addClueCommand should push  3 message with the possible word placements given by the command Indice if 3 option are push', () => {
        const CHAR_ASCII = 96;
        const wordPlacements = [
            { firstCoordinate: { x: 1, y: 2 }, isHorizontal: true, letters: ['a', 'l', 'r'] },
            { firstCoordinate: { x: 3, y: 2 }, isHorizontal: false, letters: ['b', 'i', 'l', 'l', 'e'] },
            { firstCoordinate: { x: 8, y: 8 }, isHorizontal: false, letters: ['c', 'a', 'n', 'n', 'e'] },
        ];
        const message1 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[0].firstCoordinate.y)}${wordPlacements[0].firstCoordinate.x}${
                wordPlacements[0].isHorizontal ? 'h' : 'v'
            } ${wordPlacements[0].letters.join('')}`,
        };
        const message2 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[1].firstCoordinate.y)}${wordPlacements[1].firstCoordinate.x}${
                wordPlacements[1].isHorizontal ? 'h' : 'v'
            } ${wordPlacements[1].letters.join('')}`,
        };
        const message3 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[2].firstCoordinate.y)}${wordPlacements[2].firstCoordinate.x}${
                wordPlacements[2].isHorizontal ? 'h' : 'v'
            } ${wordPlacements[2].letters.join('')}`,
        };

        service['addClueCommand'](wordPlacements as never);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('addClueCommand should push 2 message with the possible word placements given by the command Indice if 2 option are push', () => {
        const CHAR_ASCII = 96;
        const wordPlacements = [
            { firstCoordinate: { x: 1, y: 2 }, isHorizontal: true, letters: ['a', 'l', 'r'] },
            { firstCoordinate: { x: 3, y: 2 }, isHorizontal: false, letters: ['b', 'i', 'l', 'l', 'e'] },
        ];
        const message1 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[0].firstCoordinate.y)}${wordPlacements[0].firstCoordinate.x}${
                wordPlacements[0].isHorizontal ? 'h' : 'v'
            } ${wordPlacements[0].letters.join('')}`,
        };
        const message2 = {
            type: 'system-message',
            data: `!placer ${String.fromCharCode(CHAR_ASCII + wordPlacements[1].firstCoordinate.y)}${wordPlacements[1].firstCoordinate.x}${
                wordPlacements[1].isHorizontal ? 'h' : 'v'
            } ${wordPlacements[1].letters.join('')}`,
        };
        const message3 = { type: 'system-message', data: 'Aucune autre possibilité possible' };

        service['addClueCommand'](wordPlacements as never);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    });

    it('configureClueCommand should explain to the player that no word placement are possible with the letters on his rack', () => {
        const spy = spyOn(service, 'addClueCommand' as never);
        const message1 = { type: 'system-message', data: "Il n'y a pas de possibilité de formation de mot possible" };

        service['configureClueCommand']([] as never);
        expect(service.messages.pop()).toEqual(message1);
        expect(spy).not.toHaveBeenCalled();
    });

    it('configureClueCommand should call addClueCommand when the clueCommand array has a length of more than 0', () => {
        const spy = spyOn(service, 'addClueCommand' as never);
        const wordPlacements = [
            { firstCoordinate: { x: 1, y: 2 }, isHorizontal: true, letters: ['a', 'l', 'r'] },
            { firstCoordinate: { x: 3, y: 2 }, isHorizontal: false, letters: ['b', 'i', 'l', 'l', 'e'] },
        ];

        service['configureClueCommand'](wordPlacements as never);
        expect(spy).toHaveBeenCalledOnceWith(wordPlacements as never);
    });

    it('should emit 3 messages to show in the chatBox when the game is finish', fakeAsync(() => {
        const message1 = { type: 'system-message', data: 'Fin de la partie : lettres restantes' };
        const message2 = { type: 'system-message', data: `${gameClientServiceSpy.playerOne.name} : crp` };
        const message3 = { type: 'system-message', data: `${gameClientServiceSpy.secondPlayer.name} : wkt` };

        service.endGameMessage();
        tick(TIMEOUT);
        expect(service.messages.pop()).toEqual(message3);
        expect(service.messages.pop()).toEqual(message2);
        expect(service.messages.pop()).toEqual(message1);
    }));

    it('should add a message emit from the server when gameMessage event is emit', () => {
        const messageReceive = '!passer';
        const messageShow = { type: 'opponent-user', data: `${gameClientServiceSpy.secondPlayer.name} : ${messageReceive}` };
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

    it('isHelpCommand() should return true if the command aide is valid', () => {
        const input = '!aide';

        expect(service['isHelpCommand'](input)).toEqual(true);
    });

    it('isHelpCommand() should return false if the command aide is not valid', () => {
        const input = '!ae';

        expect(service['isHelpCommand'](input)).toEqual(false);
    });
    it('should called configureReserveLetterCommand  method if the server emit the Event', () => {
        const spy = spyOn(service, 'configureReserveLetterCommand' as never);
        socketEmulator.peerSideEmit(SocketEvents.AllReserveLetters);
        expect(spy).toHaveBeenCalled();
    });

    it('configureImpossibleCommandError() should return the valid error configuration', () => {
        const errorMessage = 'invalid placement';
        const EXPECTED_IMPOSSIBLE_ERROR = { type: 'system-message', data: `[Erreur] ${errorMessage}` };

        expect(service['configureImpossibleCommandError'](errorMessage)).toEqual(EXPECTED_IMPOSSIBLE_ERROR);
    });

    it('SubmitMessage should send nothing if the user input is empty', () => {
        const spy2 = spyOn(service, 'addMessage' as never);
        service.submitMessage('');
        expect(commandHandlerSpy.sendCommand).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });
});
