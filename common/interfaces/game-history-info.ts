export interface GameHistoryInfo {
    mode: string;
    abandoned: boolean;
    beginningTime: Date;
    endTime: Date;
    duration: string;
    firstPlayerName: string;
    firstPlayerScore: number;
    secondPlayerName: string;
    secondPlayerScore: number;
}
