/* eslint-disable max-lines */
import { Injectable, OnDestroy } from '@angular/core';
import { SocketEvents } from '@common/constants/socket-events';
import { ChatboxMessage } from '@common/interfaces/chatbox-message';
// import { CommandInfo } from '@common/interfaces/command-info';
// import { Letter } from '@common/interfaces/letter';
import { CommandHandlerService } from '@app/services/command-handler.service';
import { ClientSocketService } from '@app/services/communication/client-socket.service';
// import { GameClientService } from '@app/services/game-client.service';
// import { GameConfigurationService } from '@app/services/game-configuration.service';
import { SocketResponse } from '@app/interfaces/server-responses';
import { ChatCommand } from '@app/models/chat-command';
import { UserService } from '@app/services/user.service';
import { TimeService } from '@services/time.service';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatboxHandlerService implements OnDestroy {
    messages: ChatboxMessage[];
    loggedIn: boolean;

    constructor(
        private clientSocket: ClientSocketService,
        // private gameConfiguration: GameConfigurationService,
        // private gameClient: GameClientService,
        private commandHandler: CommandHandlerService,
        private timerService: TimeService,
        private userService: UserService,
    ) {
        this.messages = [];
        this.loggedIn = false;

        this.configureBaseSocketFeatures();
    }

    ngOnDestroy() {
        this.leaveHomeRoom(this.userService.user.username);
    }

    submitMessage(userInput: string): void {
        const message: ChatboxMessage = this.configureUserMessage(userInput);
        if (this.isCommand(userInput)) {
            this.sendCommand(userInput);
        } else {
            this.sendMessage(message);
            this.messages.push(message);
        }
    }

    joinHomeRoom(userName: string): void {
        this.clientSocket.send(SocketEvents.JoinHomeRoom, userName);
    }

    leaveHomeRoom(userName: string): void {
        this.clientSocket.send(SocketEvents.UserLeftRoom, userName);
    }

    subscribeToUserConnection(): Subject<SocketResponse> {
        const roomJoinedSubject: Subject<SocketResponse> = new Subject<SocketResponse>();
        this.clientSocket.on(SocketEvents.UserConnected, (userName: string) => {
            if (userName === this.userService.user.username) {
                roomJoinedSubject.next({ validity: true });
                this.loggedIn = true;
            }
        });
        this.clientSocket.on(SocketEvents.UserJoinedRoom, (userName: string) => {
            if (userName === this.userService.user.username) {
                roomJoinedSubject.next({ validity: true });
                this.loggedIn = true;
            }
        });
        this.clientSocket.on(SocketEvents.RoomIsFull, (userName: string) => {
            if (userName === this.userService.user.username) {
                roomJoinedSubject.next({ validity: false, socketMessage: SocketEvents.RoomIsFull });
            }
        });
        this.clientSocket.on(SocketEvents.UsernameTaken, (userName: string) => {
            if (userName === this.userService.user.username) {
                roomJoinedSubject.next({ validity: false, socketMessage: SocketEvents.UsernameTaken });
            }
        });

        return roomJoinedSubject;
    }

    subscribeToUserDisconnecting(): Subject<void> {
        const roomLeftSubject: Subject<void> = new Subject<void>();
        this.clientSocket.on(SocketEvents.UserLeftHomeRoom, (userName: string) => {
            if (userName === this.userService.user.username) {
                roomLeftSubject.next();
                this.loggedIn = false;
                this.messages = [];
            }
        });

        return roomLeftSubject;
    }

    private configureBaseSocketFeatures(): void {
        this.clientSocket.on(SocketEvents.GameMessage, (message: ChatboxMessage) => {
            this.messages.push(message);
        });

        this.clientSocket.on(SocketEvents.UserJoinedRoom, (userName: string) => {
            this.messages.push(this.createConnectedUserMessage(userName));
        });

        this.clientSocket.on(SocketEvents.ReceiveHomeMessage, (message: ChatboxMessage) => {
            this.messages.push(message);
        });

        this.clientSocket.on(SocketEvents.UserLeftHomeRoom, (userName: string) => {
            this.messages.push(this.createDisconnectedUserMessage(userName));
        });

        // this.clientSocket.on(SocketEvents.ImpossibleCommandError, (error: string) => {
        //     this.messages.push(this.createImpossibleCommandMessage(error));
        // });

        //
        // this.clientSocket.on(SocketEvents.GameEnd, () => {
        //     this.endGameMessage();
        // });

        // this.clientSocket.on(SocketEvents.AllReserveLetters, (letterReserveUpdated: Letter[]) => {
        //     this.configureReserveLetterCommand(letterReserveUpdated);
        // });

        // this.clientSocket.on(SocketEvents.ClueCommand, (clueCommand: CommandInfo[]) => {
        //     this.configureClueCommand(clueCommand);
        // });
    }

    private sendMessage(message: ChatboxMessage): void {
        this.clientSocket.send(SocketEvents.SendMessageHome, message);
    }

    private sendCommand(command: string): void {
        if (this.isValidCommand(command)) {
            this.commandHandler.sendCommand(command);
            this.messages.push({ type: 'system', message: command });
        }
    }

    private createConnectedUserMessage(userName: string): ChatboxMessage {
        return {
            type: 'system',
            message: `'${userName}' a join le salon!`,
            timeStamp: this.timerService.getTimeStampNow(),
        };
    }

    private createDisconnectedUserMessage(userName: string): ChatboxMessage {
        return {
            type: 'system',
            message: `'${userName}' a quitté le salon.`,
            timeStamp: this.timerService.getTimeStampNow(),
        };

        // TODO : Send message when replacing player with virutal one
        // if (!this.gameClient.isGameFinish) {
        //     this.messages.push({
        //         type: 'system-message',
        //         message: "------L'adversaire à été remplacé par un joueur virtuel Débutant------",
        //         timeStamp: this.timeService.getTimeStamp(),
        //     });
        // }
    }

    private configureUserMessage(userInput: string): ChatboxMessage {
        return {
            username: this.userService.user.username,
            type: 'client',
            message: userInput,
            timeStamp: this.timerService.getTimeStampNow(),
        };
    }

    // endGameMessage(): void {
    //     setTimeout(() => {
    //         const myLetterLeft = this.getAllLetter(this.gameClient.playerOne.rack as never);
    //         const opponentLetterLeft = this.getAllLetter(this.gameClient.secondPlayer.rack as never);
    //         this.messages.push({
    //             type: 'system-message',
    //             message: 'Fin de la partie : lettres restantes',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             type: 'system-message',
    //             message: `${this.gameClient.playerOne.name} : ${myLetterLeft}`,
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             type: 'system-message',
    //             message: `${this.gameClient.secondPlayer.name} : ${opponentLetterLeft}`,
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //     }, TIMEOUT);
    // }

    // private configureClueCommand(clueCommand: CommandInfo[]): void {
    //     if (clueCommand.length !== 0) {
    //         this.addClueCommand(clueCommand);
    //         return;
    //     }
    //     this.messages.push({
    //         type: 'system',
    //         message: "Il n'y a pas de possibilité de formation de mot possible",
    //         timeStamp: this.timeService.getTimeStamp(),
    //     });
    // }

    // private addClueCommand(clueCommand: CommandInfo[]): void {
    //     clueCommand.forEach((clue) => {
    //         this.messages.push({
    //             userName: undefined,
    //             type: 'system',
    //             message: `!placer ${String.fromCharCode(CHAR_ASCII + clue.firstCoordinate.y)}${clue.firstCoordinate.x}${
    //                 clue.isHorizontal ? 'h' : 'v'
    //             } ${clue.letters.join('')}`,
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //     });
    //     if (clueCommand.length < 3)
    //         this.messages.push({
    //             type: 'system-message',
    //             message: 'Aucune autre possibilité possible',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    // }

    private isCommand(userInput: string): boolean {
        return userInput.split(ChatCommand.Flag)[0] === '';
    }

    private isValidCommand(userCommand: string): boolean {
        userCommand = userCommand.split(ChatCommand.Flag)[1];

        return (
            Object.values(ChatCommand).find((command: string) => {
                return command === userCommand;
            }) !== undefined
        );
    }

    // private isHelpCommand(userCommand: string): boolean {
    //     const validReserveCommand = '^!aide$';
    //     const validReserveCommandRegex = new RegExp(validReserveCommand);
    //     if (validReserveCommandRegex.test(userCommand)) {
    //         this.messages.push({
    //             type: 'system-message',
    //             message: 'VOICI LES COMMANDES VALIDES',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             type: 'system-message',
    //             message: '!passer  : Passer son tour',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             type: 'system-message',
    //             message: '!réserve : Affiche toutes les lettres disponibles dans la réserve',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             type: 'system-message',
    //             message: "!indice  : Envoie jusqu'à 3 possibilités de placement possible sur la planche de jeu",
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             type: 'system-message',
    //             message:
    //                 '!echanger <lettre>:  Échanger des lettres sur ton chevalet (celles-ci doivent être écritent en minuscule ou' +
    //                 ' mettre " * " pour les lettres blanches (ex: !echanger e*a)',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         this.messages.push({
    //             userName: '',
    //             type: 'system',
    //             message:
    //                 '!placer <ligne><colonne>[(h|v)] <lettres>:  Placer un mot en utilisant les lettres de notre chevalet' +
    //                 '(Mettre la lettre en majuscule lorsque vous utilisez une lettre blanche) (ex: !placer g9h adanT)',
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //         return true;
    //     }
    //     return false;
    // }

    // private validCommandSyntax(userCommand: string): boolean {
    //     if (this.validSyntax(userCommand)) return this.validCommandParameters(userCommand);
    //     this.messages.push(this.configureSyntaxError());
    //     return false;
    // }

    // private validCommandParameters(userCommand: string): boolean {
    //     if (this.validParameters(userCommand)) return this.isCommandExchangePossible(userCommand);
    //
    //     this.messages.push(this.configureInvalidError());
    //     return false;
    // }

    // private isCommandExchangePossible(userCommand: string): boolean {
    //     if (this.exchangePossible(userCommand)) return this.isPlayerTurn();
    //     this.messages.push(this.configureImpossibleToExchangeMessage());
    //     return false;
    // }

    // private isPlayerTurn() {
    //     if (this.gameClient.playerOneTurn) return true;
    //     this.messages.push({
    //         type: 'system-message',
    //         message: "Ce n'est pas votre tour",
    //         timeStamp: this.timeService.getTimeStamp(),
    //     });
    //     return false;
    // }

    // private isReserveCommand(userInput: string): boolean {
    //     const validReserveCommand = '^!r(é|e)serve$';
    //     const validReserveCommandRegex = new RegExp(validReserveCommand);
    //     return validReserveCommandRegex.test(userInput);
    // }

    // private validSyntax(userInput: string): boolean {
    //     return this.validSyntaxRegex.test(userInput);
    // }

    // private validParameters(userInput: string): boolean {
    //     return VALID_COMMAND_REGEX.test(userInput);
    // }

    // private exchangePossible(userInput: string): boolean {
    //     const validReserveCommand = '^!(é|e)changer';
    //     const validReserveCommandRegex = new RegExp(validReserveCommand);
    //     return !(this.gameClient.letterReserveLength < EXCHANGE_ALLOWED_MINIMUM && validReserveCommandRegex.test(userInput));
    // }

    // private configureImpossibleToExchangeMessage(): ChatboxMessage {
    //     return {
    //         type: 'system-message',
    //         message: "[Erreur] Impossible d'échanger à cause qu'il reste moins de 7 lettres dans la réserve",
    //         timeStamp: this.timeService.getTimeStamp(),
    //     };
    // }

    // private configureSyntaxError(): ChatboxMessage {
    //     return {
    //         type: 'system-message',
    //         message: '[Erreur] Erreur de syntaxe',
    //         timeStamp: this.timeService.getTimeStamp(),
    //     };
    // }

    // private configureInvalidError(): ChatboxMessage {
    //     return {
    //         type: 'system-message',
    //         message: '[Erreur] La commande saisie est invalide',
    //         timeStamp: this.timeService.getTimeStamp(),
    //     };
    // }

    // private createImpossibleCommandMessage(error: string): ChatboxMessage {
    //     return { type: 'system-message', message: `[Erreur] ${error}`, timeStamp: this.timeService.getTimeStamp() };
    // }

    // private getAllLetter(letters: Letter[]): string {
    //     let letterString = '';
    //     letters.forEach((letter) => {
    //         letterString = letterString + letter.value;
    //     });
    //     return letterString;
    // }

    // private configureReserveLetterCommand(letterReserve: Letter[]): void {
    //     letterReserve.forEach((letter) => {
    //         this.messages.push({
    //             type: 'system-message',
    //             message: `${letter.value}: ${letter.quantity}`,
    //             timeStamp: this.timeService.getTimeStamp(),
    //         });
    //     });
    // }
}
