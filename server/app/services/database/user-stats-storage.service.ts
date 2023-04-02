/* eslint-disable quote-props */
import { LOSS_SCORE, MAX_SCORE, MIN_SCORE, WIN_SCORE } from '@app/constants/score';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { UserStats } from '@common/interfaces/user-stats';
import { Document, ObjectId } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

@Service()
export class UserStatsStorageService {
    constructor(private database: DatabaseService) {}

    async getUserStats(id: string): Promise<UserStats> {
        const userStats = (await this.database.usersStats.fetchDocuments({ _id: new ObjectId(id) })) as Document;
        return userStats as UserStats;
    }

    async updatePlayerStats(gameHistoryInfo: GameHistoryInfo): Promise<void> {
        await this.updateScore(gameHistoryInfo);
        await this.updateGameStats(gameHistoryInfo);
    }

    private async updateScore(gameHistoryInfo: GameHistoryInfo): Promise<void> {
        if (gameHistoryInfo.playerWonGame) {
            await this.database.usersStats.collection.updateOne(
                { _id: new ObjectId(gameHistoryInfo.playerId) },
                {
                    $inc: {
                        score: {
                            $cond: {
                                if: { $lt: ['$score', MAX_SCORE - WIN_SCORE] },
                                then: WIN_SCORE,
                                else: MAX_SCORE,
                            },
                        },
                    },
                },
            );
        } else {
            await this.database.usersStats.collection.updateOne(
                { _id: new ObjectId(gameHistoryInfo.playerId) },
                {
                    $inc: {
                        score: {
                            $cond: {
                                if: { $gt: ['$score', MIN_SCORE - LOSS_SCORE] },
                                then: LOSS_SCORE,
                                else: MIN_SCORE,
                            },
                        },
                    },
                },
            );
        }
    }

    private async updateGameStats(gameHistoryInfo: GameHistoryInfo): Promise<void> {
        await this.database.users.collection.updateOne(
            { _id: new ObjectId(gameHistoryInfo.playerId) },
            {
                $inc: {
                    $cond: {
                        if: { $eq: [gameHistoryInfo.playerWonGame, true] },
                        then: { win: 1 },
                        else: { loss: 1 },
                    },
                    gamePlayed: 1,
                    totalDuration: gameHistoryInfo.duration,
                    totalGamePoints: gameHistoryInfo.playerScore,
                },
                $set: {
                    averageGameTime: { $divide: ['$totalDuration', '$gamePlayed'] },
                    averageGamePoints: { $divide: ['$totalGamePoints', '$gamePlayed'] },
                },
            },
        );
    }
}
