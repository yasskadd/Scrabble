import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class HistoryStorageService {
    constructor(private databaseService: DatabaseService) {}

    async getHistory(): Promise<Document[]> {
        return (await this.databaseService.histories.fetchDocuments({})).reverse();
    }

    async getHistoryByUser(userId: string): Promise<Document[]> {
        return (await this.databaseService.histories.fetchDocuments({ playerId: userId })).reverse();
    }

    async clearHistory() {
        await this.databaseService.histories.resetCollection();
    }

    async addToHistory(gameInfo: GameHistoryInfo) {
        await this.databaseService.histories.addDocument(gameInfo);
    }
}
