import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as constants from '@common/constants/board-info';
import { SocketEvents } from '@common/constants/socket-events';
import { Letter } from '@common/interfaces/letter';
import { LetterTileInterface } from '@common/interfaces/letter-tile-interface';
import { Objective } from '@common/interfaces/objective';
import { ReplaySubject, Subject } from 'rxjs';
import { ClientSocketService } from './communication/client-socket.service';

type CompletedObjective = { objective: Objective; name: string };
type InitObjective = { objectives1: Objective[]; objectives2: Objective[]; playerName: string };
type PlayInfo = { gameboard: LetterTileInterface[]; activePlayer: string };
type PlayerInformation = { name: string; score: number; rack: Letter[]; room: string; gameboard: LetterTileInterface[] };
type Player = { name: string; score: number; rack: Letter[]; objective?: Objective[] };
type GameInfo = { gameboard: LetterTileInterface[]; players: Player[]; activePlayer: string };
const TIMEOUT_PASS = 30;
const TIMEOUT = 3000;

@Injectable({
    providedIn: 'root',
})
export class GameClientService {
    timer: number;
    gameboard: LetterTileInterface[];
    playerOne: Player;
    secondPlayer: Player;
    playerOneTurn: boolean;
    letterReserveLength: number;
    isGameFinish: boolean;
    winningMessage: string;
    gameboardUpdated: Subject<boolean>;
    turnFinish: ReplaySubject<boolean>;

    constructor(private clientSocketService: ClientSocketService, private snackBar: MatSnackBar) {
        this.timer = 0;
        this.letterReserveLength = 0;
        this.playerOne = {} as Player;
        this.secondPlayer = {} as Player;
        this.winningMessage = '';
        this.playerOneTurn = false;
        this.isGameFinish = false;
        this.gameboardUpdated = new Subject();
        this.turnFinish = new ReplaySubject<boolean>(1);
        this.configureBaseSocketFeatures();
        this.gameboard = [];
    }

