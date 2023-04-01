export interface GameHistoryInfo {
    roomId: string;
    mode: string;
    playerWonGame: boolean;
    abandoned: boolean;
    beginningTime: Date;
    endTime: Date;
    duration: string;
    playerId: string;
    playerScore: number;
}
