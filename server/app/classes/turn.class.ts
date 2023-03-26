import { ReplaySubject } from 'rxjs';
import { GamePlayer } from './player/player.class';

const SECOND = 1000;

export class Turn {
    activePlayer: string | undefined;
    inactivePlayers: string[] | undefined;
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
        this.activePlayer = players[randomNumber].name;
        const inactivePlayers = players.filter((player) => {
            return player.name !== this.activePlayer;
        });
        const inactivePlayersName = inactivePlayers.map((player) => {
            return player.name;
        });
        this.inactivePlayers = inactivePlayersName;
    }

    end(endGame?: boolean): void {
        clearInterval(this.timeOut as number);
        if (!endGame) {
            const tempInactivePlayer: string | undefined = (this.inactivePlayers as string[]).shift();
            this.inactivePlayers?.push(this.activePlayer as string);
            this.activePlayer = tempInactivePlayer;
            this.start();
            this.endTurn.next(this.activePlayer);
            return;
        }
        this.activePlayer = undefined;
        this.inactivePlayers = undefined;
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