    configureBaseSocketFeatures() {
        this.clientSocketService.on(SocketEvents.UpdatePlayerInformation, (player: PlayerInformation) => {
            this.updatePlayerInformationEvent(player);
        });

        this.clientSocketService.on(SocketEvents.UpdateOpponentInformation, (player: Player) => {
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

        this.clientSocketService.on(SocketEvents.ViewUpdate, (info: PlayInfo) => {
            this.viewUpdateEvent(info);
        });

        this.clientSocketService.on('CompletedObjective', (completedObjective: CompletedObjective) => {
            this.completeObjective(completedObjective);
        });

        this.clientSocketService.on('InitObjective', (objective: InitObjective) => {
            this.setObjectives(objective);
        });

        this.clientSocketService.on(SocketEvents.Skip, (gameInfo: GameInfo) => {
            setTimeout(() => {
                this.skipEvent(gameInfo);
            }, TIMEOUT_PASS);
        });

        this.clientSocketService.on(SocketEvents.TimerClientUpdate, (newTimer: number) => {
            this.timerClientUpdateEvent(newTimer);
        });
    }
    updateGameboard() {
        this.gameboardUpdated.next(true);
    }

    abandonGame() {
        this.clientSocketService.send('AbandonGame');
        this.playerOneTurn = false;
    }

    quitGame() {
        this.clientSocketService.send('quitGame');
    }

    resetGameInformation() {
        this.timer = 0;
        this.gameboard = [];
        this.playerOne = { name: '', score: 0, rack: [], objective: undefined };
        this.secondPlayer = { name: '', score: 0, rack: [], objective: undefined };
        this.playerOneTurn = false;
        this.letterReserveLength = 0;
        this.isGameFinish = false;
        this.winningMessage = '';
    }

    private completeObjective(completedObjective: CompletedObjective) {
        if (this.playerOne.objective === undefined || this.secondPlayer.objective === undefined) return;
        const indexPlayerOne = this.playerOne.objective.findIndex((element) => element.name === completedObjective.objective.name);
        const indexSecondPlayer = this.secondPlayer.objective.findIndex((element) => element.name === completedObjective.objective.name);
        if (indexPlayerOne !== constants.INVALID_INDEX && !this.playerOne.objective[indexPlayerOne].complete) {
            this.playerOne.objective[indexPlayerOne].complete = true;
            this.playerOne.objective[indexPlayerOne].user = completedObjective.name;
            this.openSnackBar(`L'objectif ${this.playerOne.objective[indexPlayerOne].name} a été complété`);
        }
        if (indexSecondPlayer !== constants.INVALID_INDEX && !this.secondPlayer.objective[indexSecondPlayer].complete) {
            this.secondPlayer.objective[indexSecondPlayer].complete = true;
            this.secondPlayer.objective[indexSecondPlayer].user = completedObjective.name;
        }
    }

    private openSnackBar(reason: string): void {
        this.snackBar.open(reason, 'fermer', {
            duration: TIMEOUT,
            horizontalPosition: 'center',
        });
    }

    private setObjectives(objective: InitObjective) {
        if (objective.playerName === this.playerOne.name) {
            this.playerOne.objective = objective.objectives1;
            this.secondPlayer.objective = objective.objectives2;
            return;
        }
        this.secondPlayer.objective = objective.objectives1;
        this.playerOne.objective = objective.objectives2;
    }

    private updateOpponentInformationEvent(player: Player) {
        this.secondPlayer = { ...player, objective: this.secondPlayer.objective };
    }

    private timerClientUpdateEvent(newTimer: number) {
        this.timer = newTimer;
        this.isTurnFinish(newTimer);
    }

    private isTurnFinish(newTimer: number): void {
        if (newTimer === 0 && this.playerOneTurn) {
            this.turnFinish.next(true);
            this.turnFinish.next(false);
        }
    }

    private viewUpdateEvent(info: PlayInfo) {
        this.playerOneTurn = info.activePlayer === this.playerOne.name;
        this.updateNewGameboard(info.gameboard);
    }

    private updatePlayerInformationEvent(player: PlayerInformation) {
        const updatedRack = this.updateRack(player.rack);
        this.playerOne = { ...player, objective: this.playerOne.objective };
        this.playerOne.rack = updatedRack;
        this.updateNewGameboard(player.gameboard);
    }

    private updateRack(newRack: Letter[]): Letter[] {
        const dictionary = new Map();
        newRack.forEach((letter) => {
            const dictionaryLetter = dictionary.get(letter.value);
            if (dictionaryLetter === undefined) dictionary.set(letter.value, { counter: 1, letter });
            else dictionaryLetter.counter++;
        });
        const resultingRack = [] as Letter[];
        this.playerOne.rack.forEach((letter) => {
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

    private updateNewGameboard(newGameboard: LetterTileInterface[]) {
        this.gameboard = newGameboard;
        this.updateGameboard();
    }

    private gameEndEvent() {
        if (this.winningMessage === '') {
            this.findWinnerByScore();
            this.isGameFinish = true;
        }
    }

    private opponentLeaveGameEvent() {
        this.playerOneTurn = false;
        this.isGameFinish = true;
        this.winningMessage = "Bravo vous avez gagné la partie, l'adversaire a quitté la partie";
    }

    private skipEvent(gameInfo: GameInfo) {
        this.gameboard = gameInfo.gameboard;
        const playerOneIndex = this.playerOne.name === gameInfo.players[0].name ? 0 : 1;
        const secondPlayerIndex = Math.abs(playerOneIndex - 1);
        const updatedRack = this.updateRack(gameInfo.players[playerOneIndex].rack);
        this.playerOne = { ...gameInfo.players[playerOneIndex], objective: this.playerOne.objective };
        this.playerOne.rack = updatedRack;

        this.secondPlayer = { ...gameInfo.players[secondPlayerIndex], objective: this.secondPlayer.objective };
        this.playerOneTurn = gameInfo.activePlayer === this.playerOne.name;
        this.updateGameboard();
    }

    private findWinnerByScore(): void {
        if (this.playerOne.score === this.secondPlayer.score) {
            this.winningMessage = 'Égalité! Vous avez le même score que votre adversaire!';
            return;
        }
        this.winningMessage =
            this.playerOne.score > this.secondPlayer.score
                ? `Victoire à ${this.playerOne.name}! Bravo!`
                : `Victoire à ${this.secondPlayer.name}! Bravo!`;
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
