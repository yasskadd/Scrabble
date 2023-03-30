import { IUser } from '@common/interfaces/user';
import { ReplaySubject } from 'rxjs';
import { GamePlayer } from './player/player.class';

const SECOND = 1000;

export class Turn {
    activePlayer: IUser | undefined;
    inactivePlayers: IUser[] | undefined;
    endTurn: ReplaySubject<string | undefined>;
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
        const randomNumber: number = Math.floor(Math.random() * players.length);
        this.activePlayer = players[randomNumber].player.user;
        this.inactivePlayers = players
            .filter((player) => {
                return player.player.user !== this.activePlayer;
            })
            .map((player) => {
                return player.player.user;
            });
    }

    end(endGame?: boolean): void {
        clearInterval(this.timeOut as number);
        if (!endGame) {
            const tempInactivePlayer: IUser | undefined = this.inactivePlayers?.shift();
            if (this.activePlayer) {
                this.inactivePlayers?.push(this.activePlayer);
            }
            this.activePlayer = tempInactivePlayer;
            this.start();
            this.endTurn.next(this.activePlayer?.username);
            return;
        }
        this.activePlayer = undefined;
        this.inactivePlayers = undefined;
        this.endTurn.next(this.activePlayer);
    }

    validating(playerName: string): boolean {
        return this.activePlayer?.username === playerName;
    }

    skipTurn(): void {
        const timesToEnd = 6;
        this.incrementSkipCounter();
        if (this.skipCounter !== timesToEnd) {
            this.end();
            return;
        }
        this.end(true);
    }

    resetSkipCounter(): void {
        this.skipCounter = 0;
    }

    private incrementSkipCounter(): void {
        this.skipCounter++;
    }
}
