import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

const SECOND_IN_MILLISECOND = 1000;
const SECOND_AND_MINUTE_MAX_VALUE = 60;
const MINIMUM_TWO_UNITS = 10;

@Service()
export class HistoryStorageService {
    constructor(private databaseService: DatabaseService, private gamesHandler: GamesHandler) {}

    async getHistory(): Promise<Document[]> {
        return (await this.databaseService.histories.fetchDocuments({})).reverse();
    }

    async clearHistory() {
        await this.databaseService.histories.resetCollection();
    }

    async addToHistory(gameInfo: GameHistoryInfo) {
        await this.databaseService.histories.addDocument(gameInfo);
    }

    formatGameInfo(roomId: string): GameHistoryInfo | undefined {
        const players = this.gamesHandler.getPlayersFromRoomId(roomId);
        if (!players) return;

        const endTime = new Date();
        return {
            mode: players[0].game.gameMode,
            abandoned: players[0].game.isGameAbandoned,
            beginningTime: players[0].game.beginningTime,
            endTime,
            duration: this.computeDuration(players[0].game.beginningTime, endTime),
            firstPlayerName: players[0].player.user.username,
            firstPlayerScore: players[0].score,
            secondPlayerName: players[1].player.user.username,
            secondPlayerScore: players[1].score,
        } as GameHistoryInfo;
    }

    private computeDuration(date1: Date, date2: Date): string {
        const milliseconds = Math.abs(date2.getTime() - date1.getTime());
        const seconds = Math.floor((milliseconds / SECOND_IN_MILLISECOND) % SECOND_AND_MINUTE_MAX_VALUE);
        const minutes = Math.floor(milliseconds / (SECOND_IN_MILLISECOND * SECOND_AND_MINUTE_MAX_VALUE));

        return (minutes < MINIMUM_TWO_UNITS ? '0' + minutes : minutes) + ':' + (seconds < MINIMUM_TWO_UNITS ? '0' + seconds : seconds);
    }
}
