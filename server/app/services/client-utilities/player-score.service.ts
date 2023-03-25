import { LOSS_SCORE, MAX_SCORE, MIN_SCORE, WIN_SCORE } from '@app/constants/score';
import { Service } from 'typedi';
@Service()
export class PlayerScoreService {
    constructor() {}

    calculateScore(currentPlayerScore: number, playerWonGame: boolean): number {
        if (playerWonGame) return this.winScore(currentPlayerScore);
        return this.lossScore(currentPlayerScore);
    }

    lossScore(currentPlayerScore: number): number {
        const newScore = currentPlayerScore + LOSS_SCORE;
        return newScore < MIN_SCORE ? MIN_SCORE : newScore;
    }

    winScore(currentPlayerScore: number): number {
        const newScore = currentPlayerScore + WIN_SCORE;
        return newScore > MAX_SCORE ? MAX_SCORE : newScore;
    }
}
