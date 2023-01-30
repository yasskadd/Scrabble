import { Injectable } from '@angular/core';
import { ChatboxMessage } from '@app/interfaces/chatbox-message';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Letter } from '@common/interfaces/letter';
import { CommandHandlerService } from './command-handler.service';
import { ClientSocketService } from './communication/client-socket.service';
import { GameClientService } from './game-client.service';
import { GameConfigurationService } from './game-configuration.service';

const EXCHANGE_ALLOWED_MINIMUM = 7;
const CHAR_ASCII = 96;
const TIMEOUT = 15;
const VALID_COMMAND_REGEX_STRING =
    '^!r(é|e)serve$|^!indice$|^!aide$|^!placer [a-o][0-9]{1,2}(v|h){0,1} [a-zA-Z]$' +
    '|^!placer [a-o][0-9]{1,2}(v|h) ([a-zA-Z]){1,7}$|^!(é|e)changer ([a-z]|[*]){1,7}$|^!passer$';
const VALID_COMMAND_REGEX = new RegExp(VALID_COMMAND_REGEX_STRING);
const IS_COMMAND_REGEX_STRING = '^!';
const IS_COMMAND_REGEX = new RegExp(IS_COMMAND_REGEX_STRING);

@Injectable({
    providedIn: 'root',
})
export class ChatboxHandlerService {
    private static readonly syntaxRegexString = '^!r(é|e)serve|^!aide|^!placer|^!(é|e)changer|^!passer|^!indice';
    messages: ChatboxMessage[];
    private readonly validSyntaxRegex = RegExp(ChatboxHandlerService.syntaxRegexString);

    constructor(
        private clientSocket: ClientSocketService,
        private gameConfiguration: GameConfigurationService,
        private gameClient: GameClientService,
        private commandHandler: CommandHandlerService,
    ) {
        this.addWelcomeMessages();
        this.configureBaseSocketFeatures();
        this.listenToObserver();
    }

    submitMessage(userInput: string): void {
        if (userInput !== '') {
            this.addMessage(this.configureUserMessage(userInput));
            this.isMessageACommand(userInput);
        }
    }

    endGameMessage(): void {
        setTimeout(() => {
            const myLetterLeft = this.getAllLetter(this.gameClient.playerOne.rack as never);
            const opponentLetterLeft = this.getAllLetter(this.gameClient.secondPlayer.rack as never);
            this.messages.push({ type: 'system-message', data: 'Fin de la partie : lettres restantes' });
            this.messages.push({ type: 'system-message', data: `${this.gameClient.playerOne.name} : ${myLetterLeft}` });
            this.messages.push({ type: 'system-message', data: `${this.gameClient.secondPlayer.name} : ${opponentLetterLeft}` });
        }, TIMEOUT);
    }

    resetMessage(): void {
        this.addWelcomeMessages();
    }

    private configureBaseSocketFeatures(): void {
        this.clientSocket.on(SocketEvents.GameMessage, (broadcastMessage: string) => {
            this.messages.push({ type: 'opponent-user', data: `${this.gameClient.secondPlayer.name} : ${broadcastMessage}` });
        });

        this.clientSocket.on(SocketEvents.ImpossibleCommandError, (error: string) => {
            this.addMessage(this.configureImpossibleCommandError(error));
        });

        this.clientSocket.on(SocketEvents.UserDisconnect, () => {
            this.addDisconnect();
        });

        this.clientSocket.on(SocketEvents.GameEnd, () => {
            this.endGameMessage();
        });

        this.clientSocket.on(SocketEvents.AllReserveLetters, (letterReserveUpdated: Letter[]) => {
            this.configureReserveLetterCommand(letterReserveUpdated);
        });

        this.clientSocket.on(SocketEvents.ClueCommand, (clueCommand: CommandInfo[]) => {
            this.configureClueCommand(clueCommand);
        });
    }

    private listenToObserver(): void {
        this.gameClient.turnFinish.subscribe((value) => {
            if (value) {
                this.addMessage(this.configureUserMessage('!passer'));
                this.sendMessage('!passer');
            }
        });
    }

    private addWelcomeMessages() {
        this.messages = [
            { type: 'system-message', data: 'Bienvenue dans votre partie de Scrabble' },
            {
                type: 'system-message',
                data: 'La commande !aide est mise à votre disposition afin de faciliter votre compréhension du jeu',
            },
        ];
    }

