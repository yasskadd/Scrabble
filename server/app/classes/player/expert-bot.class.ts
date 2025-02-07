import * as Constant from '@app/constants/bot';
import { SocketEvents } from '@common/constants/socket-events';
import { PlaceWordCommandInfo } from '@common/interfaces/place-word-command-info';
import { Bot } from './bot.class';

export class ExpertBot extends Bot {
    playTurn(): void {
        const bestCommandInfo: PlaceWordCommandInfo = [...this.processWordSolver().entries()].reduce(
            (highestScore, currentScore) => {
                return currentScore[1] > highestScore[1] ? currentScore : highestScore;
            },
            [undefined as never, 0],
        )[0];
        if (this.countUp >= 3 && this.countUp < Constant.TIME_SKIP) {
            this.placeWord(bestCommandInfo);
        } else if (this.countUp < 3) {
            setTimeout(() => this.placeWord(bestCommandInfo), Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
        }
    }

    placeWord(commandInfo: PlaceWordCommandInfo): void {
        if (commandInfo === undefined) {
            this.exchangeLetters();
            return;
        }
        this.isNotTurn = true;
        this.emitPlaceCommand(commandInfo);
    }

    exchangeLetters(): void {
        if (this.game === undefined || this.isNotTurn) return;
        let lettersLeftInReserve: number = this.game.letterReserve.totalQuantity();
        const rackStringArray: string[] = [...this.rackToString()];
        if (lettersLeftInReserve === 0) {
            this.skipTurn();
            this.isNotTurn = true;
            return;
        }

        if (lettersLeftInReserve >= Constant.letterReserveMinQuantity) {
            this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, `!echanger ${rackStringArray.length} lettres`);
            this.game.exchange(rackStringArray, this);
            this.isNotTurn = true;
            return;
        }
        const lettersToExchange: string[] = new Array();
        while (lettersLeftInReserve > 0 && rackStringArray.length > 0) {
            lettersToExchange.push(rackStringArray.splice(this.getRandomNumber(rackStringArray.length) - 1, 1)[0]);
            lettersLeftInReserve--;
        }
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, `!echanger ${lettersToExchange.length} lettres`);
        this.rack = this.game.exchange(lettersToExchange, this);

        this.isNotTurn = true;
    }
}
