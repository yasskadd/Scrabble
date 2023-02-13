import { Injectable } from '@angular/core';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Coordinate } from '@common/interfaces/coordinate';
import { ClientSocketService } from './communication/client-socket.service';

@Injectable({
    providedIn: 'root',
})
export class CommandHandlerService {
    constructor(private clientSocket: ClientSocketService) {}

    sendCommand(command: string): void {
        const splitCommand = this.splitCommand(command);
        const commandType = this.getCommandType(splitCommand);
        switch (commandType) {
            case '!placer': {
                this.sendCommandPlacer(splitCommand);
                break;
            }
            case '!echanger': {
                this.sendCommandEchanger(splitCommand);
                break;
            }
            case '!passer': {
                this.clientSocket.send(SocketEvents.Skip);
                break;
            }
            case '!reserve': {
                this.clientSocket.send(SocketEvents.ReserveCommand);
                break;
            }
            case '!indice': {
                this.clientSocket.send(SocketEvents.ClueCommand);
                break;
            }
        }
    }

    private sendCommandPlacer(command: string[]) {
        const coordsAndDirection = this.getCoordsAndDirection(command);

        let boolDirection: boolean | undefined;
        if (coordsAndDirection[1] === 'h') boolDirection = true;
        if (coordsAndDirection[1] === 'v') boolDirection = false;

        const commandInformation: CommandInfo = {
            firstCoordinate: coordsAndDirection[0] as Coordinate,
            isHorizontal: boolDirection,
            letters: this.getLetters(command, 2),
        };
        this.clientSocket.send(SocketEvents.Play, commandInformation);
    }

    private sendCommandEchanger(command: string[]) {
        this.clientSocket.send(SocketEvents.Exchange, this.getLetters(command, 1));
    }

    private splitCommand(command: string) {
        return command.split(' ');
    }

    private isDigit(information: string) {
        return information >= '0' && information <= '9';
    }

    private getCommandType(stringArr: string[]) {
        return stringArr[0];
    }

    private getCoordsAndDirection(stringArr: string[]) {
        const placementArray = stringArr[1].split('');
        const coordinateRatio = 9;
        if (this.isDigit(placementArray[2]) && placementArray[3] != null) {
            const coordinateX = +(placementArray[1] + placementArray[2]);
            return [{ x: coordinateX, y: parseInt(placementArray[0], 36) - coordinateRatio } as Coordinate, placementArray[3]];
        }
        if (this.isDigit(placementArray[2])) {
            const coordinateX = +(placementArray[1] + placementArray[2]);
            return [{ x: coordinateX, y: parseInt(placementArray[0], 36) - coordinateRatio } as Coordinate, '' as string];
        }
        if (placementArray[2] == null) {
            const coordinateX = +placementArray[1];
            return [{ x: coordinateX, y: parseInt(placementArray[0], 36) - coordinateRatio } as Coordinate, '' as string];
        }
        return [{ x: parseInt(placementArray[1], 10), y: parseInt(placementArray[0], 36) - coordinateRatio } as Coordinate, placementArray[2]];
    }

    private getLetters(stringArr: string[], position: number) {
        return stringArr[position].split('');
    }
}
