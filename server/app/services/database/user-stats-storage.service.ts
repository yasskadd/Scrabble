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
        const newScore = this.calculateScore(userStats.score, gameHistoryInfo.playerWonGame);
        const newGamePlayed = userStats.gamePlayed + 1;
        const newWin = gameHistoryInfo.playerWonGame ? userStats.win + 1 : userStats.win;
        const newLoss = gameHistoryInfo.playerWonGame ? userStats.loss : userStats.loss + 1;
        const newTotalGameTime = userStats.totalGameTime + gameHistoryInfo.duration;
        const newTotalGameScore = userStats.totalGameScore + gameHistoryInfo.playerScore;
        const newAverageGameTime = this.msToMinSec(newTotalGameTime / newGamePlayed);
        const newAverageGameScore = newTotalGameScore / newGamePlayed;
        await this.database.usersStats.collection.updateOne(
            { userIdRef: new ObjectId(gameHistoryInfo.playerId) },
            {
                $set: {
                    score: newScore,
                    gamePlayed: newGamePlayed,
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

    private calculateScore(originalScore: number, playerWonGame: boolean): number {
        let newScore: number;
        if (playerWonGame) {
            newScore = originalScore + WIN_SCORE;
            return newScore < MAX_SCORE ? newScore : MAX_SCORE;
        }

        newScore = originalScore + LOSS_SCORE;
        return newScore > MIN_SCORE ? newScore : MIN_SCORE;
    }

    private msToMinSec(milliseconds: number): string {
        const seconds = Math.floor((milliseconds / SECOND_IN_MILLISECOND) % SECOND_AND_MINUTE_MAX_VALUE);
        const minutes = Math.floor(milliseconds / (SECOND_IN_MILLISECOND * SECOND_AND_MINUTE_MAX_VALUE));

        return (minutes < MINIMUM_TWO_UNITS ? '0' + minutes : minutes) + ':' + (seconds < MINIMUM_TWO_UNITS ? '0' + seconds : seconds);
    }
}
