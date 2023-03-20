import { Service } from 'typedi';
const LOSS_SCORE = -5;
const WIN_SCORE = 10;

@Service()
export class PlayerScoreService {
    constructor() {}

    calculateScore(currentPlayerScore: number, playerGameResult: string): number {}

    lossScore(currentPlayerScore: number): number {
        return currentPlayerScore + LOSS_SCORE;
    }

    winScore(currentPlayerScore: number): number {
        return currentPlayerScore + WIN_SCORE;
    }
}
