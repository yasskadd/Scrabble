import { Game } from '@app/classes/game.class';
import { BotInformation } from '@app/interfaces/bot-information';
import { Letter } from '@common/interfaces/letter';
import { Objective } from '@common/interfaces/objective';
import { PlayerGameResult } from '@common/interfaces/player-game-result';
import { PlayerInformation } from '@common/interfaces/player-information';
import { RoomPlayer } from '@common/interfaces/room-player';
import { IUser } from '@common/interfaces/user';
import { PlayerType } from '@common/models/player-type';
import * as uuid from 'uuid';
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
        };
    }

    getGameResult(): PlayerGameResult {
        return {
            // eslint-disable-next-line no-underscore-dangle
            playerId: this.player.type === PlayerType.Bot ? this.player.user.username : this.player.user._id,
            playerType: this.player.type,
            score: this.score,
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
        const bot = new BeginnerBot(this.player, botInfo); // Where is isPlayerOne in GamePlayer class ?
        const name: string = this.player.user.username;
        bot.player.user = {
            _id: uuid.v4(),
            username: name + 'Bot',
            password: 'null',
            profilePicture: {
                name: 'bot-image',
                isDefaultPicture: true,
                key: 'f553ba598dbcfc7e9e07f8366b6684b5.jpg',
            },
            chatRooms: [],
        } as IUser;
        bot.rack = this.rack;
        bot.score = this.score;
        bot.objectives = this.objectives;
        bot.fiveLettersPlacedCount = this.fiveLettersPlacedCount;
        bot.clueCommandUseCount = this.clueCommandUseCount;
        return bot;
    }
}
