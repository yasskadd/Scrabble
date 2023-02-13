import { ReplaySubject } from 'rxjs';
import { Player } from './player/player.class';

const NUMBER_PLAYER = 2;
const SECOND = 1000;

export class Turn {
    activePlayer: string | undefined;
    inactivePlayer: string | undefined;
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

    determinePlayer(player1: Player, player2: Player): void {
        const randomNumber: number = Math.floor(Math.random() * NUMBER_PLAYER);
        this.activePlayer = randomNumber === 0 ? player1.name : player2.name;
        this.inactivePlayer = randomNumber === 0 ? player2.name : player1.name;
    }

    end(endGame?: boolean): void {
        clearInterval(this.timeOut as number);
        if (!endGame) {
            const tempInactivePlayer: string | undefined = this.inactivePlayer;
            this.inactivePlayer = this.activePlayer;
            this.activePlayer = tempInactivePlayer;
            this.start();
            this.endTurn.next(this.activePlayer);
            return;
        }
        this.activePlayer = undefined;
        this.inactivePlayer = undefined;
        this.endTurn.next(this.activePlayer);
    }

    validating(playerName: string): boolean {
        return String(this.activePlayer) === playerName;
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
