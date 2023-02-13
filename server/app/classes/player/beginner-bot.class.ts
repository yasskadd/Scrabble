import * as Constant from '@app/constants/bot';
import { SocketEvents } from '@common/constants/socket-events';
import { CommandInfo } from '@common/interfaces/command-info';
import { Bot } from './bot.class';

export class BeginnerBot extends Bot {
    playTurn(): void {
        const randomNumber = this.getRandomNumber(Constant.MAX_NUMBER);
        if (randomNumber >= 3) {
            this.placeLetters();
            return;
        }
        setTimeout(() => {
            if (randomNumber === 1) this.skipTurn();
            else this.exchangeLetters();
        }, Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
    }

    exchangeLetters(): void {
        if (this.game === undefined || this.playedTurned || this.game.letterReserve.totalQuantity() < Constant.letterReserveMinQuantity) return;
        const rack: string[] = [...this.rackToString()];
        let numberOfLetters = this.getRandomNumber(rack.length);
        const lettersToExchange: string[] = new Array();
        while (numberOfLetters > 0) {
            lettersToExchange.push(rack.splice(this.getRandomNumber(rack.length) - 1, 1)[0]);
            numberOfLetters--;
        }
        this.socketManager.emitRoom(this.botInfo.roomId, SocketEvents.GameMessage, `!echanger ${lettersToExchange.length} lettres`);
        this.rack = this.game.exchange(lettersToExchange, this);
        this.playedTurned = true;
    }

    placeLetters() {
        const commandInfoList = this.addCommandInfoToList(this.processWordSolver(), this.getRandomNumber(Constant.MAX_NUMBER));
        if (commandInfoList.length === 0) {
            setTimeout(() => this.skipTurn(), Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
            return;
        }
        const randomCommandInfo = commandInfoList[Math.floor(Math.random() * commandInfoList.length)];
        if (this.countUp >= 3 && this.countUp < Constant.TIME_SKIP) this.play(randomCommandInfo);
        else if (this.countUp < 3) setTimeout(() => this.play(randomCommandInfo), Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
    }

    private addCommandInfoToList(commandInfoMap: Map<CommandInfo, number>, randomNumber: number): CommandInfo[] {
        const commandInfoList = new Array();
        if (this.inRange(randomNumber, 1, Constant.PROB_4)) {
            commandInfoMap.forEach((value, key) => {
                if (this.inRange(value, 1, Constant.RANGE_6)) commandInfoList.push(key);
            });
            return commandInfoList;
        }
        if (this.inRange(randomNumber, Constant.PROB_5, Constant.PROB_7)) {
            commandInfoMap.forEach((value, key) => {
                if (this.inRange(value, Constant.RANGE_7, Constant.RANGE_12)) commandInfoList.push(key);
            });
            return commandInfoList;
        }

        commandInfoMap.forEach((value, key) => {
            if (this.inRange(value, Constant.RANGE_13, Constant.RANGE_18)) commandInfoList.push(key);
        });
        return commandInfoList;
    }

    private inRange(x: number, start: number, end: number): boolean {
        return (x - start) * (x - end) <= 0;
    }
}
