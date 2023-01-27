/* eslint-disable dot-notation -- testing private methods or attributes */
import { TestBed } from '@angular/core/testing';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { CommandHandlerService } from './command-handler.service';

describe('CommandHandlerService', () => {
    let service: CommandHandlerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CommandHandlerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('sendCommand() send a command to the server with a message event', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const TEST_COMMAND = '!echanger avd';
        const exchangeLetters = ['a', 'v', 'd'];

        service['sendCommand'](TEST_COMMAND);
        expect(spy).toHaveBeenCalledWith(SocketEvents.Exchange, exchangeLetters);
    });

    it('sendCommand() with the command !reserve should send a  command to the server with an event', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const TEST_COMMAND = '!reserve';

        service['sendCommand'](TEST_COMMAND);
        expect(spy).toHaveBeenCalledWith(SocketEvents.ReserveCommand);
    });
    it('sendCommand() should call sendCommandPlacer if the command valid is to place a word on the board', () => {
        const spy = spyOn(service, 'sendCommandPlacer' as never);
        const TEST_COMMAND = '!placer e3v bonjour';

        service['sendCommand'](TEST_COMMAND);
        expect(spy).toHaveBeenCalled();
    });

    it('sendCommand() should emit an event to the server if the command valid is to skip the turn', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const TEST_COMMAND = '!passer';

        service['sendCommand'](TEST_COMMAND);
        expect(spy).toHaveBeenCalledWith(SocketEvents.Skip);
    });

    it('sendCommand() should emit an event to the server if the command valid is to have a clue', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const TEST_COMMAND = '!indice';

        service['sendCommand'](TEST_COMMAND);
        expect(spy).toHaveBeenCalledWith(SocketEvents.ClueCommand);
    });

    it('sendCommandPlacer() should send to the server all the information of the command in an object if the placement is vertical', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const commandTest = '!placer e3v bonjour';
        const commandInformation: CommandInfo = {
            firstCoordinate: { x: 3, y: 5 },
            isHorizontal: false,
            letters: ['b', 'o', 'n', 'j', 'o', 'u', 'r'],
        };

        service['sendCommand'](commandTest);
        expect(spy).toHaveBeenCalledWith(SocketEvents.Play, commandInformation);
    });

    it('sendCommandPlacer() should send to the server all the information of the command in an object if the placement is horizontal', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const commandTest = '!placer e3h bonjour';
        const commandInformation: CommandInfo = {
            firstCoordinate: { x: 3, y: 5 },
            isHorizontal: true,
            letters: ['b', 'o', 'n', 'j', 'o', 'u', 'r'],
        };

        service['sendCommand'](commandTest);
        expect(spy).toHaveBeenCalledWith(SocketEvents.Play, commandInformation);
    });

    it('sendCommandPlacer() should send to the server all the information of the command in an object if the placement is one letter', () => {
        const spy = spyOn(service['clientSocket'], 'send');
        const commandTest = '!placer e3 b';
        const commandInformation: CommandInfo = {
            firstCoordinate: { x: 3, y: 5 },
            isHorizontal: undefined,
            letters: ['b'],
        };

        service['sendCommand'](commandTest);
        expect(spy).toHaveBeenCalledWith(SocketEvents.Play, commandInformation);
    });

    it('should return the coordination with a direction if want to place a word with more than one letter', () => {
        const commandArray = ['!placer', 'o2v', 'place'];
        const placementInfo = [{ x: 2, y: 15 }, 'v'];

        expect(service['getCoordsAndDirection'](commandArray)).toEqual(placementInfo);
    });

    it('should return the coordination with a direction if the y factor is two digit', () => {
        const commandArray = ['!placer', 'o12v', 'place'];
        const placementInfo = [{ x: 12, y: 15 }, 'v'];

        expect(service['getCoordsAndDirection'](commandArray)).toEqual(placementInfo);
    });

    it('should return the coordination with no direction if one letter wants to be placed', () => {
        const commandArray = ['!placer', 'o12', 'e'];
        const placementInfo = [{ x: 12, y: 15 }, ''];
        const commandArray2 = ['!placer', 'o1', 'e'];
        const placementInfo2 = [{ x: 1, y: 15 }, ''];

        expect(service['getCoordsAndDirection'](commandArray)).toEqual(placementInfo);

        expect(service['getCoordsAndDirection'](commandArray2)).toEqual(placementInfo2);
    });
});
