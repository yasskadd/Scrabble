import { Injectable } from '@angular/core';
import { ChatboxMessage } from '@app/classes/chatbox-message';
import { ClientSocketService } from './client-socket.service';
import { GameConfigurationService } from './game-configuration.service';

// const VALID_SYNTAX_REGEX_STRING = '^!aide|^!placer|^!(é|e)changer|^!passer';
// const VALID_SYNTAX_REGEX = new RegExp(VALID_SYNTAX_REGEX_STRING);
const VALID_COMMAND_REGEX_STRING =
    '^!aide$|^!placer [a-g][0-9]{1,2}(v|h){0,1} [a-zA-Z]$|^!placer [a-g][0-9]{1,2}(v|h) ([a-zA-Z]){1,7}$|^!(é|e)changer ([a-z]|[*]){1,7}$|^!passer$';
const VALID_COMMAND_REGEX = new RegExp(VALID_COMMAND_REGEX_STRING);
const IS_COMMAND_REGEX_STRING = '^!';
const IS_COMMAND_REGEX = new RegExp(IS_COMMAND_REGEX_STRING);

@Injectable({
    providedIn: 'root',
})
export class ChatboxHandlerService {
    private static readonly foo = '^!aide|^!placer|^!(é|e)changer|^!passer';
    messages: ChatboxMessage[];
    private readonly validSyntaxRegex = RegExp(ChatboxHandlerService.foo);

    constructor(private clientSocket: ClientSocketService, private gameConfiguration: GameConfigurationService) {
        this.messages = [];
        this.clientSocket.establishConnection();
        this.configureBaseSocketFeatures();
    }

    submitMessage(userInput: string): void {
        if (userInput !== '') {
            if (this.isCommand(userInput)) {
                if (this.validCommand(userInput)) {
                    this.sendCommand(userInput);
                }
            } else {
                this.addMessage(this.configureUserMessage(userInput));
                this.sendMessage(userInput);
            }
        }
    }

    private configureBaseSocketFeatures(): void {
        this.clientSocket.on('gameMessage', (broadcastMessage: string) => {
            this.messages.push({ type: 'opponent-user', data: `${this.gameConfiguration.playerName[1]} : ${broadcastMessage}` });
        });
        this.clientSocket.on('user disconnect', () => {
            this.addDisconnect();
        });
    }

    private sendMessage(message: string): void {
        this.clientSocket.send('message', { roomId: this.gameConfiguration.roomId, message });
    }

    private sendCommand(command: string): void {
        this.clientSocket.send('command', command);
    }

    private addMessage(message: ChatboxMessage): void {
        this.messages.push(message);
    }

    private addDisconnect() {
        this.messages.push({ type: 'system-message', data: "L'autre joueur s'est déconnecté" });
    }

    private isCommand(userInput: string): boolean {
        return IS_COMMAND_REGEX.test(userInput);
    }

    private validCommand(userCommand: string): boolean {
        if (this.validSyntax(userCommand)) {
            if (this.validCommandParameters(userCommand)) {
                this.addMessage(this.configureUserMessage(userCommand));
                return true;
            } else {
                this.addMessage(this.configureInvalidError());
            }
        } else {
            this.addMessage(this.configureSyntaxError());
        }
        return false;
    }

    private validSyntax(userInput: string): boolean {
        return this.validSyntaxRegex.test(userInput);
    }

    private validCommandParameters(userInput: string): boolean {
        return VALID_COMMAND_REGEX.test(userInput);
    }

    private configureUserMessage(userInput: string): ChatboxMessage {
        return { type: 'current-user', data: `Toi : ${userInput}` };
    }

    private configureSyntaxError(): ChatboxMessage {
        return { type: 'system-message', data: '[Erreur] Erreur de synthese' };
    }

    private configureInvalidError(): ChatboxMessage {
        return { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };
    }

    // TODO : come back to test and code

    // private configureImpossibleCommandError(): ChatboxMessage {
    //     return { type: 'system-message', data: '[Erreur] Commande impossible à réaliser' };
    // }
}
