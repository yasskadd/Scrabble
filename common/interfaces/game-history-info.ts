export interface PlayerGameResult {
    name: string;
    score: number;
}

export interface GameHistoryInfo {
    mode: string;
    abandoned: boolean;
    beginningTime: Date;
    endTime: Date;
    duration: string;
    gameResult: PlayerGameResult[];
}
