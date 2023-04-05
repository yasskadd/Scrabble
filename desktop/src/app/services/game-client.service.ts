import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { SocketEvents } from '@common/constants/socket-events';
import { GameInfo } from '@common/interfaces/game-state';
import { Letter } from '@common/interfaces/letter';
import { PlayerInformation } from '@common/interfaces/player-information';
import { IUser } from '@common/interfaces/user';
import { UserService } from '@services/user.service';
import { ReplaySubject, Subject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';

// type CompletedObjective = { objective: Objective; name: string };
// type InitObjective = { objectives1: Objective[]; objectives2: Objective[]; playerName: string };
const TIMEOUT_PASS = 30;

@Injectable({
    providedIn: 'root',
})
export class GameClientService {
    timer: number;
    activePlayer: IUser;
    players: PlayerInformation[];
    letterReserveLength: number;
    isGameFinish: boolean;
    winner: string;
    winningMessage: string;
    gameboardUpdated: Subject<string[]>;
    quitGameSubject: Subject<void>;
    nextTurnSubject: Subject<void>;
    turnFinish: ReplaySubject<boolean>;

    constructor(private clientSocketService: ClientSocketService, private userService: UserService, private router: Router) {
        this.gameboardUpdated = new Subject<string[]>();
        this.quitGameSubject = new Subject<void>();
        this.nextTurnSubject = new Subject<void>();
        this.turnFinish = new ReplaySubject<boolean>(1);

        this.clientSocketService.connected.subscribe((connected: boolean) => {
            if (connected) {
                this.configureBaseSocketFeatures();
            }
        });
    }

    initGameInformation() {
        this.timer = 0;
        this.activePlayer = undefined;
        this.players = [];
        this.letterReserveLength = 0;
        this.isGameFinish = false;
        this.winningMessage = '';
        this.winner = '';
    }

    configureBaseSocketFeatures() {
        this.clientSocketService.on(SocketEvents.UpdatePlayersInformation, (players: PlayerInformation[]) => {
            this.updatePlayersInformationEvent(players);
        });

        this.clientSocketService.on(SocketEvents.UpdateOpponentInformation, (player: PlayerInformation[]) => {
            this.updateOpponentInformationEvent(player);
        });

        this.clientSocketService.on(SocketEvents.LetterReserveUpdated, (letterReserveUpdated: Letter[]) => {
            this.getAllLetterReserve(letterReserveUpdated);
        });

        this.clientSocketService.on(SocketEvents.GameEnd, () => {
            this.gameEndEvent();
        });

        this.clientSocketService.on(SocketEvents.OpponentGameLeave, () => {
            this.opponentLeaveGameEvent();
        });

        this.clientSocketService.on(SocketEvents.PublicViewUpdate, (info: GameInfo) => {
            this.viewUpdateEvent(info);
        });

        this.clientSocketService.on(SocketEvents.NextTurn, (info: GameInfo) => {
            this.viewUpdateEvent(info);
            this.nextTurnSubject.next();
        });

        this.clientSocketService.on(SocketEvents.GameAboutToStart, (info: GameInfo) => {
            this.viewUpdateEvent(info);

            // console.log('Received new game with :');
            // this.players.forEach((player: PlayerInformation) => {
            // console.log(player.player);
            // console.log(
            // player.rack.map((letter: Letter) => {
            // return letter.value;
            // }),
            // );
            // console.log('');
            // });

            this.router.navigate([`${AppRoutes.GamePage}`]).then();
        });

        // this.clientSocketService.on('CompletedObjective', (completedObjective: CompletedObjective) => {
        // this.completeObjective(completedObjective);
        // });

        // this.clientSocketService.on('InitObjective', (objective: InitObjective) => {
        // this.setObjectives(objective);
        // });

        this.clientSocketService.on(SocketEvents.Skip, (gameInfo: GameInfo) => {
            setTimeout(() => {
                this.skipEvent(gameInfo);
            }, TIMEOUT_PASS);
        });

        this.clientSocketService.on(SocketEvents.TimerClientUpdate, (newTimer: number) => {
            this.timerClientUpdateEvent(newTimer);
        });
    }

    updateGameboard(newGameboard: string[]) {
        this.gameboardUpdated.next(newGameboard);
    }

    abandonGame() {
        this.clientSocketService.send(SocketEvents.AbandonGame);
        this.quitGameSubject.next();
    }

    quitGame() {
        this.clientSocketService.send(SocketEvents.QuitGame);
        this.quitGameSubject.next();
    }

    getLocalPlayer(): PlayerInformation {
        return this.players.find((info: PlayerInformation) => info.player.user.username === this.userService.user.username);
    }

    currentlyPlaying(): boolean {
        return this.activePlayer?.username === this.userService.user.username;
    }

    // private completeObjective(completedObjective: CompletedObjective) {
    //     if (this.playerOne.objective === undefined || this.secondPlayer.objective === undefined) return;
    //     const indexPlayerOne = this.playerOne.objective.findIndex((element) => element.user.username === completedObjective.objective.name);
    //     const indexSecondPlayer = this.secondPlayer.objective.findIndex((element) => element.name === completedObjective.objective.name);
    //     if (indexPlayerOne !== constants.INVALID_INDEX && !this.playerOne.objective[indexPlayerOne].complete) {
    //         this.playerOne.objective[indexPlayerOne].complete = true;
    //         this.playerOne.objective[indexPlayerOne].user = completedObjective.name;
    //         this.openSnackBar(`L'objectif ${this.playerOne.objective[indexPlayerOne].name} a été complété`);
    //     }
    //     if (indexSecondPlayer !== constants.INVALID_INDEX && !this.secondPlayer.objective[indexSecondPlayer].complete) {
    //         this.secondPlayer.objective[indexSecondPlayer].complete = true;
    //         this.secondPlayer.objective[indexSecondPlayer].user = completedObjective.name;
    //     }
    // }

    // private setObjectives(objective: InitObjective) {
    //     if (objective.playerName === this.playerOne.name) {
    //         this.playerOne.objective = objective.objectives1;
    //         this.secondPlayer.objective = objective.objectives2;
    //         return;
    //     }
    //     this.secondPlayer.objective = objective.objectives1;
    //     this.playerOne.objective = objective.objectives2;
    // }

    private updateOpponentInformationEvent(players: PlayerInformation[]) {
        this.players = players;
    }

    private timerClientUpdateEvent(newTimer: number) {
        this.timer = newTimer;
        this.isTurnFinish(newTimer);
    }

    private isTurnFinish(newTimer: number): void {
        if (newTimer === 0 && this.activePlayer.username === this.userService.user.username) {
            this.turnFinish.next(true);
            this.turnFinish.next(false);
        }
    }

    private viewUpdateEvent(info: GameInfo) {
        this.activePlayer = info.activePlayer;
        this.players = info.players;
        this.updateGameboard(info.gameboard);
    }

    private updatePlayersInformationEvent(players: PlayerInformation[]) {
        this.players = players;
    }

    private updateRack(newRack: Letter[]): Letter[] {
        const dictionary = new Map();
        newRack.forEach((letter) => {
            const dictionaryLetter = dictionary.get(letter.value);
            if (dictionaryLetter === undefined) dictionary.set(letter.value, { counter: 1, letter });
            else dictionaryLetter.counter++;
        });

        const resultingRack = [] as Letter[];
        this.getLocalPlayer().rack.forEach((letter) => {
            const dictionaryLetter = dictionary.get(letter.value);
            if (dictionaryLetter !== undefined && dictionaryLetter.counter > 0) {
                resultingRack.push(letter);
                dictionaryLetter.counter--;
            }
        });
        dictionary.forEach((dictionaryLetter) => {
            while (dictionaryLetter.counter > 0) {
                resultingRack.push(dictionaryLetter.letter);
                dictionaryLetter.counter--;
            }
        });

        return resultingRack;
    }

    private gameEndEvent() {
        if (this.winningMessage === '') {
            this.findWinnerByScore();
            this.isGameFinish = true;
        }
    }

    private opponentLeaveGameEvent() {
        this.isGameFinish = true;
        this.winningMessage = "Bravo vous avez gagné la partie, l'adversaire a quitté la partie";
    }

    private skipEvent(gameInfo: GameInfo) {
        this.getLocalPlayer().rack = this.updateRack(this.getLocalPlayer().rack);
        this.updateGameboard(gameInfo.gameboard);
    }

    private findWinnerByScore(): void {
        let score = this.players[0].score;
        const differentScores: PlayerInformation[] = this.players.filter((info: PlayerInformation) => info.score !== score);
        if (differentScores.length > 0) {
            this.winningMessage = 'game.state.equality';
            return;
        }

        let winningPlayer: PlayerInformation;
        this.players.forEach((info: PlayerInformation) => {
            if (info.score > score) {
                score = info.score;
                winningPlayer = info;
            }
        });

        if (winningPlayer.player.user.username === this.userService.user.username) {
            this.winningMessage = 'game.state.winned';
        }
        this.winner = winningPlayer.player.user.username;
    }

    private getAllLetterReserve(lettersReserveUpdated: Letter[]): void {
        let letterString = '';
        lettersReserveUpdated.forEach((letter) => {
            for (let i = 1; i <= letter.quantity; i++) {
                letterString = letterString + letter.value;
            }
        });
        this.letterReserveLength = letterString.length;
    }
}