    private isMessageACommand(userInput: string): void {
        const commandValid = userInput.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!this.isCommand(commandValid)) {
            this.sendMessage(userInput);
            return;
        }
        if (this.validCommand(commandValid)) this.commandHandler.sendCommand(commandValid);
    }

    private configureClueCommand(clueCommand: CommandInfo[]): void {
        if (clueCommand.length !== 0) {
            this.addClueCommand(clueCommand);
            return;
        }
        this.messages.push({ type: 'system-message', data: "Il n'y a pas de possibilité de formation de mot possible" });
    }

    private addClueCommand(clueCommand: CommandInfo[]): void {
        clueCommand.forEach((clue) => {
            this.messages.push({
                type: 'system-message',
                data: `!placer ${String.fromCharCode(CHAR_ASCII + clue.firstCoordinate.y)}${clue.firstCoordinate.x}${
                    clue.isHorizontal ? 'h' : 'v'
                } ${clue.letters.join('')}`,
            });
        });
        if (clueCommand.length < 3) this.messages.push({ type: 'system-message', data: 'Aucune autre possibilité possible' });
    }

    private sendMessage(message: string): void {
        this.clientSocket.send(SocketEvents.SendMessage, { roomId: this.gameConfiguration.roomInformation.roomId, message });
    }

    private addMessage(message: ChatboxMessage): void {
        this.messages.push(message);
    }

    private addDisconnect(): void {
        this.messages.push({ type: 'system-message', data: `${this.gameClient.secondPlayer.name} a quitté le jeu` });
        if (!this.gameClient.isGameFinish)
            this.messages.push({ type: 'system-message', data: "------L'adversaire à été remplacé par un joueur virtuel Débutant------" });
    }

    private isCommand(userInput: string): boolean {
        return IS_COMMAND_REGEX.test(userInput);
    }

    private validCommand(userCommand: string): boolean {
        if (this.isHelpCommand(userCommand) || this.isReserveCommand(userCommand)) return true;
        return this.validCommandSyntax(userCommand);
    }

    private isHelpCommand(userCommand: string): boolean {
        const validReserveCommand = '^!aide$';
        const validReserveCommandRegex = new RegExp(validReserveCommand);
        if (validReserveCommandRegex.test(userCommand)) {
            this.messages.push({ type: 'system-message', data: 'VOICI LES COMMANDES VALIDES' });
            this.messages.push({ type: 'system-message', data: '!passer  : Passer son tour' });
            this.messages.push({ type: 'system-message', data: '!réserve : Affiche toutes les lettres disponibles dans la réserve' });
            this.messages.push({
                type: 'system-message',
                data: "!indice  : Envoie jusqu'à 3 possibilités de placement possible sur la planche de jeu",
            });
            this.messages.push({
                type: 'system-message',
                data:
                    '!echanger <lettre>:  Échanger des lettres sur ton chevalet (celles-ci doivent être écritent en minuscule ou' +
                    ' mettre " * " pour les lettres blanches (ex: !echanger e*a)',
            });
            this.messages.push({
                type: 'system-message',
                data:
                    '!placer <ligne><colonne>[(h|v)] <lettres>:  Placer un mot en utilisant les lettres de notre chevalet' +
                    '(Mettre la lettre en majuscule lorsque vous utilisez une lettre blanche) (ex: !placer g9h adanT)',
            });
            return true;
        }
        return false;
    }

    private validCommandSyntax(userCommand: string): boolean {
        if (this.validSyntax(userCommand)) return this.validCommandParameters(userCommand);
        this.addMessage(this.configureSyntaxError());
        return false;
    }

    private validCommandParameters(userCommand: string): boolean {
        if (this.validParameters(userCommand)) return this.isCommandExchangePossible(userCommand);

        this.addMessage(this.configureInvalidError());
        return false;
    }

    private isCommandExchangePossible(userCommand: string): boolean {
        if (this.exchangePossible(userCommand)) return this.isPlayerTurn();
        this.addMessage(this.configureImpossibleToExchangeMessage());
        return false;
    }

    private isPlayerTurn() {
        if (this.gameClient.playerOneTurn) return true;
        this.messages.push({ type: 'system-message', data: "Ce n'est pas votre tour" });
        return false;
    }

    private isReserveCommand(userInput: string): boolean {
        const validReserveCommand = '^!r(é|e)serve$';
        const validReserveCommandRegex = new RegExp(validReserveCommand);
        return validReserveCommandRegex.test(userInput);
    }

    private validSyntax(userInput: string): boolean {
        return this.validSyntaxRegex.test(userInput);
    }

    private validParameters(userInput: string): boolean {
        return VALID_COMMAND_REGEX.test(userInput);
    }

    private exchangePossible(userInput: string): boolean {
        const validReserveCommand = '^!(é|e)changer';
        const validReserveCommandRegex = new RegExp(validReserveCommand);
        if (this.gameClient.letterReserveLength < EXCHANGE_ALLOWED_MINIMUM && validReserveCommandRegex.test(userInput)) return false;
        return true;
    }

    private configureImpossibleToExchangeMessage(): ChatboxMessage {
        return { type: 'system-message', data: "[Erreur] Impossible d'échanger à cause qu'il reste moins de 7 lettres dans la réserve" };
    }

    private configureUserMessage(userInput: string): ChatboxMessage {
        return { type: 'current-user', data: `Toi : ${userInput}` };
    }

    private configureSyntaxError(): ChatboxMessage {
        return { type: 'system-message', data: '[Erreur] Erreur de syntaxe' };
    }

    private configureInvalidError(): ChatboxMessage {
        return { type: 'system-message', data: '[Erreur] La commande saisie est invalide' };
    }

    private configureImpossibleCommandError(error: string): ChatboxMessage {
        return { type: 'system-message', data: `[Erreur] ${error}` };
    }

    private getAllLetter(letters: Letter[]): string {
        let letterString = '';
        letters.forEach((letter) => {
            letterString = letterString + letter.value;
        });
        return letterString;
    }

    private configureReserveLetterCommand(letterReserve: Letter[]): void {
        letterReserve.forEach((letter) => {
            this.messages.push({ type: 'system-message', data: `${letter.value}: ${letter.quantity}` });
        });
    }
}
