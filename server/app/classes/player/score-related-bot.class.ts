/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Constant from '@app/constants/bot';
import { PlayMoves } from '@app/constants/bot';
import { BotInformation } from '@app/interfaces/bot-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { BeginnerBot } from './beginner-bot.class';

export class ScoreRelatedBot extends BeginnerBot {
    private opponentScore: number;
    private placeProb: number;
    private exchangeProb: number;
    private skipProb: number;

    constructor(roomPlayer: RoomPlayer, botInfo: BotInformation) {
        super(roomPlayer, botInfo);
    }

    setupScoreProbs(score: number): void {
        this.opponentScore = score < 1000 ? score : 1000;
        this.setUpProbabilities();
    }

    // Override playTurn() from BegginerBot
    playTurn(): void {
        const playMove: string = this.chooseMove();
        if (playMove === PlayMoves.Place) {
            this.placeLetters();
            return;
        }
        setTimeout(() => {
            if (playMove === PlayMoves.Skip) this.skipTurn();
            else this.exchangeLetters();
        }, Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
    }

    // Override placeLetters from BegginerBot
    placeLetters(): void {
        const commandInfoMap = this.processWordSolver();
        const commandInfoList = [...commandInfoMap.keys()].sort((a, b) => (commandInfoMap.get(a) as number) - (commandInfoMap.get(b) as number));
        if (commandInfoList.length === 0) {
            setTimeout(() => this.skipTurn(), Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
            return;
        }
        // Transform score to a number between 0 and 1
        let index = Math.floor((this.opponentScore / 1000) * commandInfoList.length);
        if (this.opponentScore === 1000) index = commandInfoList.length - 1;
        // Add 5% uncertainty
        const uncertainty: number = 0.05 * commandInfoList.length;
        const randomIndex = Math.floor(Math.random() * (index + uncertainty - (index - uncertainty) + 1)) + (index - uncertainty);
        index = randomIndex < commandInfoList.length && randomIndex > 0 ? randomIndex : index;
        const randomCommandInfo = commandInfoList[Math.floor(index)];
        if (this.countUp >= 3 && this.countUp < Constant.TIME_SKIP) this.placeWord(randomCommandInfo);
        else if (this.countUp < 3) setTimeout(() => this.placeWord(randomCommandInfo), Constant.SECOND_3 - this.countUp * Constant.SECOND_1);
    }

    private chooseMove(): string {
        if (!(this.placeProb && this.exchangeProb && this.skipProb)) return 'error';
        const moveProb = Math.random();
        if (moveProb < this.placeProb) {
            return PlayMoves.Place;
        } else if (moveProb < this.placeProb + this.exchangeProb) {
            return PlayMoves.Exchange;
        } else {
            return PlayMoves.Skip;
        }
    }

    private setUpProbabilities(): void {
        if (this.opponentScore >= 0 && this.opponentScore <= 430) {
            this.placeProb = 0.34;
            this.exchangeProb = 0.33;
            this.skipProb = 0.33;
        } else {
            this.placeProb = 1 / (1 + Math.exp((-1 * (this.opponentScore - 500)) / 100));
            this.exchangeProb = 0.5 * (1 - this.placeProb);
            this.skipProb = 1 - this.placeProb - this.exchangeProb;
        }
    }
}
