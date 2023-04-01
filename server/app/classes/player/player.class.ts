import { Game } from '@app/classes/game.class';
import { BotInformation } from '@app/interfaces/bot-information';
import { Letter } from '@common/interfaces/letter';
import { Objective } from '@common/interfaces/objective';
import { PlayerInformation } from '@common/interfaces/player-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { BeginnerBot } from './beginner-bot.class';

export class GamePlayer {
    rack: Letter[];
    score: number;
    player: RoomPlayer;
    game: Game;
    objectives: Objective[];
    fiveLettersPlacedCount: number;
    clueCommandUseCount: number;

    constructor(player: RoomPlayer) {
        this.player = player;
        this.rack = [];
        this.score = 0;
        this.objectives = [];
        this.fiveLettersPlacedCount = 0;
        this.clueCommandUseCount = 0;
    }

    getInformation(): PlayerInformation {
        return {
            player: this.player,
            score: this.score,
            rack: this.rack,
            gameboard: this.game.gameboard.toStringArray(),
        };
    }

    rackIsEmpty(): boolean {
        return this.rack.length === 0;
    }

    rackToString() {
        const stringArray: string[] = [];
        this.rack.forEach((letter) => {
            stringArray.push(letter.value);
        });
        return stringArray;
    }

    deductPoints() {
        let pointsToDeduct = 0;
        for (const letter of this.rack) {
            pointsToDeduct += letter.points;
        }
        this.score -= pointsToDeduct;

        if (this.score < 0) {
            this.score = 0;
        }
    }

    addPoints(rack: Letter[]) {
        let pointsToAdd = 0;
        for (const letter of rack) {
            pointsToAdd += letter.points;
        }
        this.score += pointsToAdd;
    }

    convertPlayerToBot(): BeginnerBot {
        const botInfo: BotInformation = {
            timer: this.game.turn.time,
            roomId: this.player.roomId,
            dictionaryValidation: this.game.dictionaryValidation,
        };
        const bot = new BeginnerBot(true, this.player, botInfo); // Where is isPlayerOne in GamePlayer class ?
        bot.rack = this.rack;
        bot.score = this.score;
        bot.objectives = this.objectives;
        bot.fiveLettersPlacedCount = this.fiveLettersPlacedCount;
        bot.clueCommandUseCount = this.clueCommandUseCount;
        return bot;
    }
}
