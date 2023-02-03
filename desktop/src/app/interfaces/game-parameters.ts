export interface GameParameters {
    username: string;
    dictionary: string;
    timer: number;
    mode: string;
    isMultiplayer: boolean;
    opponent?: string;
    botDifficulty?: string;
}
