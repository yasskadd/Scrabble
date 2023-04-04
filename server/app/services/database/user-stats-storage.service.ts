/* eslint-disable quote-props */
import { LOSS_SCORE, MAX_SCORE, MIN_SCORE, WIN_SCORE } from '@app/constants/score';
import { GameHistoryInfo } from '@common/interfaces/game-history-info';
import { UserStats } from '@common/interfaces/user-stats';
import { Document, ObjectId } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

const SECOND_IN_MILLISECOND = 1000;
const SECOND_AND_MINUTE_MAX_VALUE = 60;
const MINIMUM_TWO_UNITS = 10;
@Service()
export class UserStatsStorageService {
    constructor(private database: DatabaseService) {}

    async getUserStats(id: string): Promise<UserStats> {
        const userStats = (await this.database.usersStats.fetchDocuments({ userIdRef: new ObjectId(id) }))[0] as Document;
        return userStats as UserStats;
    }

    async updatePlayerStats(gameHistoryInfo: GameHistoryInfo): Promise<void> {
        const userStats = await this.getUserStats(gameHistoryInfo.playerId);
        const newRanking = this.calculateScore(userStats.ranking, gameHistoryInfo.playerWonGame);
        const newGameCount = userStats.gameCount + 1;
        const newWin = gameHistoryInfo.playerWonGame ? userStats.win + 1 : userStats.win;
        const newLoss = gameHistoryInfo.playerWonGame ? userStats.loss : userStats.loss + 1;
        const newTotalGameTime = userStats.totalGameTime + gameHistoryInfo.duration;
        const newTotalGameScore = userStats.totalGameScore + gameHistoryInfo.playerScore;
        const newAverageGameTime = this.msToMinSec(newTotalGameTime / newGameCount);
        const newAverageGameScore = newTotalGameScore / newGameCount;
        console.log(newAverageGameScore);
        await this.database.usersStats.collection.updateOne(
            { userIdRef: new ObjectId(gameHistoryInfo.playerId) },
            {
                $set: {
                    ranking: newRanking,
                    gameCount: newGameCount,
                    win: newWin,
                    loss: newLoss,
                    totalGameTime: newTotalGameTime,
                    totalGameScore: newTotalGameScore,
                    averageGameTime: newAverageGameTime,
                    averageGameScore: newAverageGameScore,
                },
            },
        );
    }

    private calculateScore(originalRanking: number, playerWonGame: boolean): number {
        let newRanking: number;
        if (playerWonGame) {
            newRanking = originalRanking + WIN_SCORE;
            return newRanking < MAX_SCORE ? newRanking : MAX_SCORE;
        }

        newRanking = originalRanking + LOSS_SCORE;
        return newRanking > MIN_SCORE ? newRanking : MIN_SCORE;
    }

    private msToMinSec(milliseconds: number): string {
        const seconds = Math.floor((milliseconds / SECOND_IN_MILLISECOND) % SECOND_AND_MINUTE_MAX_VALUE);
        const minutes = Math.floor(milliseconds / (SECOND_IN_MILLISECOND * SECOND_AND_MINUTE_MAX_VALUE));

        return (minutes < MINIMUM_TWO_UNITS ? '0' + minutes : minutes) + ':' + (seconds < MINIMUM_TWO_UNITS ? '0' + seconds : seconds);
    }
}
