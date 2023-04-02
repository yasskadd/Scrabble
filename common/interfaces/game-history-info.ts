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
}
