import { GamesHandler } from '@app/services/games-management/games-handler.service';
import { GamesStateService } from '@app/services/games-management/games-state.service';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

const SECOND_IN_MILLISECOND = 1000;
const SECOND_AND_MINUTE_MAX_VALUE = 60;
const MINIMUM_TWO_UNITS = 10;

@Service()
export class HistoryStorageService {
    constructor(private databaseService: DatabaseService, private gamesState: GamesStateService, private gamesHandler: GamesHandler) {
        this.gamesState.gameEnded.subscribe((room) => {
            const gameInfo = this.formatGameInfo(room);
            this.addToHistory(gameInfo);
        });
    }

    async getHistory(): Promise<Document[]> {
        const history = await (await this.databaseService.histories.fetchDocuments({})).reverse();
        return history;
    }

    async clearHistory() {
        await this.databaseService.histories.resetCollection();
    }

    private async addToHistory(gameInfo: GameHistoryInfo) {
        await this.databaseService.histories.addDocument(gameInfo);
    }

    private formatGameInfo(room: string): GameHistoryInfo {
        const players = this.gamesHandler.gamePlayers.get(room);
        if (players === undefined) return {} as GameHistoryInfo;
        const endTime = new Date();
        return {
            mode: players[0].game.gameMode,
            abandoned: players[0].game.isGameAbandoned,
            beginningTime: players[0].game.beginningTime,
            endTime,
            duration: this.computeDuration(players[0].game.beginningTime, endTime),
            firstPlayerName: players[0].name,
            firstPlayerScore: players[0].score,
            secondPlayerName: players[1].name,
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
