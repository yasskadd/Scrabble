import { PlayerType } from '@common/models/player-type';

export interface PlayerGameResult {
    playerId: string;
    playerType?: PlayerType;
    score: number;
}

export interface GameHistoryInfo {
    roomId: string;
    mode: string;
    playerWonGame: boolean;
    abandoned: boolean;
    beginningTime: Date;
    endTime: Date;
    duration: number;
    playerId: string;
    playerScore: number;
    // gameResult: PlayerGameResult[];
}
