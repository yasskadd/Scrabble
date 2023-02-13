import * as Constant from '@app/constants/bot';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Bot } from './bot.class';

export class ExpertBot extends Bot {
    playTurn(): void {
        const bestCommandInfo: CommandInfo = [...this.processWordSolver().entries()].reduce(
            (highestScore, currentScore) => {
                return currentScore[1] > highestScore[1] ? currentScore : highestScore;
            },
            [undefined as never, 0],
        )[0];
        if (this.countUp >= 3 && this.countUp < Constant.TIME_SKIP) {
            this.play(bestCommandInfo);
        } else if (this.countUp < 3) {
            setTimeout(() => this.play(bestCommandInfo), Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
        }
    }

    play(commandInfo: CommandInfo): void {
        if (commandInfo === undefined) {
            this.exchangeLetters();
            return;
        }
        this.emitPlaceCommand(commandInfo);
        this.playedTurned = true;
    }

    exchangeLetters(): void {
        if (this.game === undefined || this.playedTurned) return;
        let lettersLeftInReserve: number = this.game.letterReserve.totalQuantity();
        const rackStringArray: string[] = [...this.rackToString()];
        if (lettersLeftInReserve === 0) {
            this.skipTurn();
            this.playedTurned = true;
            return;
        }

        if (lettersLeftInReserve >= Constant.letterReserveMinQuantity) {
            this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, `!echanger ${rackStringArray.length} lettres`);
            this.game.exchange(rackStringArray, this);
            this.playedTurned = true;
            return;
        }
        const lettersToExchange: string[] = new Array();
        while (lettersLeftInReserve > 0 && rackStringArray.length > 0) {
            lettersToExchange.push(rackStringArray.splice(this.getRandomNumber(rackStringArray.length) - 1, 1)[0]);
            lettersLeftInReserve--;
        }
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, `!echanger ${lettersToExchange.length} lettres`);
        this.rack = this.game.exchange(lettersToExchange, this);

        this.playedTurned = true;
    }
}
