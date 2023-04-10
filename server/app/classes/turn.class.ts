import { IUser } from '@common/interfaces/user';
import { PlayerType } from '@common/models/player-type';
import { ReplaySubject } from 'rxjs';
import { GamePlayer } from './player/player.class';

const SECOND = 1000;

export class Turn {
    activePlayer: IUser | undefined;
    inactivePlayers: IUser[] | undefined;
    endTurn: ReplaySubject<IUser | undefined>;
    countdown: ReplaySubject<number | undefined>;
    skipCounter: number;
    time: number;
    private timeOut: unknown;

    constructor(time: number) {
        this.skipCounter = 0;
        this.time = time;
        this.endTurn = new ReplaySubject(1);
        this.countdown = new ReplaySubject(1);
    }

    start(): void {
        let tempTime = this.time;
        this.timeOut = setInterval(() => {
            tempTime--;
            if (tempTime === 0) {
                clearInterval(this.timeOut as number);
                this.skipTurn();
            }
            this.countdown.next(tempTime);
        }, SECOND);
    }

    determineStartingPlayer(players: GamePlayer[]): void {
        const playingPlayers = players.filter((p: GamePlayer) => p.player.type !== PlayerType.Observer);
        const randomNumber: number = Math.floor(Math.random() * playingPlayers.length);
        this.activePlayer = playingPlayers[randomNumber].player.user;
        this.inactivePlayers = playingPlayers
            .filter((player) => {
                return player.player.user._id !== this.activePlayer?._id;
            })
            .map((player) => {
                return player.player.user;
            });
    }

    end(endGame?: boolean): void {
        clearInterval(this.timeOut as number);
        if (endGame) {
            this.activePlayer = undefined;
            this.inactivePlayers = undefined;
            this.endTurn.next(this.activePlayer);

            return;
        }

        const tempInactivePlayer: IUser | undefined = this.inactivePlayers?.shift();
        if (this.activePlayer) {
            this.inactivePlayers?.push(this.activePlayer);
        }
        this.activePlayer = tempInactivePlayer;

        this.start();
        if (this.activePlayer) this.endTurn.next(this.activePlayer);
    }

    validating(playerName: string): boolean {
        return this.activePlayer?.username === playerName;
    }

    skipTurn(): void {
        const timesToEnd = 6;
        this.incrementSkipCounter();

        if (this.skipCounter === timesToEnd) {
            this.end(true);
            return;
        }

        this.end();
    }

    resetSkipCounter(): void {
        this.skipCounter = 0;
    }

    private incrementSkipCounter(): void {
        this.skipCounter++;
    }
}
